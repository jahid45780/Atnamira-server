import { Router } from "express";

import { cartController } from "./cart.controller";
import { checkAuth } from "../auth/authCheck";
import { Role } from "../user/user.interface";

const router = Router();

const authenticatedUser = checkAuth(
  ...Object.values(Role)
);

router.post(
  "/add-card",
  authenticatedUser,
  cartController.addToCart
);

router.get(
  "/my-cart",
  authenticatedUser,
  cartController.getMyCart
);

router.patch(
  "/update-item/:itemId",
  authenticatedUser,
  cartController.updateCartItem
);

router.delete(
  "/remove-item/:itemId",
  authenticatedUser,
  cartController.removeCartItem
);

router.delete(
  "/clear-cart",
  authenticatedUser,
  cartController.clearCart
);

export const cartRoutes = router;