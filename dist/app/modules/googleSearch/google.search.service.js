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
// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================
const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
        throw new appError_1.default(http_status_codes_1.default.INTERNAL_SERVER_ERROR, "Google Search Console credentials are not configured");
    }
    return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
};
// ============================================
// TOKEN ENCRYPTION
// ============================================
const getEncryptionKey = () => {
    const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
    if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
        throw new appError_1.default(http_status_codes_1.default.INTERNAL_SERVER_ERROR, "Google token encryption key must be a 64-character hexadecimal key");
    }
    return Buffer.from(key, "hex");
};
const encryptToken = (token) => {
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
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
    const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new appError_1.default(http_status_codes_1.default.INTERNAL_SERVER_ERROR, "Invalid encrypted Google token");
    }
    const decipher = crypto_1.default.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivHex, "hex"));
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
const getSafeConnection = (connection) => {
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
const getOAuthUrl = (adminId) => {
    const oauth2Client = getOAuthClient();
    const state = jsonwebtoken_1.default.sign({
        userId: adminId,
        purpose: "google-search-console",
    }, env_1.envVers.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
    });
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
const handleOAuthCallback = (code, state) => __awaiter(void 0, void 0, void 0, function* () {
    if (!code || !state) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Google authorization code or state is missing");
    }
    let decodedState;
    try {
        const decoded = jsonwebtoken_1.default.verify(state, env_1.envVers.JWT_ACCESS_SECRET);
        if (typeof decoded === "string" ||
            decoded.purpose !== "google-search-console" ||
            !decoded.userId) {
            throw new Error("Invalid OAuth state");
        }
        decodedState = decoded;
    }
    catch (_a) {
        throw new appError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Invalid or expired Google OAuth state");
    }
    const oauth2Client = getOAuthClient();
    const { tokens } = yield oauth2Client.getToken(code);
    if (!tokens.access_token) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Google access token was not received");
    }
    oauth2Client.setCredentials(tokens);
    // Get Google account information
    const oauth2 = googleapis_1.google.oauth2({
        version: "v2",
        auth: oauth2Client,
    });
    const { data: account } = yield oauth2.userinfo.get();
    if (!account.email) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Unable to retrieve Google account email");
    }
    // Find existing connection
    const existingConnection = yield google_search_model_1.GoogleSearchConsole.findOne({
        googleEmail: account.email,
    }).select("+accessToken +refreshToken");
    const refreshToken = tokens.refresh_token ||
        (existingConnection
            ? decryptToken(existingConnection.refreshToken)
            : undefined);
    if (!refreshToken) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Google refresh token was not received. Please reconnect with consent.");
    }
    // Fetch Search Console properties
    const searchConsole = googleapis_1.google.searchconsole({
        version: "v1",
        auth: oauth2Client,
    });
    const { data: sitesData } = yield searchConsole.sites.list();
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
        connection = yield existingConnection.save();
    }
    else {
        connection = yield google_search_model_1.GoogleSearchConsole.create(connectionData);
    }
    return getSafeConnection(connection);
});
// ============================================
// GET GOOGLE CONNECTION STATUS
// ============================================
const getConnectionStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield google_search_model_1.GoogleSearchConsole.findOne({
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
});
// ============================================
// REFRESH ACCESS TOKEN
// ============================================
const refreshAccessToken = (connectionId) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId).select("+accessToken +refreshToken");
    if (!connection || !connection.isConnected) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console connection not found");
    }
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
        refresh_token: decryptToken(connection.refreshToken),
    });
    const { credentials } = yield oauth2Client.refreshAccessToken();
    if (!credentials.access_token) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Unable to refresh Google access token");
    }
    connection.accessToken = encryptToken(credentials.access_token);
    if (credentials.refresh_token) {
        connection.refreshToken = encryptToken(credentials.refresh_token);
    }
    connection.tokenExpiryDate = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : undefined;
    yield connection.save();
    return getSafeConnection(connection);
});
// ============================================
// GET AUTHENTICATED GOOGLE CLIENT
// ============================================
const getAuthenticatedClient = (connectionId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId).select("+accessToken +refreshToken");
    if (!connection || !connection.isConnected) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console is not connected");
    }
    // Refresh when token is expired or about to expire
    const isExpired = !connection.tokenExpiryDate ||
        connection.tokenExpiryDate.getTime() <= Date.now() + 60000;
    if (isExpired) {
        yield refreshAccessToken(connectionId);
        connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId).select("+accessToken +refreshToken");
    }
    if (!connection) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google connection not found");
    }
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
        access_token: decryptToken(connection.accessToken),
        refresh_token: decryptToken(connection.refreshToken),
        expiry_date: (_a = connection.tokenExpiryDate) === null || _a === void 0 ? void 0 : _a.getTime(),
    });
    return oauth2Client;
});
// ============================================
// GET SEARCH CONSOLE PROPERTIES
// ============================================
const getProperties = (connectionId) => __awaiter(void 0, void 0, void 0, function* () {
    const auth = yield getAuthenticatedClient(connectionId);
    const searchConsole = googleapis_1.google.searchconsole({
        version: "v1",
        auth,
    });
    const { data } = yield searchConsole.sites.list();
    return (data.siteEntry || []).map((site) => ({
        siteUrl: site.siteUrl,
        permissionLevel: site.permissionLevel,
    }));
});
// ============================================
// SELECT SEARCH CONSOLE PROPERTY
// ============================================
const selectProperty = (connectionId, siteUrl) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId);
    if (!connection || !connection.isConnected) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console connection not found");
    }
    const propertyExists = (_a = connection.properties) === null || _a === void 0 ? void 0 : _a.some((property) => property.siteUrl === siteUrl);
    if (!propertyExists) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "This property is not available in your Google account");
    }
    connection.selectedProperty = siteUrl;
    yield connection.save();
    return getSafeConnection(connection);
});
// ============================================
// DISCONNECT GOOGLE SEARCH CONSOLE
// ============================================
const disconnect = (connectionId) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield google_search_model_1.GoogleSearchConsole.findById(connectionId).select("+accessToken +refreshToken");
    if (!connection) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "Google Search Console connection not found");
    }
    // Revoke Google OAuth token
    const oauth2Client = getOAuthClient();
    try {
        yield oauth2Client.revokeToken(decryptToken(connection.refreshToken));
    }
    catch (_a) {
        // Continue local disconnection even if Google revocation fails
    }
    yield google_search_model_1.GoogleSearchConsole.findByIdAndDelete(connectionId);
    return null;
});
// ============================================
// EXPORT SERVICE
// ============================================
exports.googleSearchConsoleService = {
    getOAuthUrl,
    handleOAuthCallback,
    getConnectionStatus,
    refreshAccessToken,
    getAuthenticatedClient,
    getProperties,
    selectProperty,
    disconnect,
};
