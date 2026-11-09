"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = void 0;
const express_1 = require("express");
const stats_controller_1 = require("./stats.controller");
const user_interface_1 = require("../user/user.interface");
const authCheck_1 = require("../auth/authCheck");
const router = (0, express_1.Router)();
// ADMIN
router.get("/admin", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), stats_controller_1.statsController.getAdminStats);
// USER
router.get("/user", (0, authCheck_1.checkAuth)(...Object.values(user_interface_1.Role)), stats_controller_1.statsController.getUserStats);
router.get("/orders", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), stats_controller_1.statsController.getAllOrders);
exports.statsRoutes = router;
