import { Router } from "express";

import { Role } from "../user/user.interface";

import { StatsController } from "./stats.controller";
import { checkAuth } from "../auth/authCheck";

const router = Router();

/* =========================================================
   USER DASHBOARD
   User can see only his own bookings
========================================================= */

router.get(
  "/user",

  checkAuth(Role.USER),

  StatsController.getUserStats,
);

/* =========================================================
   ADMIN - USER OVERVIEW
========================================================= */

router.get(
  "/user-overview",

  checkAuth(Role.ADMIN),

  StatsController.getUserOverviewStats,
);

/* =========================================================
   ADMIN - PRODUCT STATS
========================================================= */

router.get(
  "/product",

  checkAuth(Role.ADMIN),

  StatsController.getProductStats,
);

/* =========================================================
   ADMIN - BOOKING STATS
========================================================= */

router.get(
  "/booking",

  checkAuth(Role.ADMIN),

  StatsController.getBookingStats,
);

/* =========================================================
   ADMIN - PAYMENT STATS
========================================================= */

router.get(
  "/payment",

  checkAuth(Role.ADMIN),

  StatsController.getPaymentStats,
);

router.get(
  "/orders",
  checkAuth(Role.ADMIN),
  StatsController.getAllAdminBookings,
);

export const statsRoutes = router;