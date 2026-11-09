

import { google, Auth } from "googleapis";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";

import AppError from "../../errorHerplrs/appError";
import { envVers } from "../../config/env";
import { GoogleSearchConsole } from "./google.search.model";


// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Google Search Console credentials are not configured"
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
};

// ============================================
// TOKEN ENCRYPTION
// ============================================

const getEncryptionKey = (): Buffer => {
  const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

  if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Google token encryption key must be a 64-character hexadecimal key"
    );
  }

  return Buffer.from(key, "hex");
};

const encryptToken = (token: string): string => {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
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
  const [ivHex, authTagHex, encryptedHex] =
    encryptedToken.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Invalid encrypted Google token"
    );
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

// ============================================
// SAFE RESPONSE
// ============================================

const getSafeConnection = (connection: any) => {
  return {
    _id: connection._id,
    googleEmail: connection.googleEmail,
    isConnected: connection.isConnected,
    selectedProperty: connection.selectedProperty,
    properties: connection.properties,
    connectedBy: connection.connectedBy,
    tokenExpiryDate: connection.tokenExpiryDate,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
};

// ============================================
// GOOGLE OAUTH URL
// ============================================

const getOAuthUrl = (adminId: string) => {
  const oauth2Client = getOAuthClient();

  const state = jwt.sign(
    {
      userId: adminId,
      purpose: "google-search-console",
    },
    envVers.JWT_ACCESS_SECRET,
    {
      expiresIn: "10m",
    }
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "https://www.googleapis.com/auth/webmasters",
    ],
    state,
  });
};

// ============================================
// GOOGLE OAUTH CALLBACK
// ============================================

const handleOAuthCallback = async (
  code: string,
  state: string
) => {
  if (!code || !state) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google authorization code or state is missing"
    );
  }

  let decodedState: JwtPayload;

  try {
    const decoded = jwt.verify(
      state,
      envVers.JWT_ACCESS_SECRET
    );

    if (
      typeof decoded === "string" ||
      decoded.purpose !== "google-search-console" ||
      !decoded.userId
    ) {
      throw new Error("Invalid OAuth state");
    }

    decodedState = decoded as JwtPayload;
  } catch {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired Google OAuth state"
    );
  }

  const oauth2Client = getOAuthClient();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google access token was not received"
    );
  }

  oauth2Client.setCredentials(tokens);

  // Get Google account information
  const oauth2 = google.oauth2({
    version: "v2",
    auth: oauth2Client,
  });

  const { data: account } = await oauth2.userinfo.get();

  if (!account.email) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Unable to retrieve Google account email"
    );
  }

  // Find existing connection
  const existingConnection = await GoogleSearchConsole.findOne({
    googleEmail: account.email,
  }).select("+accessToken +refreshToken");

  const refreshToken =
    tokens.refresh_token ||
    (existingConnection
      ? decryptToken(existingConnection.refreshToken)
      : undefined);

  if (!refreshToken) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google refresh token was not received. Please reconnect with consent."
    );
  }

  // Fetch Search Console properties
  const searchConsole = google.searchconsole({
    version: "v1",
    auth: oauth2Client,
  });

  const { data: sitesData } = await searchConsole.sites.list();

  const properties = (sitesData.siteEntry || []).map((site) => ({
    siteUrl: site.siteUrl || "",
    permissionLevel: site.permissionLevel || "unknown",
  })).filter((site) => site.siteUrl);

  const connectionData = {
    googleEmail: account.email.toLowerCase(),
    accessToken: encryptToken(tokens.access_token),
    refreshToken: encryptToken(refreshToken),
    tokenExpiryDate: tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : undefined,
    isConnected: true,
    properties,
    connectedBy: decodedState.userId,
  };

  // Save connection
  let connection;

  if (existingConnection) {
    existingConnection.set(connectionData);
    connection = await existingConnection.save();
  } else {
    connection = await GoogleSearchConsole.create(
      connectionData
    );
  }

  return getSafeConnection(connection);
};

// ============================================
// GET GOOGLE CONNECTION STATUS
// ============================================

