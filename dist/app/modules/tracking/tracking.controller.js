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
exports.trackingController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const tracking_service_1 = require("./tracking.service");
const getPublicSettings = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield tracking_service_1.trackingService.getPublicSettings();
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Tracking settings retrieved",
        data: result,
    });
}));
const getAdminSettings = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield tracking_service_1.trackingService.getAdminSettings();
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Admin tracking settings retrieved",
        data: result,
    });
}));
const updateSettings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!adminId) {
        throw new Error("Admin identity is missing");
    }
    const result = yield tracking_service_1.trackingService.updateSettings(req.body, adminId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Tracking settings updated",
        data: result,
    });
}));
exports.trackingController = {
    getPublicSettings,
    getAdminSettings,
    updateSettings,
};
