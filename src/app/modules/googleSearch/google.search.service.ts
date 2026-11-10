import { google } from "googleapis";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";

import AppError from "../../errorHerplrs/appError";
import { envVers } from "../../config/env";
import { GoogleSearchConsole } from "./google.search.model";


// ---------------------------------------------
// Types
// ---------------------------------------------

type AnalyticsDimension = "query" | "page" | "country" | "device" | "date";

interface AnalyticsOptions {
  startDate: string;
  endDate: string;
  rowLimit?: number;
}

// ---------------------------------------------
// OAuth Client
// ---------------------------------------------

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Google Search Console OAuth environment variables are missing"
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// ---------------------------------------------
// Token Encryption / Decryption
// ---------------------------------------------

const getEncryptionKey = (): Buffer => {
  const encryptionKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

  if (!encryptionKey || !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "GOOGLE_TOKEN_ENCRYPTION_KEY must be a 64-character hexadecimal string"
    );
  }

  return Buffer.from(encryptionKey, "hex");
};

const encryptToken = (token: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

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
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error("Invalid encrypted token format");
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Unable to decrypt Google OAuth token. Check your encryption key."
    );
  }
};

// ---------------------------------------------
// Safe Connection Response
// ---------------------------------------------

const getSafeConnection = (connection: any) => {
  if (!connection) return null;

  return {
    id: connection._id,
    googleEmail: connection.googleEmail,
    isConnected: connection.isConnected,
    selectedProperty: connection.selectedProperty,
    properties: connection.properties || [],
    connectedBy: connection.connectedBy,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
};

// ---------------------------------------------
// Get OAuth Authorization URL
// ---------------------------------------------

const getOAuthUrl = async (adminId: string) => {
  const oauth2Client = getOAuthClient();

  const state = jwt.sign(
    {
      adminId,
      purpose: "google-search-console",
    },
    envVers.JWT_ACCESS_SECRET,
    {
      expiresIn: "10m",
    }
  );

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "https://www.googleapis.com/auth/webmasters",
    ],
    state,
  });

  return authorizationUrl;
};

// ---------------------------------------------
// Handle OAuth Callback
// ---------------------------------------------

const handleOAuthCallback = async (code: string, state: string) => {
  if (!code || !state) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google authorization code or state is missing"
    );
  }

  let decodedState: string | JwtPayload;

  try {
    decodedState = jwt.verify(state, envVers.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired Google OAuth state"
    );
  }

  if (
    typeof decodedState === "string" ||
    decodedState.purpose !== "google-search-console" ||
    !decodedState.adminId
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid Google OAuth state"
    );
  }

  const oauth2Client = getOAuthClient();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google did not return an access token"
    );
  }

  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    version: "v2",
    auth: oauth2Client,
  });

  const { data: userInfo } = await oauth2.userinfo.get();

  if (!userInfo.email) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Unable to retrieve Google account email"
    );
  }

  const googleEmail = userInfo.email.toLowerCase();

  const existingConnection = await GoogleSearchConsole.findOne({
    googleEmail,
  }).select("+accessToken +refreshToken");

  const refreshToken =
    tokens.refresh_token ||
    (existingConnection?.refreshToken
      ? decryptToken(existingConnection.refreshToken)
      : undefined);

  if (!refreshToken) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google did not provide a refresh token. Please revoke the previous app access and connect again."
    );
  }

  const searchConsole = google.searchconsole({
    version: "v1",
    auth: oauth2Client,
  });

  const { data: sitesData } = await searchConsole.sites.list();

  const properties = (sitesData.siteEntry || []).map((site) => ({
    siteUrl: site.siteUrl || "",
    permissionLevel: site.permissionLevel || "siteUnverifiedUser",
  }));

  const connectionData = {
    googleEmail,
    accessToken: encryptToken(tokens.access_token),
    refreshToken: encryptToken(refreshToken),
    tokenExpiryDate: tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : undefined,
    isConnected: true,
    properties,
    connectedBy: decodedState.adminId as string,
  };

  let connection;

  if (existingConnection) {
    existingConnection.set(connectionData);
    connection = await existingConnection.save();
  } else {
    connection = await GoogleSearchConsole.create(connectionData);
  }

  return getSafeConnection(connection);
};

