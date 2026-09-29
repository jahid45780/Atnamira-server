"use strict";
// import { Schema, model } from "mongoose";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
// const cartItemSchema = new Schema(
//   {
//     product: {
//       type: Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },
//     quantity: {
//       type: Number,
//       required: true,
//       min: 1,
//       default: 1,
//     },
//     color: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     size: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//   },
//   {
//     _id: true,
//   }
// );
// const cartSchema = new Schema(
//   {
//     user: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true,
//     },
//     items: {
//       type: [cartItemSchema],
//       default: [],
//     },
//   },
//   {
//     timestamps: true,
//   }
// );
// export const Cart = model("Cart", cartSchema);
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
}, { _id: true });
const cartSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    guestId: {
        type: String,
        default: null,
    },
    items: {
        type: [cartItemSchema],
        default: [],
    },
}, { timestamps: true });
// One cart per authenticated user
cartSchema.index({ user: 1 }, {
    unique: true,
    partialFilterExpression: {
        user: { $type: "objectId" },
    },
});
// One cart per guest
cartSchema.index({ guestId: 1 }, {
    unique: true,
    partialFilterExpression: {
        guestId: { $type: "string" },
    },
});
// Every cart must have exactly one owner
cartSchema.pre("validate", function () {
    const hasUser = this.user != null;
    const hasGuest = !!this.guestId;
    if (hasUser === hasGuest) {
        this.invalidate("user", "Cart must have exactly one owner: user or guestId");
    }
});
exports.Cart = (0, mongoose_1.model)("Cart", cartSchema);