const getConnectionStatus = async () => {
  const connection = await GoogleSearchConsole.findOne({
    isConnected: true,
  });

  if (!connection) {
    return {
      isConnected: false,
      googleEmail: null,
      properties: [],
      selectedProperty: null,
    };
  }

  return getSafeConnection(connection);
};

// ============================================
// REFRESH ACCESS TOKEN
// ============================================

const refreshAccessToken = async (connectionId: string) => {
  const connection = await GoogleSearchConsole.findById(
    connectionId
  ).select("+accessToken +refreshToken");

  if (!connection || !connection.isConnected) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google Search Console connection not found"
    );
  }

  const oauth2Client = getOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: decryptToken(connection.refreshToken),
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Unable to refresh Google access token"
    );
  }

  connection.accessToken = encryptToken(
    credentials.access_token
  );

  if (credentials.refresh_token) {
    connection.refreshToken = encryptToken(
      credentials.refresh_token
    );
  }

  connection.tokenExpiryDate = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : undefined;

  await connection.save();

  return getSafeConnection(connection);
};

// ============================================
// GET AUTHENTICATED GOOGLE CLIENT
// ============================================

const getAuthenticatedClient = async (
  connectionId: string
): Promise<Auth.OAuth2Client> => {
  let connection = await GoogleSearchConsole.findById(
    connectionId
  ).select("+accessToken +refreshToken");

  if (!connection || !connection.isConnected) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google Search Console is not connected"
    );
  }

  // Refresh when token is expired or about to expire
  const isExpired =
    !connection.tokenExpiryDate ||
    connection.tokenExpiryDate.getTime() <= Date.now() + 60000;

  if (isExpired) {
    await refreshAccessToken(connectionId);

    connection = await GoogleSearchConsole.findById(
      connectionId
    ).select("+accessToken +refreshToken");
  }

  if (!connection) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google connection not found"
    );
  }

  const oauth2Client = getOAuthClient();

  oauth2Client.setCredentials({
    access_token: decryptToken(connection.accessToken),
    refresh_token: decryptToken(connection.refreshToken),
    expiry_date: connection.tokenExpiryDate?.getTime(),
  });

  return oauth2Client;
};

// ============================================
// GET SEARCH CONSOLE PROPERTIES
// ============================================

const getProperties = async (connectionId: string) => {
  const auth = await getAuthenticatedClient(connectionId);

  const searchConsole = google.searchconsole({
    version: "v1",
    auth,
  });

  const { data } = await searchConsole.sites.list();

  return (data.siteEntry || []).map((site) => ({
    siteUrl: site.siteUrl,
    permissionLevel: site.permissionLevel,
  }));
};

// ============================================
// SELECT SEARCH CONSOLE PROPERTY
// ============================================

const selectProperty = async (
  connectionId: string,
  siteUrl: string
) => {
  const connection = await GoogleSearchConsole.findById(
    connectionId
  );

  if (!connection || !connection.isConnected) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google Search Console connection not found"
    );
  }

  const propertyExists = connection.properties?.some(
    (property: { siteUrl: string; }) => property.siteUrl === siteUrl
  );

  if (!propertyExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This property is not available in your Google account"
    );
  }

  connection.selectedProperty = siteUrl;

  await connection.save();

  return getSafeConnection(connection);
};

// ============================================
// DISCONNECT GOOGLE SEARCH CONSOLE
// ============================================

const disconnect = async (connectionId: string) => {
  const connection = await GoogleSearchConsole.findById(
    connectionId
  ).select("+accessToken +refreshToken");

  if (!connection) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google Search Console connection not found"
    );
  }

  // Revoke Google OAuth token
  const oauth2Client = getOAuthClient();

  try {
    await oauth2Client.revokeToken(
      decryptToken(connection.refreshToken)
    );
  } catch {
    // Continue local disconnection even if Google revocation fails
  }

  await GoogleSearchConsole.findByIdAndDelete(connectionId);

  return null;
};

// ============================================
// EXPORT SERVICE
// ============================================

export const googleSearchConsoleService = {
  getOAuthUrl,
  handleOAuthCallback,
  getConnectionStatus,
  refreshAccessToken,
  getAuthenticatedClient,
  getProperties,
  selectProperty,
  disconnect,
};
