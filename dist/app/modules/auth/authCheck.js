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
exports.optionalAuth = exports.checkAuth = void 0;
const env_1 = require("../../config/env");
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const jwt_1 = require("../../utils/jwt");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const checkAuth = (...authRoles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const accessToken = req.cookies.AccessToken ||
            ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", ""));
        if (!accessToken) {
            throw new appError_1.default(401, "Token not received");
        }
        const verifiedToken = (0, jwt_1.verifyToken)(accessToken, env_1.envVers.JWT_ACCESS_SECRET);
        if (!verifiedToken.email ||
            !verifiedToken.userId ||
            !verifiedToken.role) {
            throw new appError_1.default(401, "Invalid token");
        }
        const isUserExist = yield user_model_1.User.findOne({
            email: verifiedToken.email,
        });
        if (!isUserExist) {
            throw new appError_1.default(400, "User does not exist");
        }
        if (isUserExist.IsActive === user_interface_1.isActive.BLOCKED ||
            isUserExist.IsActive === user_interface_1.isActive.INACTIVE) {
            throw new appError_1.default(400, `User is ${isUserExist.IsActive}`);
        }
        if (isUserExist.IsDeleted) {
            throw new appError_1.default(400, "User is deleted");
        }
        if (!authRoles.includes(verifiedToken.role)) {
            throw new appError_1.default(403, "You are not permitted to view this route");
        }
        req.user = {
            userId: verifiedToken.userId,
            email: verifiedToken.email,
            role: verifiedToken.role,
        };
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.checkAuth = checkAuth;
const optionalAuth = (...authRoles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const accessToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.AccessToken) ||
            ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.replace("Bearer ", ""));
        // No token means guest.
        if (!accessToken) {
            return next();
        }
        // If a token is provided, it must be valid.
        const verifiedToken = (0, jwt_1.verifyToken)(accessToken, env_1.envVers.JWT_ACCESS_SECRET);
        if (!verifiedToken.email ||
            !verifiedToken.userId ||
            !verifiedToken.role) {
            throw new appError_1.default(401, "Invalid token");
        }
        const user = yield user_model_1.User.findOne({
            email: verifiedToken.email,
        });
        if (!user) {
            throw new appError_1.default(401, "User does not exist");
        }
        if (user.IsActive === user_interface_1.isActive.BLOCKED ||
            user.IsActive === user_interface_1.isActive.INACTIVE) {
            throw new appError_1.default(403, `User is ${user.IsActive}`);
        }
        if (user.IsDeleted) {
            throw new appError_1.default(403, "User is deleted");
        }
        if (!authRoles.includes(verifiedToken.role)) {
            throw new appError_1.default(403, "You are not permitted to access this route");
        }
        req.user = {
            userId: verifiedToken.userId,
            email: verifiedToken.email,
            role: verifiedToken.role,
        };
        return next();
    }
    catch (error) {
        return next(error);
    }
});
exports.optionalAuth = optionalAuth;
