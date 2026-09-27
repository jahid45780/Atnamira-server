"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const booking_interface_1 = require("./booking.interface");
// =============================
// Booking Item Schema
// =============================
const bookingItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    color: {
        type: String,
        required: true,
        trim: true,
    },
    size: {
        type: String,
        required: true,
        trim: true,
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
}, {
    _id: false,
});
// =============================
// Shipping Address Schema
// =============================
const shippingAddressSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    _id: false,
});
// =============================
// Booking Schema
// =============================
const bookingSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    items: {
        type: [bookingItemSchema],
        required: true,
        validate: {
            validator: (items) => items.length > 0,
            message: "Booking must contain at least one item",
        },
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentStatus: {
        type: String,
        enum: Object.values(booking_interface_1.PaymentStatus),
        default: booking_interface_1.PaymentStatus.PENDING,
        index: true,
    },
    bookingStatus: {
        type: String,
        enum: Object.values(booking_interface_1.BookingStatus),
        default: booking_interface_1.BookingStatus.PENDING,
        index: true,
    },
    stripeSessionId: {
        type: String,
        unique: true,
        sparse: true,
    },
    stripePaymentIntentId: {
        type: String,
        unique: true,
        sparse: true,
    },
}, {
    timestamps: true,
});
exports.Booking = (0, mongoose_1.model)("Booking", bookingSchema);
