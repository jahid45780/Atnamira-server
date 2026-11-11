
import crypto from "crypto";
import axios from "axios";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { envVers } from "../../config/env";
import { GTMResource, IGTMPayload, IGTMState } from "./google.tag.interface";
import AppError from "../../errorHerplrs/appError";
import { GoogleTagManager } from "./google.tag.model";


const GTM_BASE_URL = "https://tagmanager.googleapis.com/tagmanager/v2";

const GTM_SCOPES = [
  "https://www.googleapis.com/auth/tagmanager.readonly",
  "https://www.googleapis.com/auth/tagmanager.edit.containers",
  "https://www.googleapis.com/auth/tagmanager.delete.containers",
  "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
  "https://www.googleapis.com/auth/tagmanager.publish",
];

const getOAuthClient = () => {
  return new OAuth2Client(
    envVers.GOOGLE_TAG_MANAGER_CLIENT_ID,
    envVers.GOOGLE_TAG_MANAGER_CLIENT_SECRET,
    envVers.GOOGLE_TAG_MANAGER_REDIRECT_URI,
  );
};

// --------------------------------------------------
// TOKEN ENCRYPTION
// --------------------------------------------------

const getEncryptionKey = (): Buffer => {
  const key = envVers.GOOGLE_TOKEN_ENCRYPTION_KEY;

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "GOOGLE_TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters",
    );
  }

  return Buffer.from(key, "hex");
};

const encryptToken = (token: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

const decryptToken = (encryptedToken: string): string => {
  const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted Google token");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

// --------------------------------------------------
// OAUTH
// --------------------------------------------------

const createStateToken = (userId: string): string => {
  return jwt.sign(
    {
      userId,
      purpose: "google-tag-manager",
    } satisfies IGTMState,
    envVers.JWT_ACCESS_SECRET,
    {
      expiresIn: "10m",
    },
  );
};

const verifyStateToken = (state: string): IGTMState => {
  const decoded = jwt.verify(
    state,
    envVers.JWT_ACCESS_SECRET,
  ) as IGTMState;

  if (decoded.purpose !== "google-tag-manager" || !decoded.userId) {
    throw new AppError(400, "Invalid Google Tag Manager OAuth state");
  }

  return decoded;
};

const getConnectionUrl = (userId: string): string => {
  const oauth2Client = getOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: GTM_SCOPES,
    state: createStateToken(userId),
  });
};

const connectGoogleTagManager = async (
  code: string,
  state: string,
) => {
  const decodedState = verifyStateToken(state);
  const oauth2Client = getOAuthClient();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new AppError(400, "Google access token was not received");
  }

  oauth2Client.setCredentials(tokens);

  const { data: profile } = await oauth2Client.request<{
    email?: string;
    verified_email?: boolean;
  }>({
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
  });

  if (!profile.email) {
    throw new AppError(400, "Unable to retrieve Google account email");
  }

  const existingConnection = await GoogleTagManager.findOne({
    connectedBy: decodedState.userId,
  }).select("+refreshToken");

  const refreshToken =
    tokens.refresh_token ||
    (existingConnection?.refreshToken
      ? decryptToken(existingConnection.refreshToken)
      : undefined);

  const connectionData = {
    googleEmail: profile.email,
    accessToken: encryptToken(tokens.access_token),
    ...(refreshToken
      ? { refreshToken: encryptToken(refreshToken) }
      : {}),
    tokenExpiryDate: tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : undefined,
    isConnected: true,
    connectedBy: decodedState.userId,
  };

  const connection = await GoogleTagManager.findOneAndUpdate(
    { connectedBy: decodedState.userId },
    { $set: connectionData },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return {
    googleEmail: connection.googleEmail,
    isConnected: connection.isConnected,
  };
};

// --------------------------------------------------
// CONNECTION
// --------------------------------------------------

const getConnection = async (userId: string) => {
  const connection = await GoogleTagManager.findOne({
    connectedBy: userId,
    isConnected: true,
  });

  if (!connection) {
    throw new AppError(404, "Google Tag Manager is not connected");
  }

  return connection;
};

const getSafeConnection = async (userId: string) => {
  const connection = await GoogleTagManager.findOne({
    connectedBy: userId,
  }).select("-accessToken -refreshToken");

  if (!connection) {
    return {
      isConnected: false,
      googleEmail: null,
    };
  }

  return connection;
};

// --------------------------------------------------
// AUTHENTICATED GOOGLE CLIENT
// --------------------------------------------------

const getAuthenticatedClient = async (userId: string) => {
  const connection = await GoogleTagManager.findOne({
    connectedBy: userId,
    isConnected: true,
  }).select("+accessToken +refreshToken");

  if (!connection) {
    throw new AppError(404, "Google Tag Manager is not connected");
  }

  const oauth2Client = getOAuthClient();

  const accessToken = decryptToken(connection.accessToken);

  const refreshToken = connection.refreshToken
    ? decryptToken(connection.refreshToken)
    : undefined;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: connection.tokenExpiryDate?.getTime(),
  });

  // Refresh the token before expiry.
  const isExpired =
    !connection.tokenExpiryDate ||
    connection.tokenExpiryDate.getTime() <= Date.now() + 60_000;

  if (isExpired) {
    if (!refreshToken) {
      throw new AppError(
        401,
        "Google refresh token is unavailable. Please reconnect Google Tag Manager.",
      );
    }

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error("Google did not return a refreshed access token");
      }

      oauth2Client.setCredentials(credentials);

      connection.accessToken = encryptToken(credentials.access_token);

      if (credentials.refresh_token) {
        connection.refreshToken = encryptToken(
          credentials.refresh_token,
        );
      }

      connection.tokenExpiryDate = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : undefined;

      await connection.save();
    } catch {
      throw new AppError(
        401,
        "Google authentication expired. Please reconnect your account.",
      );
    }
  }

  return oauth2Client;
};

