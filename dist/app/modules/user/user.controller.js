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
exports.userController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const user_service_1 = require("./user.service");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const createUser = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign({}, req.body);
    const user = yield user_service_1.userService.createUser(payload);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "successfully create user",
        data: user
    });
}));
const updateUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = String(req.params.userId);
    if (!req.user) {
        throw new appError_1.default(http_status_codes_1.default.UNAUTHORIZED, "User is not authenticated");
    }
    const payload = req.body;
    const result = yield user_service_1.userService.updateUser(userId, payload, req.user);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "User updated successfully",
        data: result,
    });
}));
const getSingleUser = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield user_service_1.userService.getSingleUser(id);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "User Retrieved Successfully",
        data: result.data
    });
}));
const getAllUsers = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.userService.getAllUsers();
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "successfully get all-users",
        data: result.data,
    });
}));
const getMe = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user;
    const result = yield user_service_1.userService.getMe(decodedToken.userId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Your profile Retrieved Successfully",
        data: result.data
    });
}));
/**
 * USER → ADMIN
 */
const makeAdmin = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = String(req.params.id);
    const result = yield user_service_1.userService.makeAdmin(userId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "User promoted to admin successfully",
        data: result,
    });
}));
/**
 * ADMIN → USER
 */
const makeUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = String(req.params.id);
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const result = yield user_service_1.userService.makeUser(userId, adminId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Admin demoted to user successfully",
        data: result,
    });
}));
/**
 * Delete user
 */
const deleteUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = String(req.params.id);
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const result = yield user_service_1.userService.deleteUser(userId, adminId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "User deleted successfully",
        data: result,
    });
}));
exports.userController = {
    createUser,
    updateUser,
    getSingleUser,
    getAllUsers,
    getMe,
    makeAdmin,
    makeUser,
    deleteUser,
};