// ---------------------------------------------
// Get Connection Status
// ---------------------------------------------

const getConnectionStatus = async () => {
  const connection = await GoogleSearchConsole.findOne({
    isConnected: true,
  });

  return getSafeConnection(connection);
};

// ---------------------------------------------
// Get Active Connection
// ---------------------------------------------

const getActiveConnection = async () => {
  const connection = await GoogleSearchConsole.findOne({
    isConnected: true,
  });

  if (!connection) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google Search Console is not connected"
    );
  }

  if (!connection.selectedProperty) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please select a Google Search Console property first"
    );
  }

  return connection;
};

// ---------------------------------------------
// Refresh Access Token
// ---------------------------------------------

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

  const refreshToken = decryptToken(connection.refreshToken);

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Unable to refresh Google access token. Please reconnect your account."
    );
  }

  connection.accessToken = encryptToken(credentials.access_token);

  if (credentials.refresh_token) {
    connection.refreshToken = encryptToken(credentials.refresh_token);
  }

  connection.tokenExpiryDate = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : undefined;

  await connection.save();

  return true;
};

// ---------------------------------------------
// Get Authenticated Google Client
// ---------------------------------------------

const getAuthenticatedClient = async (connectionId: string) => {
  let connection = await GoogleSearchConsole.findById(
    connectionId
  ).select("+accessToken +refreshToken");

  if (!connection || !connection.isConnected) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google Search Console connection not found"
    );
  }

  const shouldRefresh =
    !connection.tokenExpiryDate ||
    connection.tokenExpiryDate.getTime() <= Date.now() + 60_000;

  if (shouldRefresh) {
    await refreshAccessToken(connectionId);

    connection = await GoogleSearchConsole.findById(
      connectionId
    ).select("+accessToken +refreshToken");

    if (!connection) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Google Search Console connection not found"
      );
    }
  }

  const oauth2Client = getOAuthClient();

  oauth2Client.setCredentials({
    access_token: decryptToken(connection.accessToken),
    refresh_token: decryptToken(connection.refreshToken),
    expiry_date: connection.tokenExpiryDate?.getTime(),
  });

  return oauth2Client;
};

// ---------------------------------------------
// Get Google Search Console Properties
// ---------------------------------------------

const getProperties = async (connectionId: string) => {
  const auth = await getAuthenticatedClient(connectionId);

  const searchConsole = google.searchconsole({
    version: "v1",
    auth,
  });

  const { data } = await searchConsole.sites.list();

  const properties = (data.siteEntry || []).map((site) => ({
    siteUrl: site.siteUrl || "",
    permissionLevel: site.permissionLevel || "siteUnverifiedUser",
  }));

  await GoogleSearchConsole.findByIdAndUpdate(connectionId, {
    properties,
  });

  return properties;
};

// ---------------------------------------------
// Select Search Console Property
// ---------------------------------------------

const selectProperty = async (
  connectionId: string,
  siteUrl: string
) => {
  if (!siteUrl) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Property URL is required"
    );
  }

  const connection = await GoogleSearchConsole.findById(
    connectionId
  );

  if (!connection || !connection.isConnected) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google Search Console connection not found"
    );
  }

  const properties = await getProperties(connectionId);

  const selectedProperty = properties.find(
    (property) => property.siteUrl === siteUrl
  );

  if (!selectedProperty) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This Google account does not have access to the selected property"
    );
  }

  connection.selectedProperty = siteUrl;
  connection.properties = properties;

  await connection.save();

  return getSafeConnection(connection);
};

// ---------------------------------------------
// Disconnect Google Search Console
// ---------------------------------------------

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

  try {
    const oauth2Client = getOAuthClient();

    oauth2Client.setCredentials({
      refresh_token: decryptToken(connection.refreshToken),
    });

    await oauth2Client.revokeCredentials();
  } catch {
    // Delete the local connection even if Google's revoke request fails.
  }

  await GoogleSearchConsole.findByIdAndDelete(connectionId);

  return {
    message: "Google Search Console disconnected successfully",
  };
};

