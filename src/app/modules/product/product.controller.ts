

import { Request, Response } from "express";
import { productService } from "./product.service";
import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";

const createProduct = catchAsync(
  async (req: Request, res: Response) => {
    const result = await productService.createProduct(
      req.body
    );

    sentResponse(res, {
      success: true,
      statusCode: 201,
      message: "Product created successfully",
      data: result.data,
    });
  }
);

export const productController = {
  createProduct,
};