"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleSearchConsoleService = void 0;
const googleapis_1 = require("googleapis");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const env_1 = require("../../config/env");
const google_search_model_1 = require("./google.search.model");
// ---------------------------------------------
// OAuth Client
// ---------------------------------------------
const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
        throw new appError_1.default(http_status_codes_1.default.INTERNAL_SERVER_ERROR, "Google Search Console OAuth environment variables are missing");
    }
    return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
};
// ---------------------------------------------
// Token Encryption / Decryption
// ---------------------------------------------
const getEncryptionKey = () => {
    const encryptionKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
    if (!encryptionKey || !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
        throw new appError_1.default(http_status_codes_1.default.INTERNAL_SERVER_ERROR, "GOOGLE_TOKEN_ENCRYPTION_KEY must be a 64-character hexadecimal string");
    }
    return Buffer.from(encryptionKey, "hex");
};
const encryptToken = (token) => {
    const key = getEncryptionKey();
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv("aes-256-gcm", key, iv);
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
const decryptToken = (encryptedToken) => {
    try {
        const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");
        if (!ivHex || !authTagHex || !encryptedHex) {
            throw new Error("Invalid encrypted token format");
        }
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const encrypted = Buffer.from(encryptedHex, "hex");
        const decipher = crypto_1.default.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);
        return decrypted.toString("utf8");
    }
    catch (_a) {
        throw new appError_1.default(http_status_codes_1.default.INTERNAL_SERVER_ERROR, "Unable to decrypt Google OAuth token. Check your encryption key.");
    }
};
// ---------------------------------------------
// Safe Connection Response
// ---------------------------------------------
const getSafeConnection = (connection) => {
    if (!connection)
        return null;
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
const getOAuthUrl = (adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const oauth2Client = getOAuthClient();
    const state = jsonwebtoken_1.default.sign({
        adminId,
        purpose: "google-search-console",
    }, env_1.envVers.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
    });
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
});
// ---------------------------------------------
// Handle OAuth Callback
// ---------------------------------------------
const handleOAuthCallback = (code, state) => __awaiter(void 0, void 0, void 0, function* () {
    if (!code || !state) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Google authorization code or state is missing");
    }
    let decodedState;
    try {
        decodedState = jsonwebtoken_1.default.verify(state, env_1.envVers.JWT_ACCESS_SECRET);
    }
    catch (_a) {
        throw new appError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Invalid or expired Google OAuth state");
    }
    if (typeof decodedState === "string" ||
        decodedState.purpose !== "google-search-console" ||
        !decodedState.adminId) {
        throw new appError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Invalid Google OAuth state");
    }
    const oauth2Client = getOAuthClient();
    const { tokens } = yield oauth2Client.getToken(code);
    if (!tokens.access_token) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Google did not return an access token");
    }
    oauth2Client.setCredentials(tokens);
    const oauth2 = googleapis_1.google.oauth2({
        version: "v2",
        auth: oauth2Client,
    });
    const { data: userInfo } = yield oauth2.userinfo.get();
    if (!userInfo.email) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Unable to retrieve Google account email");
    }
    const googleEmail = userInfo.email.toLowerCase();
    const existingConnection = yield google_search_model_1.GoogleSearchConsole.findOne({
        googleEmail,
    }).select("+accessToken +refreshToken");
    const refreshToken = tokens.refresh_token ||
        ((existingConnection === null || existingConnection === void 0 ? void 0 : existingConnection.refreshToken)
            ? decryptToken(existingConnection.refreshToken)
            : undefined);
    if (!refreshToken) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Google did not provide a refresh token. Please revoke the previous app access and connect again.");
    }
    const searchConsole = googleapis_1.google.searchconsole({
        version: "v1",
        auth: oauth2Client,
    });
    const { data: sitesData } = yield searchConsole.sites.list();
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
        connectedBy: decodedState.adminId,
    };
    let connection;
    if (existingConnection) {
        existingConnection.set(connectionData);
        connection = yield existingConnection.save();
    }
    else {
        connection = yield google_search_model_1.GoogleSearchConsole.create(connectionData);
    }
    return getSafeConnection(connection);
});
// ---------------------------------------------
// Get Connection Status
// ---------------------------------------------
const getConnectionStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield google_search_model_1.GoogleSearchConsole.findOne({
        isConnected: true,
    });
    return getSafeConnection(connection);
});
// ---------------------------------------------
// Get Active Connection
// ---------------------------------------------
const getActiveConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield google_search_model_1.GoogleSearchConsole.findOne({
        isConnected: true,
    });
    if (!connection) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console is not connected");
    }
    if (!connection.selectedProperty) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Please select a Google Search Console property first");
    }
    return connection;
});
// ---------------------------------------------
// Refresh Access Token
// ---------------------------------------------
const refreshAccessToken = (connectionId) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId).select("+accessToken +refreshToken");
    if (!connection || !connection.isConnected) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console connection not found");
    }
    const oauth2Client = getOAuthClient();
    const refreshToken = decryptToken(connection.refreshToken);
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });
    const { credentials } = yield oauth2Client.refreshAccessToken();
    if (!credentials.access_token) {
        throw new appError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Unable to refresh Google access token. Please reconnect your account.");
    }
    connection.accessToken = encryptToken(credentials.access_token);
    if (credentials.refresh_token) {
        connection.refreshToken = encryptToken(credentials.refresh_token);
    }
    connection.tokenExpiryDate = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : undefined;
    yield connection.save();
    return true;
});
// ---------------------------------------------
// Get Authenticated Google Client
// ---------------------------------------------
const getAuthenticatedClient = (connectionId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId).select("+accessToken +refreshToken");
    if (!connection || !connection.isConnected) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console connection not found");
    }
    const shouldRefresh = !connection.tokenExpiryDate ||
        connection.tokenExpiryDate.getTime() <= Date.now() + 60000;
    if (shouldRefresh) {
        yield refreshAccessToken(connectionId);
        connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId).select("+accessToken +refreshToken");
        if (!connection) {
            throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console connection not found");
        }
    }
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
        access_token: decryptToken(connection.accessToken),
        refresh_token: decryptToken(connection.refreshToken),
        expiry_date: (_a = connection.tokenExpiryDate) === null || _a === void 0 ? void 0 : _a.getTime(),
    });
    return oauth2Client;
});
// ---------------------------------------------
// Get Google Search Console Properties
// ---------------------------------------------
const getProperties = (connectionId) => __awaiter(void 0, void 0, void 0, function* () {
    const auth = yield getAuthenticatedClient(connectionId);
    const searchConsole = googleapis_1.google.searchconsole({
        version: "v1",
        auth,
    });
    const { data } = yield searchConsole.sites.list();
    const properties = (data.siteEntry || []).map((site) => ({
        siteUrl: site.siteUrl || "",
        permissionLevel: site.permissionLevel || "siteUnverifiedUser",
    }));
    yield google_search_model_1.GoogleSearchConsole.findByIdAndUpdate(connectionId, {
        properties,
    });
    return properties;
});
// ---------------------------------------------
// Select Search Console Property
// ---------------------------------------------
const selectProperty = (connectionId, siteUrl) => __awaiter(void 0, void 0, void 0, function* () {
    if (!siteUrl) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Property URL is required");
    }
    const connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId);
    if (!connection || !connection.isConnected) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console connection not found");
    }
    const properties = yield getProperties(connectionId);
    const selectedProperty = properties.find((property) => property.siteUrl === siteUrl);
    if (!selectedProperty) {
        throw new appError_1.default(http_status_codes_1.default.FORBIDDEN, "This Google account does not have access to the selected property");
    }
    connection.selectedProperty = siteUrl;
    connection.properties = properties;
    yield connection.save();
    return getSafeConnection(connection);
});
// ---------------------------------------------
// Disconnect Google Search Console
// ---------------------------------------------
const disconnect = (connectionId) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId).select("+accessToken +refreshToken");
    if (!connection) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console connection not found");
    }
    try {
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: decryptToken(connection.refreshToken),
        });
        yield oauth2Client.revokeCredentials();
    }
    catch (_a) {
        // Delete the local connection even if Google's revoke request fails.
    }
    yield google_search_model_1.GoogleSearchConsole.findByIdAndDelete(connectionId);
    return {
        message: "Google Search Console disconnected successfully",
    };
});
// ---------------------------------------------
// Analytics Date Validation
// ---------------------------------------------
const validateAnalyticsDates = (startDate, endDate) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const isValidDate = (value) => {
        if (!dateRegex.test(value))
            return false;
        const date = new Date(`${value}T00:00:00.000Z`);
        return (!Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value);
    };
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Dates must be valid YYYY-MM-DD values");
    }
    if (startDate > endDate) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Start date cannot be greater than end date");
    }
    const today = new Date().toISOString().slice(0, 10);
    if (endDate > today) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "End date cannot be in the future");
    }
};
// ---------------------------------------------
// Execute Search Analytics Query
// ---------------------------------------------
const executeAnalyticsQuery = (dimensions, options) => __awaiter(void 0, void 0, void 0, function* () {
    validateAnalyticsDates(options.startDate, options.endDate);
    const connection = yield getActiveConnection();
    const auth = yield getAuthenticatedClient(connection.id);
    const searchConsole = googleapis_1.google.searchconsole({
        version: "v1",
        auth,
    });
    const rowLimit = Math.min(Math.max(options.rowLimit || 1000, 1), 25000);
    const requestBody = {
        startDate: options.startDate,
        endDate: options.endDate,
        rowLimit,
        startRow: 0,
        type: "web",
    };
    if (dimensions.length > 0) {
        requestBody.dimensions = dimensions;
    }
    const { data } = yield searchConsole.searchanalytics.query({
        siteUrl: connection.selectedProperty,
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
});
// ---------------------------------------------
// Overall Search Analytics
// ---------------------------------------------
const getAnalytics = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield executeAnalyticsQuery([], options);
    const totals = result.rows.reduce((acc, row) => ({
        clicks: acc.clicks + row.clicks,
        impressions: acc.impressions + row.impressions,
        weightedPosition: acc.weightedPosition + row.position * row.impressions,
    }), {
        clicks: 0,
        impressions: 0,
        weightedPosition: 0,
    });
    return {
        property: result.property,
        startDate: result.startDate,
        endDate: result.endDate,
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: totals.impressions > 0
            ? totals.clicks / totals.impressions
            : 0,
        position: totals.impressions > 0
            ? totals.weightedPosition / totals.impressions
            : 0,
    };
});
// ---------------------------------------------
// Top Search Queries
// ---------------------------------------------
const getTopQueries = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return executeAnalyticsQuery(["query"], options);
});
// ---------------------------------------------
// Top Pages
// ---------------------------------------------
const getTopPages = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return executeAnalyticsQuery(["page"], options);
});
// ---------------------------------------------
// Country Analytics
// ---------------------------------------------
const getCountryAnalytics = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return executeAnalyticsQuery(["country"], options);
});
// ---------------------------------------------
// Device Analytics
// ---------------------------------------------
const getDeviceAnalytics = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return executeAnalyticsQuery(["device"], options);
});
// ---------------------------------------------
// Date-wise Analytics
// ---------------------------------------------
const getDateAnalytics = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return executeAnalyticsQuery(["date"], options);
});
// ---------------------------------------------
// Export Service
// ---------------------------------------------
exports.googleSearchConsoleService = {
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
