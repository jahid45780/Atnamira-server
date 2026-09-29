"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const routes_1 = require("./app/routes");
const globalErrorHandler_1 = require("./app/middleware/globalErrorHandler");
const NotFound_1 = __importDefault(require("./app/middleware/NotFound"));
const env_1 = require("./app/config/env");
require("./app/config/passport");
const payment_controller_1 = require("./app/modules/payment/payment.controller");
const app = (0, express_1.default)();
// ======================================================
// SESSION
// ======================================================
app.use((0, express_session_1.default)({
    secret: env_1.envVers.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
// ======================================================
// CORS
// ======================================================
app.use((0, cors_1.default)({
    origin: env_1.envVers.FRONTEND_URL,
    credentials: true,
}));
// ======================================================
// STRIPE WEBHOOK
//
// IMPORTANT:
// This MUST come before express.json()
// ======================================================
app.use("/api/v1/payment/webhook", express_1.default.raw({
    type: "application/json",
}), payment_controller_1.paymentController.handleStripeWebhook);
// ======================================================
// BODY PARSERS
// ======================================================
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true,
}));
// ======================================================
// COOKIE
// ======================================================
app.use((0, cookie_parser_1.default)());
// ======================================================
// PASSPORT
// ======================================================
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// ======================================================
// API ROUTES
// ======================================================
app.use("/api/v1", routes_1.router);
// ======================================================
// ROOT ROUTE
// ======================================================
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the Atnamira server",
    });
});
// ======================================================
// ERROR HANDLER
// ======================================================
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(NotFound_1.default);
exports.default = app;
