"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const booking_interface_1 = require("./booking.interface");
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
const bookingSchema = new mongoose_1.Schema({
    // ==========================================
    // LOGGED-IN USER
    // ==========================================
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true,
    },
    // ==========================================
    // GUEST USER
    // ==========================================
    guestId: {
        type: String,
        required: false,
        index: true,
    },
    // ==========================================
    // CUSTOMER EMAIL
    // ==========================================
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    // ==========================================
    // BOOKING ITEMS
    // ==========================================
    items: {
        type: [bookingItemSchema],
        required: true,
        validate: {
            validator: (items) => items.length > 0,
            message: "Booking must contain at least one item",
        },
    },
    // ==========================================
    // SHIPPING ADDRESS
    // ==========================================
    shippingAddress: {
        type: shippingAddressSchema,
        required: true,
    },
    // ==========================================
    // TOTAL AMOUNT
    // ==========================================
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    // ==========================================
    // PAYMENT STATUS
    // ==========================================
    paymentStatus: {
        type: String,
        enum: Object.values(booking_interface_1.PaymentStatus),
        default: booking_interface_1.PaymentStatus.PENDING,
        index: true,
    },
    // ==========================================
    // BOOKING STATUS
    // ==========================================
    bookingStatus: {
        type: String,
        enum: Object.values(booking_interface_1.BookingStatus),
        default: booking_interface_1.BookingStatus.PENDING,
        index: true,
    },
    // ==========================================
    // STRIPE SESSION ID
    // ==========================================
    stripeSessionId: {
        type: String,
        unique: true,
        sparse: true,
    },
    // ==========================================
    // STRIPE PAYMENT INTENT ID
    // ==========================================
    stripePaymentIntentId: {
        type: String,
        unique: true,
        sparse: true,
    },
}, {
    timestamps: true,
});
exports.Booking = (0, mongoose_1.model)("Booking", bookingSchema);
