"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestCartMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const guestCartMiddleware = (req, res, next) => {
    // ===============================
    // LOGGED IN USER
    // ===============================
    var _a, _b;
    if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) {
        res.locals.cartOwner = {
            user: req.user.userId,
        };
        return next();
    }
    // ===============================
    // GUEST USER
    // ===============================
    let guestId = (_b = req.cookies) === null || _b === void 0 ? void 0 : _b.guestCartId;
    if (!guestId) {
        guestId = crypto_1.default.randomUUID();
        res.cookie("guestCartId", guestId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 30,
            path: "/",
        });
    }
    res.locals.cartOwner = {
        guestId,
    };
    next();
};
exports.guestCartMiddleware = guestCartMiddleware;
