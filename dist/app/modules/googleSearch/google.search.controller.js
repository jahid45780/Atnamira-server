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
exports.googleSearchConsoleController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const catchAsync_1 = require("../../utils/catchAsync");
const google_search_service_1 = require("./google.search.service");
const sendResponse_1 = require("../../utils/sendResponse");
const google_search_model_1 = require("./google.search.model");
// ---------------------------------------------
// Analytics Query Validation
// ---------------------------------------------
const getAnalyticsOptions = (req) => {
    const startDate = typeof req.query.startDate === "string"
        ? req.query.startDate
        : "";
    const endDate = typeof req.query.endDate === "string"
        ? req.query.endDate
        : "";
    const rowLimitValue = typeof req.query.rowLimit === "string"
        ? Number(req.query.rowLimit)
        : 1000;
    if (!startDate || !endDate) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "startDate and endDate are required");
    }
    if (!Number.isInteger(rowLimitValue) ||
        rowLimitValue < 1 ||
        rowLimitValue > 25000) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "rowLimit must be an integer between 1 and 25000");
    }
    return {
        startDate,
        endDate,
        rowLimit: rowLimitValue,
    };
};
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
    return connection;
});
// ---------------------------------------------
// Connect Google Search Console
// ---------------------------------------------
const connect = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!adminId) {
        throw new appError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Admin authentication is required");
    }
    const authorizationUrl = yield google_search_service_1.googleSearchConsoleService.getOAuthUrl(adminId.toString());
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Google Search Console authorization URL generated",
        data: {
            authorizationUrl,
        },
    });
}));
// ---------------------------------------------
// Google OAuth Callback
// ---------------------------------------------
const callback = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, state, error } = req.query;
    if (error) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, `Google authorization failed: ${String(error)}`);
    }
    if (typeof code !== "string" ||
        typeof state !== "string") {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "Google authorization code or state is missing");
    }
    const connection = yield google_search_service_1.googleSearchConsoleService.handleOAuthCallback(code, state);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Google Search Console connected successfully",
        data: connection,
    });
}));
// ---------------------------------------------
// Get Connection Status
// ---------------------------------------------
const getStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield google_search_service_1.googleSearchConsoleService.getConnectionStatus();
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Google Search Console connection status retrieved",
        data: result,
    });
}));
// ---------------------------------------------
// Get Properties
// ---------------------------------------------
const getProperties = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield getActiveConnection();
    const properties = yield google_search_service_1.googleSearchConsoleService.getProperties(connection.id);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Google Search Console properties retrieved",
        data: properties,
    });
}));
// ---------------------------------------------
// Select Property
// ---------------------------------------------
const selectProperty = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { siteUrl } = req.body;
    if (typeof siteUrl !== "string" ||
        !siteUrl.trim()) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "A valid siteUrl is required");
    }
    const connection = yield getActiveConnection();
    const result = yield google_search_service_1.googleSearchConsoleService.selectProperty(connection.id, siteUrl.trim());
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Google Search Console property selected successfully",
        data: result,
    });
}));
// ---------------------------------------------
// Disconnect Google Search Console
// ---------------------------------------------
const disconnect = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield getActiveConnection();
    const result = yield google_search_service_1.googleSearchConsoleService.disconnect(connection.id);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Google Search Console disconnected successfully",
        data: result,
    });
}));
// ---------------------------------------------
// Overall Search Analytics
// ---------------------------------------------
const getAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = getAnalyticsOptions(req);
    const result = yield google_search_service_1.googleSearchConsoleService.getAnalytics(options);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Search analytics retrieved successfully",
        data: result,
    });
}));
// ---------------------------------------------
// Top Search Queries
// ---------------------------------------------
const getTopQueries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = getAnalyticsOptions(req);
    const result = yield google_search_service_1.googleSearchConsoleService.getTopQueries(options);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Top search queries retrieved successfully",
        data: result,
    });
}));
// ---------------------------------------------
// Top Pages
// ---------------------------------------------
const getTopPages = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = getAnalyticsOptions(req);
    const result = yield google_search_service_1.googleSearchConsoleService.getTopPages(options);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Top pages analytics retrieved successfully",
        data: result,
    });
}));
// ---------------------------------------------
// Country Analytics
// ---------------------------------------------
const getCountryAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = getAnalyticsOptions(req);
    const result = yield google_search_service_1.googleSearchConsoleService.getCountryAnalytics(options);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Country analytics retrieved successfully",
        data: result,
    });
}));
// ---------------------------------------------
// Device Analytics
// ---------------------------------------------
const getDeviceAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = getAnalyticsOptions(req);
    const result = yield google_search_service_1.googleSearchConsoleService.getDeviceAnalytics(options);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Device analytics retrieved successfully",
        data: result,
    });
}));
// ---------------------------------------------
// Date-wise Analytics
// ---------------------------------------------
const getDateAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = getAnalyticsOptions(req);
    const result = yield google_search_service_1.googleSearchConsoleService.getDateAnalytics(options);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Date-wise search analytics retrieved successfully",
        data: result,
    });
}));
// ---------------------------------------------
// Export Controller
// ---------------------------------------------
exports.googleSearchConsoleController = {
    connect,
    callback,
    getStatus,
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
