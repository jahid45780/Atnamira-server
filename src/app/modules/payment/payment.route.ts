
import { Router } from "express";

import { paymentController } from "./payment.controller";
import { checkAuth } from "../auth/authCheck";
import { Role } from "../user/user.interface";



const router = Router();


// ========================================
// CREATE CHECKOUT SESSION
// ========================================

router.post(
  "/create-checkout-session",

  checkAuth(...Object.values(Role)),

  paymentController.createCheckoutSession,
);


export const paymentRoutes = router;