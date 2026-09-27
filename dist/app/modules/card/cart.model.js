"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
const mongoose_1 = require("mongoose");
const cartItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    color: {
        type: String,
        trim: true,
        default: "",
    },
    size: {
        type: String,
        trim: true,
        default: "",
    },
}, {
    _id: true,
});
const cartSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    items: {
        type: [cartItemSchema],
        default: [],
    },
}, {
    timestamps: true,
});
exports.Cart = (0, mongoose_1.model)("Cart", cartSchema);
