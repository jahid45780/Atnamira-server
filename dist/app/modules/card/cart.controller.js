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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const cart_service_1 = require("./cart.service");
const sendResponse_1 = require("../../utils/sendResponse");
const catchAsync_1 = require("../../utils/catchAsync");
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
/**
 * Add To Cart
 */
const addToCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new appError_1.default(401, "Unauthorized");
    }
    const result = yield cart_service_1.cartService.addToCart({
        user: req.user.userId,
        product: req.body.product,
        quantity: req.body.quantity,
        color: req.body.color,
        size: req.body.size,
    });
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Product added to cart successfully",
        data: result,
    });
}));
/**
 * Get My Cart
 */
const getMyCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new appError_1.default(401, "Unauthorized");
    }
    const result = yield cart_service_1.cartService.getMyCart(req.user.userId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cart retrieved successfully",
        data: result,
    });
}));
/**
 * Update Cart Item
 */
const updateCartItem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new appError_1.default(401, "Unauthorized");
    }
    const itemId = String(req.params.itemId);
    const result = yield cart_service_1.cartService.updateCartItem({
        user: req.user.userId,
        itemId,
        quantity: req.body.quantity,
    });
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cart quantity updated successfully",
        data: result,
    });
}));
/**
 * Remove Cart Item
 */
const removeCartItem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new appError_1.default(401, "Unauthorized");
    }
    const itemId = String(req.params.itemId);
    const result = yield cart_service_1.cartService.removeCartItem(req.user.userId, itemId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cart item removed successfully",
        data: result,
    });
}));
/**
 * Clear Cart
 */
const clearCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new appError_1.default(401, "Unauthorized");
    }
    const result = yield cart_service_1.cartService.clearCart(req.user.userId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cart cleared successfully",
        data: result,
    });
}));
exports.cartController = {
    addToCart,
    getMyCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};