// ---------------------------------------------
// Analytics Date Validation
// ---------------------------------------------

const validateAnalyticsDates = (
  startDate: string,
  endDate: string
) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const isValidDate = (value: string) => {
    if (!dateRegex.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  };

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Dates must be valid YYYY-MM-DD values"
    );
  }

  if (startDate > endDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Start date cannot be greater than end date"
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  if (endDate > today) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End date cannot be in the future"
    );
  }
};

// ---------------------------------------------
// Execute Search Analytics Query
// ---------------------------------------------

const executeAnalyticsQuery = async (
  dimensions: AnalyticsDimension[],
  options: AnalyticsOptions
) => {
  validateAnalyticsDates(options.startDate, options.endDate);

  const connection = await getActiveConnection();

  const auth = await getAuthenticatedClient(
    connection.id
  );

  const searchConsole = google.searchconsole({
    version: "v1",
    auth,
  });

  const rowLimit = Math.min(
    Math.max(options.rowLimit || 1000, 1),
    25000
  );

  const requestBody: {
    startDate: string;
    endDate: string;
    dimensions?: AnalyticsDimension[];
    rowLimit: number;
    startRow: number;
    type: "web";
  } = {
    startDate: options.startDate,
    endDate: options.endDate,
    rowLimit,
    startRow: 0,
    type: "web",
  };

  if (dimensions.length > 0) {
    requestBody.dimensions = dimensions;
  }

  const { data } = await searchConsole.searchanalytics.query({
    siteUrl: connection.selectedProperty!,
    requestBody,
  });

  return {
    property: connection.selectedProperty,
    startDate: options.startDate,
    endDate: options.endDate,
    rows: (data.rows || []).map((row) => ({
      keys: row.keys || [],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    })),
    responseAggregationType: data.responseAggregationType,
  };
};

// ---------------------------------------------
// Overall Search Analytics
// ---------------------------------------------

const getAnalytics = async (options: AnalyticsOptions) => {
  const result = await executeAnalyticsQuery([], options);

  const totals = result.rows.reduce(
    (acc, row) => ({
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
      weightedPosition:
        acc.weightedPosition + row.position * row.impressions,
    }),
    {
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
    }
  );

  return {
    property: result.property,
    startDate: result.startDate,
    endDate: result.endDate,
    clicks: totals.clicks,
    impressions: totals.impressions,
    ctr:
      totals.impressions > 0
        ? totals.clicks / totals.impressions
        : 0,
    position:
      totals.impressions > 0
        ? totals.weightedPosition / totals.impressions
        : 0,
  };
};

// ---------------------------------------------
// Top Search Queries
// ---------------------------------------------

const getTopQueries = async (options: AnalyticsOptions) => {
  return executeAnalyticsQuery(["query"], options);
};

// ---------------------------------------------
// Top Pages
// ---------------------------------------------

const getTopPages = async (options: AnalyticsOptions) => {
  return executeAnalyticsQuery(["page"], options);
};

// ---------------------------------------------
// Country Analytics
// ---------------------------------------------

const getCountryAnalytics = async (options: AnalyticsOptions) => {
  return executeAnalyticsQuery(["country"], options);
};

// ---------------------------------------------
// Device Analytics
// ---------------------------------------------

const getDeviceAnalytics = async (options: AnalyticsOptions) => {
  return executeAnalyticsQuery(["device"], options);
};

// ---------------------------------------------
// Date-wise Analytics
// ---------------------------------------------

const getDateAnalytics = async (options: AnalyticsOptions) => {
  return executeAnalyticsQuery(["date"], options);
};

// ---------------------------------------------
// Export Service
// ---------------------------------------------

export const googleSearchConsoleService = {
  getOAuthUrl,
  handleOAuthCallback,
  getConnectionStatus,
  refreshAccessToken,
  getProperties,
  selectProperty,
  disconnect,
  getAnalytics,
  getTopQueries,
  getTopPages,
  getCountryAnalytics,
  getDeviceAnalytics,
  getDateAnalytics,
};