"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const authCheck_1 = require("../auth/authCheck");
const user_interface_1 = require("../user/user.interface");
const router = (0, express_1.Router)();
// ========================================
// CREATE CHECKOUT SESSION
// ========================================
router.post("/create-checkout-session", (0, authCheck_1.checkAuth)(...Object.values(user_interface_1.Role)), payment_controller_1.paymentController.createCheckoutSession);
exports.paymentRoutes = router;
