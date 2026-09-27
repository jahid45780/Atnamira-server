"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = void 0;
const express_1 = require("express");
const user_interface_1 = require("../user/user.interface");
const stats_controller_1 = require("./stats.controller");
const authCheck_1 = require("../auth/authCheck");
const router = (0, express_1.Router)();
/* =========================================================
   USER DASHBOARD
   User can see only his own bookings
========================================================= */
router.get("/user", (0, authCheck_1.checkAuth)(user_interface_1.Role.USER), stats_controller_1.StatsController.getUserStats);
/* =========================================================
   ADMIN - USER OVERVIEW
========================================================= */
router.get("/user-overview", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), stats_controller_1.StatsController.getUserOverviewStats);
/* =========================================================
   ADMIN - PRODUCT STATS
========================================================= */
router.get("/product", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), stats_controller_1.StatsController.getProductStats);
/* =========================================================
   ADMIN - BOOKING STATS
========================================================= */
router.get("/booking", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), stats_controller_1.StatsController.getBookingStats);
/* =========================================================
   ADMIN - PAYMENT STATS
========================================================= */
router.get("/payment", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), stats_controller_1.StatsController.getPaymentStats);
router.get("/orders", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), stats_controller_1.StatsController.getAllAdminBookings);
exports.statsRoutes = router;
