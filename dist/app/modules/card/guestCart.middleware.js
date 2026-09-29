"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestCartMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const guestCartMiddleware = (req, res, next) => {
    var _a, _b;
    try {
        // Authenticated requests should be handled by auth middleware.
        if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) {
            res.locals.cartOwner = {
                user: req.user.userId,
            };
            return next();
        }
        let guestId = (_b = req.cookies) === null || _b === void 0 ? void 0 : _b.guestCartId;
        if (!guestId) {
            guestId = crypto_1.default.randomUUID();
            res.cookie("guestCartId", guestId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
            });
        }
        res.locals.cartOwner = {
            guestId,
        };
        next();
    }
    catch (_c) {
        next(new appError_1.default(500, "Unable to initialize cart"));
    }
};
exports.guestCartMiddleware = guestCartMiddleware;
