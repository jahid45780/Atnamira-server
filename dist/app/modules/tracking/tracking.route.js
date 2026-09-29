"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingRoutes = void 0;
const express_1 = require("express");
const tracking_controller_1 = require("./tracking.controller");
const user_interface_1 = require("../user/user.interface");
const authCheck_1 = require("../auth/authCheck");
const router = (0, express_1.Router)();
// Frontend can read enabled IDs.
router.get("/public", tracking_controller_1.trackingController.getPublicSettings);
// Admin-only settings.
router.get("/admin", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), tracking_controller_1.trackingController.getAdminSettings);
router.patch("/admin", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), tracking_controller_1.trackingController.updateSettings);
exports.trackingRoutes = router;
