import { Router } from "express";

import { ContactController } from "./contact.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../auth/authCheck";



const router = Router();

/**
 * PUBLIC
 * Anyone can view contact information
 */
router.get("/", ContactController.getContact);

/**
 * ADMIN ONLY
 * Create contact information
 */
router.post(
  "/",
   checkAuth(Role.ADMIN),
  ContactController.createContact,
);

/**
 * ADMIN ONLY
 * Update contact information
 */
router.patch(
  "/",
  checkAuth(Role.ADMIN),
  ContactController.updateContact,
);

export const contactRoutes = router;