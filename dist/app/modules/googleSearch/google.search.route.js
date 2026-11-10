"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleSearchConsoleRoutes = void 0;
const express_1 = require("express");
const authCheck_1 = require("../auth/authCheck");
const user_interface_1 = require("../user/user.interface");
const google_search_controller_1 = require("./google.search.controller");
const router = (0, express_1.Router)();
// Admin authentication middleware
const adminAuth = (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN);
// Google OAuth connection
router.get("/connect", adminAuth, google_search_controller_1.googleSearchConsoleController.connect);
// Google OAuth callback
router.get("/callback", google_search_controller_1.googleSearchConsoleController.callback);
// Connection status
router.get("/status", adminAuth, google_search_controller_1.googleSearchConsoleController.getStatus);
// Get available Search Console properties
router.get("/properties", adminAuth, google_search_controller_1.googleSearchConsoleController.getProperties);
// Select website property
router.patch("/select-property", adminAuth, google_search_controller_1.googleSearchConsoleController.selectProperty);
// Disconnect Google Search Console
router.delete("/disconnect", adminAuth, google_search_controller_1.googleSearchConsoleController.disconnect);
router.get("/dates", adminAuth, google_search_controller_1.googleSearchConsoleController.getDateAnalytics);
exports.googleSearchConsoleRoutes = router;
