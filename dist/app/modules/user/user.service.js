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
exports.userService = void 0;
const env_1 = require("../../config/env");
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const user_interface_1 = require("./user.interface");
const user_model_1 = require("./user.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload, rest = __rest(payload, ["email", "password"]);
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (isUserExist) {
        throw new appError_1.default(400, "User already exist");
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, Number(env_1.envVers.BCRYPT_SALT_ROUND));
    const authProvider = { provider: "credentials", providerID: email };
    const user = yield user_model_1.User.create(Object.assign({ email, password: hashedPassword, auths: [authProvider] }, rest));
    return user;
});
const updateUser = (userId, payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.ADMIN) {
        if (userId !== decodedToken.userId) {
            throw new appError_1.default(401, "your not authorized");
        }
    }
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "User Not found");
    }
    if (decodedToken.role === user_interface_1.Role.ADMIN && isUserExist.role === user_interface_1.Role.ADMIN) {
        throw new appError_1.default(401, "your not authorized");
    }
    if (payload.role) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.ADMIN) {
            throw new appError_1.default(http_status_codes_1.default.FORBIDDEN, "you are not authorized");
        }
    }
    if (payload.IsActive, payload.IsDeleted, payload.IsVerified) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.ADMIN) {
            throw new appError_1.default(http_status_codes_1.default.FORBIDDEN, "you are not authorized");
        }
    }
    const newUpdateUser = yield user_model_1.User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
    return newUpdateUser;
});
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = (yield user_model_1.User.find({})
        .select("-password")
        .sort({ createdAt: -1 }));
    const totalUsers = yield user_model_1.User.countDocuments();
    return {
        data: users,
        meta: {
            total: totalUsers
        }
    };
});
const getSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id).select("-password");
    return {
        data: user
    };
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    return {
        data: user
    };
});
/**
 * Make USER → ADMIN
 */
const makeAdmin = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.role === user_interface_1.Role.ADMIN) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is already an admin");
    }
    user.role = user_interface_1.Role.ADMIN;
    yield user.save();
    return user_model_1.User.findById(userId).select("-password");
});
/**
 * Make ADMIN → USER
 */
const makeUser = (userId, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    // Admin cannot demote himself
    if (userId === adminId) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot demote yourself");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.role === user_interface_1.Role.USER) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is already a USER");
    }
    user.role = user_interface_1.Role.USER;
    yield user.save();
    return user_model_1.User.findById(userId).select("-password");
});
/**
 * Delete user
 */
const deleteUser = (userId, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    // Admin cannot delete himself
    if (userId === adminId) {
        throw new appError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot delete your own account");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new appError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    yield user_model_1.User.findByIdAndDelete(userId);
    return null;
});
exports.userService = {
    createUser,
    updateUser,
    getSingleUser,
    getMe,
    getAllUsers,
    makeAdmin,
    makeUser,
    deleteUser,
};
