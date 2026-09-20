import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { cartService } from "./cart.service";
import { sentResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHerplrs/appError";

/**
 * Add To Cart
 */
const addToCart = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }

    const result = await cartService.addToCart({
      user: req.user.userId,
      product: req.body.product,
      quantity: req.body.quantity,
      color: req.body.color,
      size: req.body.size,
    });

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product added to cart successfully",
      data: result,
    });
  }
);

/**
 * Get My Cart
 */
const getMyCart = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }

    const result = await cartService.getMyCart(
      req.user.userId
    );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cart retrieved successfully",
      data: result,
    });
  }
);

/**
 * Update Cart Item
 */
const updateCartItem = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }

    const itemId = String(req.params.itemId);

    const result =
      await cartService.updateCartItem({
        user: req.user.userId,
        itemId,
        quantity: req.body.quantity,
      });

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cart quantity updated successfully",
      data: result,
    });
  }
);

/**
 * Remove Cart Item
 */
const removeCartItem = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }

    const itemId = String(req.params.itemId);

    const result =
      await cartService.removeCartItem(
        req.user.userId,
        itemId
      );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cart item removed successfully",
      data: result,
    });
  }
);

/**
 * Clear Cart
 */
const clearCart = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }

    const result =
      await cartService.clearCart(
        req.user.userId
      );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cart cleared successfully",
      data: result,
    });
  }
);

export const cartController = {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};