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
exports.analyticsController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const analytics_service_1 = require("./analytics.service");
const trackEvent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { event, eventId, visitorId, sessionId, path, productId, value, currency, source, } = req.body;
    if (!event ||
        !visitorId ||
        !sessionId ||
        !path) {
        throw new appError_1.default(400, "event, visitorId, sessionId and path are required");
    }
    const result = yield analytics_service_1.analyticsService.trackEvent({
        event,
        eventId,
        visitorId,
        sessionId,
        path,
        productId,
        value,
        currency,
        source,
    }, (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId, req.headers["user-agent"]);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Analytics event received",
        data: result,
    });
}));
const getOverview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const days = Number((_a = req.query.days) !== null && _a !== void 0 ? _a : 30);
    if (!Number.isInteger(days) || days < 1 || days > 90) {
        throw new appError_1.default(400, "days must be an integer from 1 to 90");
    }
    const result = yield analytics_service_1.analyticsService.getOverview(days);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Analytics overview retrieved",
        data: result,
    });
}));
exports.analyticsController = {
    trackEvent,
    getOverview,
};