// --------------------------------------------------
// GOOGLE TAG MANAGER API REQUEST
// --------------------------------------------------

const gtmRequest = async <T>(
  userId: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: unknown,
  params?: Record<string, unknown>,
): Promise<T> => {
  const auth = await getAuthenticatedClient(userId);

  try {
    const response = await auth.request<T>({
      url: `${GTM_BASE_URL}/${path}`,
      method,
      data,
      params,
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const googleMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.error_description;

      throw new AppError(
        error.response?.status || 500,
        googleMessage || "Google Tag Manager API request failed",
      );
    }

    throw error;
  }
};

// --------------------------------------------------
// ACCOUNTS
// --------------------------------------------------

const getAccounts = async (userId: string) => {
  return gtmRequest(userId, "GET", "accounts");
};

// --------------------------------------------------
// CONTAINERS
// --------------------------------------------------

const getContainers = async (
  userId: string,
  accountId: string,
) => {
  return gtmRequest(
    userId,
    "GET",
    `accounts/${accountId}/containers`,
  );
};

const createContainer = async (
  userId: string,
  accountId: string,
  payload: Record<string, unknown>,
) => {
  return gtmRequest(
    userId,
    "POST",
    `accounts/${accountId}/containers`,
    payload,
  );
};

// --------------------------------------------------
// WORKSPACES
// --------------------------------------------------

const getWorkspaces = async (
  userId: string,
  accountId: string,
  containerId: string,
) => {
  return gtmRequest(
    userId,
    "GET",
    `accounts/${accountId}/containers/${containerId}/workspaces`,
  );
};

const createWorkspace = async (
  userId: string,
  accountId: string,
  containerId: string,
  name: string,
) => {
  return gtmRequest(
    userId,
    "POST",
    `accounts/${accountId}/containers/${containerId}/workspaces`,
    { name },
  );
};

const getWorkspaceStatus = async (
  userId: string,
  accountId: string,
  containerId: string,
  workspaceId: string,
) => {
  return gtmRequest(
    userId,
    "GET",
    `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/status`,
  );
};

const quickPreviewWorkspace = async (
  userId: string,
  accountId: string,
  containerId: string,
  workspaceId: string,
) => {
  return gtmRequest(
    userId,
    "POST",
    `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}:quick_preview`,
    {},
  );
};

// --------------------------------------------------
// TAGS / TRIGGERS / VARIABLES
// --------------------------------------------------

const getResource = async (
  userId: string,
  accountId: string,
  containerId: string,
  workspaceId: string,
  resource: GTMResource,
) => {
  return gtmRequest(
    userId,
    "GET",
    `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/${resource}`,
  );
};

const createResource = async (
  userId: string,
  accountId: string,
  containerId: string,
  workspaceId: string,
  resource: GTMResource,
  payload: IGTMPayload,
) => {
  return gtmRequest(
    userId,
    "POST",
    `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/${resource}`,
    payload,
  );
};

const updateResource = async (
  userId: string,
  accountId: string,
  containerId: string,
  workspaceId: string,
  resource: GTMResource,
  resourceId: string,
  payload: IGTMPayload,
) => {
  return gtmRequest(
    userId,
    "PUT",
    `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/${resource}/${resourceId}`,
    payload,
  );
};

const deleteResource = async (
  userId: string,
  accountId: string,
  containerId: string,
  workspaceId: string,
  resource: GTMResource,
  resourceId: string,
) => {
  return gtmRequest(
    userId,
    "DELETE",
    `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/${resource}/${resourceId}`,
  );
};

// --------------------------------------------------
// VERSIONS & PUBLISHING
// --------------------------------------------------

const createVersion = async (
  userId: string,
  accountId: string,
  containerId: string,
  workspaceId: string,
  name?: string,
  notes?: string,
) => {
  return gtmRequest(
    userId,
    "POST",
    `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}:create_version`,
    {
      name,
      notes,
    },
  );
};

const getVersions = async (
  userId: string,
  accountId: string,
  containerId: string,
) => {
  return gtmRequest(
    userId,
    "GET",
    `accounts/${accountId}/containers/${containerId}/version_headers`,
  );
};

const publishVersion = async (
  userId: string,
  accountId: string,
  containerId: string,
  versionId: string,
) => {
  return gtmRequest(
    userId,
    "POST",
    `accounts/${accountId}/containers/${containerId}/versions/${versionId}:publish`,
    {},
  );
};

// --------------------------------------------------
// DISCONNECT
// --------------------------------------------------

const disconnectGoogleTagManager = async (userId: string) => {
  const connection = await GoogleTagManager.findOne({
    connectedBy: userId,
  }).select("+accessToken");

  if (!connection) {
    throw new AppError(404, "Google Tag Manager connection not found");
  }

  try {
    const token = decryptToken(connection.accessToken);

    await getOAuthClient().revokeToken(token);
  } catch {
    // Delete local credentials even if Google's revoke endpoint fails.
  }

  await GoogleTagManager.deleteOne({
    _id: connection._id,
    connectedBy: userId,
  });

  return {
    isConnected: false,
  };
};

export const GoogleTagManagerService = {
  getConnectionUrl,
  connectGoogleTagManager,
  getSafeConnection,
  getAccounts,
  getContainers,
  createContainer,
  getWorkspaces,
  createWorkspace,
  getWorkspaceStatus,
  quickPreviewWorkspace,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  createVersion,
  getVersions,
  publishVersion,
  disconnectGoogleTagManager,
};