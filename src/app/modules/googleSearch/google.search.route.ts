
import { Router } from "express";
import { checkAuth } from "../auth/authCheck";
import { Role } from "../user/user.interface";
import { googleSearchConsoleController } from "./google.search.controller";

const router = Router();

// Admin authentication middleware
const adminAuth = checkAuth(Role.ADMIN);

// Google OAuth connection
router.get(
  "/connect",
  adminAuth,
  googleSearchConsoleController.connect
);

// Google OAuth callback
router.get(
  "/callback",
  googleSearchConsoleController.callback
);

// Connection status
router.get(
  "/status",
  adminAuth,
  googleSearchConsoleController.getStatus
);

// Get available Search Console properties
router.get(
  "/properties",
  adminAuth,
  googleSearchConsoleController.getProperties
);

// Select website property
router.patch(
  "/select-property",
  adminAuth,
  googleSearchConsoleController.selectProperty
);

// Disconnect Google Search Console
router.delete(
  "/disconnect",
  adminAuth,
  googleSearchConsoleController.disconnect
);

router.get(
  "/dates",
  adminAuth,
  googleSearchConsoleController.getDateAnalytics
);

export const googleSearchConsoleRoutes = router;
