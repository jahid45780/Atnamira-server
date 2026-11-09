"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRoutes = void 0;
const express_1 = require("express");
const contact_controller_1 = require("./contact.controller");
const user_interface_1 = require("../user/user.interface");
const authCheck_1 = require("../auth/authCheck");
const router = (0, express_1.Router)();
/**
 * PUBLIC
 * Anyone can view contact information
 */
router.get("/", contact_controller_1.ContactController.getContact);
/**
 * ADMIN ONLY
 * Create contact information
 */
router.post("/", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), contact_controller_1.ContactController.createContact);
/**
 * ADMIN ONLY
 * Update contact information
 */
router.patch("/", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), contact_controller_1.ContactController.updateContact);
exports.contactRoutes = router;
