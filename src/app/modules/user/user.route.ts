import { Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createUserZodSchema } from "./user.validation";
import { checkAuth } from "../auth/authCheck";
import { Role } from "./user.interface";

const router = Router();


router.post('/register', validateRequest(createUserZodSchema), userController.createUser)
router.get("/me", checkAuth(...Object.values(Role)), userController.getMe)
router.get("/get-all-users", checkAuth(Role.ADMIN), userController.getAllUsers)
router.get("/:id", userController.getSingleUser)
router.patch( "/:userId", checkAuth(...Object.values(Role)), userController.updateUser);

/**
 * USER → ADMIN
 * ADMIN ONLY
 */
router.patch(
  "/:id/make-admin",
  checkAuth(Role.ADMIN),
  userController.makeAdmin,
);

/**
 * ADMIN → USER
 * ADMIN ONLY
 */
router.patch(
  "/:id/make-user",
  checkAuth(Role.ADMIN),
  userController.makeUser,
);

/**
 * Delete user
 * ADMIN ONLY
 */
router.delete(
  "/:id",
  checkAuth(Role.ADMIN),
  userController.deleteUser,
);


export const userRoutes =  router;