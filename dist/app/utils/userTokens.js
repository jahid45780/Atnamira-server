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
exports.createNewAccessTokenWithRefreshToken = exports.createUserToken = void 0;
const env_1 = require("../config/env");
const appError_1 = __importDefault(require("../errorHerplrs/appError"));
const jwt_1 = require("./jwt");
const user_interface_1 = require("../modules/user/user.interface");
const user_model_1 = require("../modules/user/user.model");
const createUserToken = (user) => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        role: user.role,
    };
    const accessToken = (0, jwt_1.generateToken)(jwtPayload, env_1.envVers.JWT_ACCESS_SECRET, env_1.envVers.JWT_ACCESS_EXPIRES);
    const refreshToken = (0, jwt_1.generateToken)(jwtPayload, env_1.envVers.JWT_ACCESS_REFRESH_SECRET, env_1.envVers.JWT_ACCESS_REFRESH_EXPIRES);
    return {
        accessToken,
        refreshToken,
    };
};
exports.createUserToken = createUserToken;
const createNewAccessTokenWithRefreshToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedRefreshToken = (0, jwt_1.verifyToken)(refreshToken, env_1.envVers.JWT_ACCESS_REFRESH_SECRET);
    const isUserExist = yield user_model_1.User.findOne({
        email: verifiedRefreshToken.email,
    });
    if (!isUserExist) {
        throw new appError_1.default(400, "user does not exist");
    }
    if (isUserExist.IsActive === user_interface_1.isActive.BLOCKED ||
        isUserExist.IsActive === user_interface_1.isActive.INACTIVE) {
        throw new appError_1.default(400, `user is ${isUserExist.IsActive}`);
    }
    if (isUserExist.IsDeleted) {
        throw new appError_1.default(400, "user is deleted");
    }
    // Role অবশ্যই থাকতে হবে
    if (!isUserExist.role) {
        throw new appError_1.default(400, "user role is missing");
    }
    const userTokens = (0, exports.createUserToken)({
        _id: isUserExist._id.toString(),
        email: isUserExist.email,
        role: isUserExist.role,
    });
    return userTokens.accessToken;
});
exports.createNewAccessTokenWithRefreshToken = createNewAccessTokenWithRefreshToken;
