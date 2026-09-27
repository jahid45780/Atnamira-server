"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = require("../../middleware/validateRequest");
const user_validation_1 = require("./user.validation");
const authCheck_1 = require("../auth/authCheck");
const user_interface_1 = require("./user.interface");
const router = (0, express_1.Router)();
router.post('/register', (0, validateRequest_1.validateRequest)(user_validation_1.createUserZodSchema), user_controller_1.userController.createUser);
router.get("/me", (0, authCheck_1.checkAuth)(...Object.values(user_interface_1.Role)), user_controller_1.userController.getMe);
router.get("/get-all-users", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), user_controller_1.userController.getAllUsers);
router.get("/:id", user_controller_1.userController.getSingleUser);
router.patch("/:userId", (0, authCheck_1.checkAuth)(...Object.values(user_interface_1.Role)), user_controller_1.userController.updateUser);
/**
 * USER → ADMIN
 * ADMIN ONLY
 */
router.patch("/:id/make-admin", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), user_controller_1.userController.makeAdmin);
/**
 * ADMIN → USER
 * ADMIN ONLY
 */
router.patch("/:id/make-user", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), user_controller_1.userController.makeUser);
/**
 * Delete user
 * ADMIN ONLY
 */
router.delete("/:id", (0, authCheck_1.checkAuth)(user_interface_1.Role.ADMIN), user_controller_1.userController.deleteUser);
exports.userRoutes = router;
