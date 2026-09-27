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
exports.authService = void 0;
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const userTokens_1 = require("../../utils/userTokens");
const user_model_1 = require("../user/user.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const credentialsLogin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload;
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (!isUserExist) {
        throw new appError_1.default(400, "email does not exist");
    }
    // VERIFY CHECK
    // if (!isUserExist.IsVerified) {
    //   throw new AppError(401, "User is not verified");
    // }
    const isPasswordMatched = yield bcrypt_1.default.compare(password, isUserExist.password);
    if (!isPasswordMatched) {
        throw new appError_1.default(400, "incorrect password");
    }
    const _a = isUserExist.toObject(), { password: pass } = _a, res = __rest(_a, ["password"]);
    const userTokens = (0, userTokens_1.createUserToken)({
        _id: isUserExist._id.toString(),
        email: isUserExist.email,
        role: isUserExist.role,
    });
    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: res,
    };
});
exports.authService = {
    credentialsLogin
};
