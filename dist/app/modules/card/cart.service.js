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
exports.cartService = void 0;
const cart_model_1 = require("./cart.model");
const product_model_1 = require("../product/product.model");
/**
 * Add Product To Cart
 */
const addToCart = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, product, quantity, color = "", size = "", } = payload;
    if (!quantity || quantity < 1) {
        throw new Error("Quantity must be at least 1");
    }
    const productData = yield product_model_1.Product.findById(product);
    if (!productData) {
        throw new Error("Product not found");
    }
    if (productData.stock <= 0) {
        throw new Error("Product is out of stock");
    }
    if (productData.stock < quantity) {
        throw new Error("Not enough stock available");
    }
    let cart = yield cart_model_1.Cart.findOne({ user });
    // Create new cart
    if (!cart) {
        cart = yield cart_model_1.Cart.create({
            user,
            items: [
                {
                    product,
                    quantity,
                    color,
                    size,
                },
            ],
        });
        return cart;
    }
    // Find same product + color + size
    const existingItem = cart.items.find((item) => item.product.toString() === product &&
        item.color === color &&
        item.size === size);
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > productData.stock) {
            throw new Error("Not enough stock available");
        }
        existingItem.quantity = newQuantity;
    }
    else {
        cart.items.push({
            product: productData._id,
            quantity,
            color,
            size,
        });
    }
    yield cart.save();
    return cart;
});
/**
 * Get My Cart
 */
const getMyCart = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const cart = yield cart_model_1.Cart.findOne({ user }).populate({
        path: "items.product",
        select: "name slug price oldPrice images category stock badge",
    });
    if (!cart) {
        return {
            user,
            items: [],
        };
    }
    return cart;
});
/**
 * Update Cart Item Quantity
 */
const updateCartItem = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, itemId, quantity, } = payload;
    if (!quantity || quantity < 1) {
        throw new Error("Quantity must be at least 1");
    }
    const cart = yield cart_model_1.Cart.findOne({ user });
    if (!cart) {
        throw new Error("Cart not found");
    }
    const item = cart.items.id(itemId);
    if (!item) {
        throw new Error("Cart item not found");
    }
    const product = yield product_model_1.Product.findById(item.product);
    if (!product) {
        throw new Error("Product not found");
    }
    if (product.stock <= 0) {
        throw new Error("Product is out of stock");
    }
    if (quantity > product.stock) {
        throw new Error(`Only ${product.stock} items available in stock`);
    }
    item.quantity = quantity;
    yield cart.save();
    return cart;
});
/**
 * Remove Cart Item
 */
const removeCartItem = (user, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    const cart = yield cart_model_1.Cart.findOne({ user });
    if (!cart) {
        throw new Error("Cart not found");
    }
    const item = cart.items.id(itemId);
    if (!item) {
        throw new Error("Cart item not found");
    }
    item.deleteOne();
    yield cart.save();
    return cart;
});
/**
 * Clear Cart
 */
const clearCart = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const cart = yield cart_model_1.Cart.findOne({ user });
    if (!cart) {
        throw new Error("Cart not found");
    }
    // Don't use cart.items = []
    // Use pull to avoid Mongoose DocumentArray typing issue
    cart.items.splice(0, cart.items.length);
    yield cart.save();
    return cart;
});
exports.cartService = {
    addToCart,
    getMyCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};
