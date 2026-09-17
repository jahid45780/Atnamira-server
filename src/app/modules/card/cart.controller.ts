import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { cartService } from "./cart.service";
import { sentResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHerplrs/appError";


const addToCart = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }

    const userId = req.user.userId;

    const result = await cartService.addToCart({
      user: userId,
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

export const cartController = {
  addToCart,
};