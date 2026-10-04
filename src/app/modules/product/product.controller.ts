

import { Request, Response } from "express";
import { productService } from "./product.service";
import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";
import { IProduct } from "./product.interface";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHerplrs/appError";

const createProduct = catchAsync(
  async (req: Request, res: Response) => {
    // Product data comes as JSON string from multipart/form-data
    const productData = JSON.parse(req.body.data);

    // Uploaded files
    const files = req.files as Express.Multer.File[];

    // Create product payload
    const payload: IProduct = {
      ...productData,

      images: {
        main: files[0]?.path,
        hover: files[1]?.path,
      },
    };

    console.log("PRODUCT PAYLOAD:", payload);

    const result = await productService.createProduct(payload);

    sentResponse(res, {
      success: true,
      statusCode: 201,
      message: "Product created successfully",
      data: result.data,
    });
  }
);


 // ================================
// Get All Products
// ================================


const getAllProducts = catchAsync(
  async (req: Request, res: Response) => {
    const result = await productService.getAllProducts(
      req.query
    );

    sentResponse(res, {
      statusCode: 200,
      success: true,
      message: "Products retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);


const getBestSellingToday = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await productService.getBestSellingToday();

    sentResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Best selling products fetched successfully",
      data: result.products,
      meta: {
        page: 1,
        limit: 10,
        total: result.totalProducts,
        totalPage: Math.ceil(
          result.totalProducts / 10
        ),
      },
    });
  }
);


 // ================================
// Get Single Product
// ================================

const getSingleProduct = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid product ID");
    }

    const result = await productService.getSingleProduct(id);

    sentResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product retrieved successfully",
      data: result.data,
    });
  }
);


 // ================================
// Update Product
// ================================

const updateProduct = catchAsync(
  async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      throw new AppError(
        400,
        "Product ID is required"
      );
    }

    // =========================
    // FILES
    // =========================

    const files = req.files as
      | {
          [fieldname: string]: Express.Multer.File[];
        }
      | undefined;

    // =========================
    // BODY
    // =========================

    const payload = req.body ?? {};
    // =========================
    // SERVICE
    // =========================

    const result =
      await productService.updateProduct(
        id,
        payload,
        files
      );

    // =========================
    // RESPONSE
    // =========================

    sentResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product updated successfully",
      data: result.data,
    });
  }
);

  // ================================
// Delete Product
// ================================

const deleteProduct = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid product ID");
    }

    const result = await productService.deleteProduct(id);

    sentResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product deleted successfully",
      data: result.data,
    });
  }
);





export const productController = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getBestSellingToday
};