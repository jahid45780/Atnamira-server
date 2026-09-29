// import { Router } from "express";

// import { cartController } from "./cart.controller";
// import { checkAuth } from "../auth/authCheck";
// import { Role } from "../user/user.interface";

// const router = Router();

// const authenticatedUser = checkAuth(
//   ...Object.values(Role)
// );

// router.post(
//   "/add-card",
//   authenticatedUser,
//   cartController.addToCart
// );

// router.get(
//   "/my-cart",
//   authenticatedUser,
//   cartController.getMyCart
// );

// router.patch(
//   "/update-item/:itemId",
//   authenticatedUser,
//   cartController.updateCartItem
// );

// router.delete(
//   "/remove-item/:itemId",
//   authenticatedUser,
//   cartController.removeCartItem
// );

// router.delete(
//   "/clear-cart",
//   authenticatedUser,
//   cartController.clearCart
// );

// export const cartRoutes = router;




import { Router } from "express";

import { cartController } from "./cart.controller";
import { checkAuth, optionalAuth } from "../auth/authCheck";
import { guestCartMiddleware } from "./guestCart.middleware";
import { Role } from "../user/user.interface";

const router = Router();

const cartOwner = [
  optionalAuth(...Object.values(Role)),
  guestCartMiddleware,
];

router.post(
  "/add-card",
  ...cartOwner,
  cartController.addToCart
);

router.get(
  "/my-cart",
  ...cartOwner,
  cartController.getMyCart
);

router.patch(
  "/update-item/:itemId",
  ...cartOwner,
  cartController.updateCartItem
);

router.delete(
  "/remove-item/:itemId",
  ...cartOwner,
  cartController.removeCartItem
);

router.delete(
  "/clear-cart",
  ...cartOwner,
  cartController.clearCart
);

router.post(
  "/merge",
  checkAuth(...Object.values(Role)),
  cartController.mergeGuestCart
);

export const cartRoutes = router;