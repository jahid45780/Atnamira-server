"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.analyticsRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    // One IP can send maximum 60 analytics events/minute
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many analytics events. Please try again later.",
    },
});
