

import { Request, Response } from "express";
import { productService } from "./product.service";
import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";
import { IProduct } from "./product.interface";

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

    const result = await productService.getAllProducts();

    sentResponse(res, {
      success: true,
      statusCode: 200,
      message: "Products retrieved successfully",
      data: result.data,
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
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid product ID");
    }

    const result = await productService.updateProduct(
      id,
      req.body
    );

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
  deleteProduct
};