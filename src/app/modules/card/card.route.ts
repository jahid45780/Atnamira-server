import { Router } from "express";
import { cartController } from "./cart.controller";
import { checkAuth } from "../auth/authCheck";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
  "/add-card",
   checkAuth(...Object.values(Role)),
  cartController.addToCart
);

export const cartRoutes = router;