"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const user_interface_1 = require("../user/user.interface");
const authCheck_1 = require("../auth/authCheck");
const analyticsRateLimit_1 = require("../../middleware/analyticsRateLimit");
const router = (0, express_1.Router)();
// Public event collection; optional auth attaches user when logged in.
router.post("/event", 
// Rate limit BEFORE controller
analyticsRateLimit_1.analyticsRateLimit, (0, authCheck_1.optionalAuth)(...Object.values(user_interface_1.Role)), analytics_controller_1.analyticsController.trackEvent);
// Admin-only reports.
router.get("/overview", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), analytics_controller_1.analyticsController.getOverview);
exports.analyticsRoutes = router;
