"use strict";
// import { Request, Response } from "express";
// import httpStatus from "http-status-codes";
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
const getCartOwner = (res) => {
    const owner = res.locals.cartOwner;
    if (!owner || (!owner.user && !owner.guestId)) {
        throw new Error("Cart owner not initialized");
    }
    return owner;
};
const addToCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const owner = getCartOwner(res);
    const result = yield cart_service_1.cartService.addToCart(Object.assign(Object.assign({}, owner), { product: req.body.product, quantity: req.body.quantity, color: req.body.color, size: req.body.size }));
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Product added to cart successfully",
        data: result,
    });
}));
const getMyCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const owner = getCartOwner(res);
    const result = yield cart_service_1.cartService.getMyCart(owner);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cart retrieved successfully",
        data: result,
    });
}));
const updateCartItem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const owner = getCartOwner(res);
    const result = yield cart_service_1.cartService.updateCartItem(Object.assign(Object.assign({}, owner), { itemId: String(req.params.itemId), quantity: req.body.quantity }));
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cart quantity updated successfully",
        data: result,
    });
}));
const removeCartItem = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const owner = getCartOwner(res);
    const result = yield cart_service_1.cartService.removeCartItem(owner, String(req.params.itemId));
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cart item removed successfully",
        data: result,
    });
}));
const clearCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const owner = getCartOwner(res);
    const result = yield cart_service_1.cartService.clearCart(owner);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cart cleared successfully",
        data: result,
    });
}));
const mergeGuestCart = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user) {
        throw new appError_1.default(401, "Login required");
    }
    const guestId = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.guestCartId;
    if (!guestId) {
        const result = yield cart_service_1.cartService.getMyCart({
            user: req.user.userId,
        });
        return (0, sendResponse_1.sentResponse)(res, {
            success: true,
            statusCode: http_status_codes_1.default.OK,
            message: "No guest cart to merge",
            data: result,
        });
    }
    const result = yield cart_service_1.cartService.mergeGuestCart(req.user.userId, guestId);
    res.clearCookie("guestCartId", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
    return (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Guest cart merged successfully",
        data: result,
    });
}));
exports.cartController = {
    addToCart,
    getMyCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    mergeGuestCart
};
