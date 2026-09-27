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
exports.StatsController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const stats_service_1 = require("./stats.service");
/* =========================================================
   USER DASHBOARD
========================================================= */
const getUserStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const result = yield stats_service_1.StatsService.getUserStats(userId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "User statistics retrieved successfully",
        data: result,
    });
}));
/* =========================================================
   ADMIN - USER OVERVIEW
========================================================= */
const getUserOverviewStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stats_service_1.StatsService.getUserOverviewStats();
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "User overview statistics retrieved successfully",
        data: result,
    });
}));
/* =========================================================
   ADMIN - PRODUCT
========================================================= */
const getProductStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stats_service_1.StatsService.getProductStats();
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Product statistics retrieved successfully",
        data: result,
    });
}));
/* =========================================================
   ADMIN - BOOKING
========================================================= */
const getBookingStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stats_service_1.StatsService.getBookingStats();
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Booking statistics retrieved successfully",
        data: result,
    });
}));
/* =========================================================
   ADMIN - PAYMENT
========================================================= */
const getPaymentStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stats_service_1.StatsService.getPaymentStats();
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Payment statistics retrieved successfully",
        data: result,
    });
}));
const getAllAdminBookings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const result = yield stats_service_1.StatsService.getAllAdminBookings({
        page,
        limit,
    });
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Orders retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
/* =========================================================
   EXPORT
========================================================= */
exports.StatsController = {
    getUserStats,
    getUserOverviewStats,
    getProductStats,
    getBookingStats,
    getPaymentStats,
    getAllAdminBookings
};
