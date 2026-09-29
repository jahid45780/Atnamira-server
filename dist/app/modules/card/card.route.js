"use strict";
// import { Router } from "express";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRoutes = void 0;
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
const express_1 = require("express");
const cart_controller_1 = require("./cart.controller");
const authCheck_1 = require("../auth/authCheck");
const guestCart_middleware_1 = require("./guestCart.middleware");
const user_interface_1 = require("../user/user.interface");
const router = (0, express_1.Router)();
const cartOwner = [
    (0, authCheck_1.optionalAuth)(...Object.values(user_interface_1.Role)),
    guestCart_middleware_1.guestCartMiddleware,
];
router.post("/add-card", ...cartOwner, cart_controller_1.cartController.addToCart);
router.get("/my-cart", ...cartOwner, cart_controller_1.cartController.getMyCart);
router.patch("/update-item/:itemId", ...cartOwner, cart_controller_1.cartController.updateCartItem);
router.delete("/remove-item/:itemId", ...cartOwner, cart_controller_1.cartController.removeCartItem);
router.delete("/clear-cart", ...cartOwner, cart_controller_1.cartController.clearCart);
router.post("/merge", (0, authCheck_1.checkAuth)(...Object.values(user_interface_1.Role)), cart_controller_1.cartController.mergeGuestCart);
exports.cartRoutes = router;
