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
exports.statsController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const stats_service_1 = require("./stats.service");
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
// ==========================================
// ADMIN STATS
// ==========================================
const getAdminStats = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stats_service_1.statsService.getAdminStats();
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Admin stats retrieved successfully",
        data: result,
    });
}));
// ==========================================
// USER STATS
// ==========================================
const getUserStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        throw new appError_1.default(http_status_codes_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const result = yield stats_service_1.statsService.getUserStats(userId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "User stats retrieved successfully",
        data: result,
    });
}));
// ==========================================
// GET ALL ORDERS - ADMIN
// ==========================================
const getAllOrders = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = yield stats_service_1.statsService.getAllOrders(page, limit);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All orders retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
exports.statsController = {
    getAdminStats,
    getUserStats,
    getAllOrders
};
