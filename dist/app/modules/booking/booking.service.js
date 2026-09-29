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
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const booking_model_1 = require("./booking.model");
const booking_interface_1 = require("./booking.interface");
const user_model_1 = require("../user/user.model");
const cart_model_1 = require("../card/cart.model");
const stripe_config_1 = require("../../config/stripe.config");
const env_1 = require("../../config/env");
const createCheckoutBooking = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { userId, guestId, email, name, phone, address, } = payload;
    // --------------------------------------------------
    // 1. Validate owner
    // --------------------------------------------------
    if (!userId && !guestId) {
        throw new appError_1.default(400, "Either userId or guestId is required");
    }
    if (userId && guestId) {
        throw new appError_1.default(400, "userId and guestId cannot be used together");
    }
    // --------------------------------------------------
    // 2. Validate checkout information
    // --------------------------------------------------
    if (!(email === null || email === void 0 ? void 0 : email.trim())) {
        throw new appError_1.default(400, "Email is required");
    }
    if (!(name === null || name === void 0 ? void 0 : name.trim())) {
        throw new appError_1.default(400, "Name is required");
    }
    if (!(phone === null || phone === void 0 ? void 0 : phone.trim())) {
        throw new appError_1.default(400, "Phone is required");
    }
    if (!(address === null || address === void 0 ? void 0 : address.trim())) {
        throw new appError_1.default(400, "Address is required");
    }
    // --------------------------------------------------
    // 3. Validate logged-in user
    // --------------------------------------------------
    if (userId) {
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            throw new appError_1.default(404, "User not found");
        }
        if (user.IsDeleted) {
            throw new appError_1.default(403, "User account is deleted");
        }
        if (!user.IsActive) {
            throw new appError_1.default(403, "User account is inactive");
        }
    }
    // --------------------------------------------------
    // 4. Find cart
    // --------------------------------------------------
    const cartQuery = userId
        ? { user: userId }
        : { guestId };
    const cart = yield cart_model_1.Cart.findOne(cartQuery).populate("items.product");
    if (!cart) {
        throw new appError_1.default(404, "Cart not found");
    }
    if (!cart.items || cart.items.length === 0) {
        throw new appError_1.default(400, "Your cart is empty");
    }
    // --------------------------------------------------
    // 5. Validate products and calculate total
    // --------------------------------------------------
    const bookingItems = [];
    let totalAmount = 0;
    for (const cartItem of cart.items) {
        const product = cartItem.product;
        if (!product) {
            throw new appError_1.default(404, "One of the products in your cart no longer exists");
        }
        // Product active check
        if (product.isActive === false) {
            throw new appError_1.default(400, `${product.name} is no longer available`);
        }
        // Stock check
        if (product.stock < cartItem.quantity) {
            throw new appError_1.default(400, `${product.name} has only ${product.stock} item(s) in stock`);
        }
        // Color check
        if (((_a = product.colors) === null || _a === void 0 ? void 0 : _a.length) &&
            !product.colors.includes(cartItem.color)) {
            throw new appError_1.default(400, `${cartItem.color} is not available for ${product.name}`);
        }
        // Size check
        if (((_b = product.sizes) === null || _b === void 0 ? void 0 : _b.length) &&
            !product.sizes.includes(cartItem.size)) {
            throw new appError_1.default(400, `${cartItem.size} is not available for ${product.name}`);
        }
        const price = Number(product.price);
        const quantity = Number(cartItem.quantity);
        const subtotal = price * quantity;
        totalAmount += subtotal;
        bookingItems.push({
            product: product._id,
            name: product.name,
            quantity,
            price,
            color: cartItem.color,
            size: cartItem.size,
            subtotal,
        });
    }
    // --------------------------------------------------
    // 6. Create booking
    // --------------------------------------------------
    const booking = yield booking_model_1.Booking.create(Object.assign(Object.assign({}, (userId
        ? {
            user: new mongoose_1.default.Types.ObjectId(userId),
        }
        : {
            guestId,
        })), { email: email.trim().toLowerCase(), items: bookingItems, shippingAddress: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
        }, totalAmount, paymentStatus: booking_interface_1.PaymentStatus.PENDING, bookingStatus: booking_interface_1.BookingStatus.PENDING }));
    // --------------------------------------------------
    // 7. Create Stripe Checkout Session
    // --------------------------------------------------
    try {
        const lineItems = bookingItems.map((item) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));
        const metadata = {
            bookingId: booking._id.toString(),
            email: email.trim().toLowerCase(),
        };
        if (userId) {
            metadata.userId = userId;
        }
        if (guestId) {
            metadata.guestId = guestId;
        }
        const checkoutSession = yield stripe_config_1.stripe.checkout.sessions.create({
            mode: "payment",
            customer_email: email.trim().toLowerCase(),
            line_items: lineItems,
            metadata,
            payment_intent_data: {
                metadata,
            },
            success_url: `${env_1.envVers.FRONTEND_URL}/payment/success` +
                `?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${env_1.envVers.FRONTEND_URL}/payment/cancel`,
        });
        // --------------------------------------------------
        // 8. Save Stripe information
        // --------------------------------------------------
        booking.stripeSessionId = checkoutSession.id;
        if (typeof checkoutSession.payment_intent === "string") {
            booking.stripePaymentIntentId =
                checkoutSession.payment_intent;
        }
        yield booking.save();
        // --------------------------------------------------
        // 9. Return checkout information
        // --------------------------------------------------
        return {
            bookingId: booking._id,
            totalAmount: booking.totalAmount,
            paymentStatus: booking.paymentStatus,
            bookingStatus: booking.bookingStatus,
            stripeSessionId: checkoutSession.id,
            checkoutUrl: checkoutSession.url,
        };
    }
    catch (error) {
        // Stripe session failed.
        // Delete the pending booking because payment session
        // was never created.
        yield booking_model_1.Booking.findByIdAndDelete(booking._id);
        throw new appError_1.default(500, "Failed to create Stripe checkout session");
    }
});
// ======================================================
// Get My Bookings
// ======================================================
const getMyBookings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const bookings = yield booking_model_1.Booking.find({
        user: userId,
    })
        .sort({ createdAt: -1 })
        .populate("items.product");
    return bookings;
});
// ======================================================
// Get Booking By ID
// ======================================================
const getBookingById = (userId, bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield booking_model_1.Booking.findOne({
        _id: bookingId,
        user: userId,
    }).populate("items.product");
    if (!booking) {
        throw new appError_1.default(404, "Booking not found");
    }
    return booking;
});
exports.bookingService = {
    createCheckoutBooking,
    getMyBookings,
    getBookingById,
};
