"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const product_service_1 = require("./product.service");
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = require("http-status-codes");
const createProduct = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Product data comes as JSON string from multipart/form-data
    const productData = JSON.parse(req.body.data);
    // Uploaded files
    const files = req.files;
    // Create product payload
    const payload = Object.assign(Object.assign({}, productData), { images: {
            main: (_a = files[0]) === null || _a === void 0 ? void 0 : _a.path,
            hover: (_b = files[1]) === null || _b === void 0 ? void 0 : _b.path,
        } });
    console.log("PRODUCT PAYLOAD:", payload);
    const result = yield product_service_1.productService.createProduct(payload);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: 201,
        message: "Product created successfully",
        data: result.data,
    });
}));
// ================================
// Get All Products
// ================================
const getAllProducts = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_service_1.productService.getAllProducts(req.query);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Products retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getBestSellingToday = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_service_1.productService.getBestSellingToday();
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Best selling products fetched successfully",
        data: result.products,
        meta: {
            page: 1,
            limit: 10,
            total: result.totalProducts,
            totalPage: Math.ceil(result.totalProducts / 10),
        },
    });
}));
// ================================
// Get Single Product
// ================================
const getSingleProduct = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    if (typeof id !== "string") {
        throw new Error("Invalid product ID");
    }
    const result = yield product_service_1.productService.getSingleProduct(id);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Product retrieved successfully",
        data: result.data,
    });
}));
// ================================
// Update Product
// ================================
const updateProduct = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    if (typeof id !== "string") {
        throw new Error("Invalid product ID");
    }
    const result = yield product_service_1.productService.updateProduct(id, req.body);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Product updated successfully",
        data: result.data,
    });
}));
// ================================
// Delete Product
// ================================
const deleteProduct = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    if (typeof id !== "string") {
        throw new Error("Invalid product ID");
    }
    const result = yield product_service_1.productService.deleteProduct(id);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: 200,
        message: "Product deleted successfully",
        data: result.data,
    });
}));
exports.productController = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    getBestSellingToday
};
