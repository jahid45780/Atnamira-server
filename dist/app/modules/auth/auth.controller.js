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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const passport_1 = __importDefault(require("passport"));
const catchAsync_1 = require("../../utils/catchAsync");
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const userTokens_1 = require("../../utils/userTokens");
const setCookie_1 = require("../../utils/setCookie");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const env_1 = require("../../config/env");
const credentialsLogin = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    passport_1.default.authenticate("local", { session: false }, (err, user, info) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return next(new appError_1.default(401, err));
        }
        if (!user) {
            return next(new appError_1.default(401, (info === null || info === void 0 ? void 0 : info.message) || "Invalid credentials"));
        }
        const userTokens = yield (0, userTokens_1.createUserToken)(user);
        const _a = user.toObject(), { password } = _a, userData = __rest(_a, ["password"]);
        yield (0, setCookie_1.setAuthCookie)(res, userTokens);
        (0, sendResponse_1.sentResponse)(res, {
            success: true,
            statusCode: http_status_codes_1.default.OK,
            message: "Successfully logged in user",
            data: {
                accessTokens: userTokens.accessToken,
                refreshTokens: userTokens.refreshToken,
                user: userData,
            },
        });
    }))(req, res, next);
}));
const logout = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("AccessToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });
    res.clearCookie("RefreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "successfully  logged out user",
        data: null
    });
}));
const googleCallbackController = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let redirectTo = req.query.state ? req.query.state : "";
    if (redirectTo.startsWith('/')) {
        redirectTo = redirectTo.slice(1);
    }
    const user = req.user;
    if (!user) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "user not found");
    }
    const TokenInfo = (0, userTokens_1.createUserToken)(user);
    (0, setCookie_1.setAuthCookie)(res, TokenInfo);
    res.redirect(`${env_1.envVers.FRONTEND_URL}/${redirectTo}`);
}));
exports.authController = {
    credentialsLogin,
    googleCallbackController,
    logout
};
