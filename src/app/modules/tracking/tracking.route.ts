
import { Router } from "express";
import { trackingController } from "./tracking.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../auth/authCheck";

const router = Router();

// Frontend can read enabled IDs.
router.get("/public", trackingController.getPublicSettings);

// Admin-only settings.
router.get(
  "/admin",
  checkAuth(Role.ADMIN),
  trackingController.getAdminSettings,
);

router.patch(
  "/admin",
  checkAuth(Role.ADMIN),
  trackingController.updateSettings,
);

export const trackingRoutes = router;