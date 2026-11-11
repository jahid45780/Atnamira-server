"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envVers = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const loadEnvVars = () => {
    const requiredEnvVars = [
        "DB_URL",
        "NODE_ENV",
        "JWT_ACCESS_SECRET",
        "JWT_ACCESS_EXPIRES",
        "JWT_ACCESS_REFRESH_SECRET",
        "JWT_ACCESS_REFRESH_EXPIRES",
        "BCRYPT_SALT_ROUND",
        "FRONTEND_URL",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_CALLBACK_URL",
        "GOOGLE_SEARCH_CONSOLE_CLIENT_ID",
        "GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET",
        "GOOGLE_SEARCH_CONSOLE_REDIRECT_URI",
        "GOOGLE_TOKEN_ENCRYPTION_KEY",
        "GOOGLE_TAG_MANAGER_CLIENT_ID",
        "GOOGLE_TAG_MANAGER_CLIENT_SECRET",
        "GOOGLE_TAG_MANAGER_REDIRECT_URI",
        "EXPRESS_SESSION_SECRET",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
    ];
    requiredEnvVars.forEach((key) => {
        if (!process.env[key]) {
            throw new Error(`Missing env vars: ${key}`);
        }
    });
    return {
        // Render automatically provides PORT
        PORT: Number(process.env.PORT) || 5000,
        DB_URL: process.env.DB_URL,
        NODE_ENV: process.env.NODE_ENV,
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
        JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
        JWT_ACCESS_REFRESH_SECRET: process.env.JWT_ACCESS_REFRESH_SECRET,
        JWT_ACCESS_REFRESH_EXPIRES: process.env.JWT_ACCESS_REFRESH_EXPIRES,
        BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND,
        FRONTEND_URL: process.env.FRONTEND_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
        GOOGLE_SEARCH_CONSOLE_CLIENT_ID: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
        GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
        GOOGLE_SEARCH_CONSOLE_REDIRECT_URI: process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI,
        GOOGLE_TOKEN_ENCRYPTION_KEY: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
        GOOGLE_TAG_MANAGER_CLIENT_ID: process.env.GOOGLE_TAG_MANAGER_CLIENT_ID,
        GOOGLE_TAG_MANAGER_CLIENT_SECRET: process.env.GOOGLE_TAG_MANAGER_CLIENT_SECRET,
        GOOGLE_TAG_MANAGER_REDIRECT_URI: process.env.GOOGLE_TAG_MANAGER_REDIRECT_URI,
        EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET,
        CLOUDINARY: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
        },
        STRIPE: {
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        },
    };
};
exports.envVers = loadEnvVars();
