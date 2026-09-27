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
exports.bookingService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const booking_model_1 = require("./booking.model");
const booking_interface_1 = require("./booking.interface");
const user_model_1 = require("../user/user.model");
const stripe_config_1 = require("../../config/stripe.config");
const env_1 = require("../../config/env");
const cart_model_1 = require("../card/cart.model");
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
// ==========================================
// Create Booking
// ==========================================
const createBooking = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // ========================================
        // 1. Find User
        // ========================================
        const user = yield user_model_1.User.findById(userId)
            .session(session)
            .lean();
        if (!user) {
            throw new appError_1.default(404, "User not found");
        }
        // ========================================
        // 2. Check User Information
        // ========================================
        if (!user.name) {
            throw new appError_1.default(400, "Please update your name before booking");
        }
        if (!user.phone) {
            throw new appError_1.default(400, "Please update your phone number before booking");
        }
        if (!user.address) {
            throw new appError_1.default(400, "Please update your address before booking");
        }
        // ========================================
        // 3. Find Cart
        // ========================================
        const cart = yield cart_model_1.Cart.findOne({
            user: userId,
        })
            .populate("items.product")
            .session(session);
        if (!cart) {
            throw new Error("Cart not found");
        }
        if (!cart.items.length) {
            throw new Error("Cart is empty");
        }
        // ========================================
        // 4. Prepare Booking Items
        // ========================================
        const bookingItems = [];
        let totalAmount = 0;
        for (const cartItem of cart.items) {
            const product = cartItem.product;
            // Product exists?
            if (!product) {
                throw new appError_1.default(400, "Product not found");
            }
            // Product active?
            if (!product.isActive) {
                throw new Error(`${product.name} is not available`);
            }
            // ======================================
            // Check Color
            // ======================================
            if (!product.colors.includes(cartItem.color)) {
                throw new Error(`Color ${cartItem.color} is not available for ${product.name}`);
            }
            // ======================================
            // Check Size
            // ======================================
            if (!product.sizes.includes(cartItem.size)) {
                throw new Error(`Size ${cartItem.size} is not available for ${product.name}`);
            }
            // ======================================
            // Check Stock
            // ======================================
            if (product.stock <
                cartItem.quantity) {
                throw new Error(`Not enough stock for ${product.name}`);
            }
            // ======================================
            // IMPORTANT
            // Price comes from database
            // ======================================
            const price = product.price;
            const subtotal = price * cartItem.quantity;
            totalAmount += subtotal;
            bookingItems.push({
                product: product._id,
                name: product.name,
                quantity: cartItem.quantity,
                price,
                color: cartItem.color,
                size: cartItem.size,
                subtotal,
            });
        }
        // ========================================
        // 5. Shipping Address
        // From User Profile
        // ========================================
        const shippingAddress = {
            name: user.name,
            phone: user.phone,
            address: user.address,
        };
        // ========================================
        // 6. Create Booking
        // ========================================
        const bookingArray = yield booking_model_1.Booking.create([
            {
                user: userId,
                items: bookingItems,
                shippingAddress,
                totalAmount,
                paymentStatus: booking_interface_1.PaymentStatus.PENDING,
                bookingStatus: booking_interface_1.BookingStatus.PENDING,
            },
        ], {
            session,
        });
        const booking = bookingArray[0];
        // ========================================
        // 7. Create Stripe Checkout Session
        // ========================================
        const checkoutSession = yield stripe_config_1.stripe.checkout.sessions.create({
            mode: "payment",
            line_items: bookingItems.map((item) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `${item.name} - ${item.color} - ${item.size}`,
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            })),
            success_url: `${env_1.envVers.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${env_1.envVers.FRONTEND_URL}/payment/cancel`,
            metadata: {
                bookingId: booking._id.toString(),
                userId,
            },
        });
        // ========================================
        // 8. Save Stripe Session ID
        // ========================================
        booking.stripeSessionId =
            checkoutSession.id;
        yield booking.save({
            session,
        });
        // ========================================
        // 9. Commit Transaction
        // ========================================
        yield session.commitTransaction();
        // ========================================
        // 10. Return Data
        // ========================================
        return {
            booking,
            checkoutUrl: checkoutSession.url,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        yield session.endSession();
    }
});
// ==========================================
// Get My Bookings
// ==========================================
const getMyBookings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const bookings = yield booking_model_1.Booking.find({
        user: userId,
    })
        .populate("items.product", "name images price")
        .sort({
        createdAt: -1,
    });
    return bookings;
});
// ==========================================
// Get Single Booking
// ==========================================
const getBookingById = (userId, bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
    }
    const booking = yield booking_model_1.Booking.findOne({
        _id: bookingId,
        user: userId,
    }).populate("items.product", "name images price");
    if (!booking) {
        throw new Error("Booking not found");
    }
    return booking;
});
exports.bookingService = {
    createBooking,
    getMyBookings,
    getBookingById,
};
