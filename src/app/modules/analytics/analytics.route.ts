import { Router } from "express";
import { analyticsController } from "./analytics.controller";
import { Role } from "../user/user.interface";
import { checkAuth, optionalAuth } from "../auth/authCheck";
import { analyticsRateLimit } from "../../middleware/analyticsRateLimit";

const router = Router();

// Public event collection; optional auth attaches user when logged in.
router.post(
  "/event",
   
  // Rate limit BEFORE controller
  analyticsRateLimit,
  optionalAuth(...Object.values(Role)),
  analyticsController.trackEvent,
);

// Admin-only reports.
router.get(
  "/overview",
  checkAuth(Role.ADMIN),
  analyticsController.getOverview,
);

export const analyticsRoutes = router;