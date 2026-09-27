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
exports.paymentController = void 0;
const env_1 = require("../../config/env");
const stripe_config_1 = require("../../config/stripe.config");
const booking_model_1 = require("../booking/booking.model");
const product_model_1 = require("../product/product.model");
const booking_interface_1 = require("../booking/booking.interface");
const payment_service_1 = require("./payment.service");
const cart_model_1 = require("../card/cart.model");
// ========================================
// CREATE CHECKOUT SESSION
// ========================================
const createCheckoutSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { bookingId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // -----------------------------
        // Check authentication
        // -----------------------------
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // -----------------------------
        // Validate booking ID
        // -----------------------------
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required",
            });
        }
        // -----------------------------
        // Find booking
        // -----------------------------
        const booking = yield booking_model_1.Booking.findOne({
            _id: bookingId,
            user: userId,
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        // -----------------------------
        // Already paid check
        // -----------------------------
        if (booking.paymentStatus ===
            booking_interface_1.PaymentStatus.PAID) {
            return res.status(400).json({
                success: false,
                message: "Booking is already paid",
            });
        }
        // -----------------------------
        // Create Stripe session
        // -----------------------------
        const session = yield payment_service_1.paymentService.createCheckoutSession({
            bookingId: booking._id.toString(),
            userId: userId.toString(),
            customerEmail: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.email) || "",
            totalAmount: booking.totalAmount,
        });
        // -----------------------------
        // Save Stripe Session ID
        // -----------------------------
        booking.stripeSessionId =
            session.id;
        // -----------------------------
        // Save Payment Intent ID
        // -----------------------------
        if (typeof session.payment_intent ===
            "string") {
            booking.stripePaymentIntentId =
                session.payment_intent;
        }
        yield booking.save();
        // -----------------------------
        // Response
        // -----------------------------
        return res.status(200).json({
            success: true,
            message: "Checkout session created successfully",
            data: {
                sessionId: session.id,
                url: session.url,
            },
        });
    }
    catch (error) {
        console.error("Create checkout session error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create checkout session",
        });
    }
});
// ========================================
// PROCESS SUCCESSFUL PAYMENT
// ========================================
const processSuccessfulPayment = (bookingId, sessionId, paymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    // --------------------------------------
    // Find booking
    // --------------------------------------
    var _a;
    const booking = yield booking_model_1.Booking.findById(bookingId);
    if (!booking) {
        console.log(`Booking not found: ${bookingId}`);
        return;
    }
    // --------------------------------------
    // DUPLICATE PROTECTION
    // --------------------------------------
    // If already PAID, do not decrease
    // stock or clear cart again.
    // --------------------------------------
    if (booking.paymentStatus ===
        booking_interface_1.PaymentStatus.PAID) {
        console.log(`Booking ${bookingId} already processed`);
        return;
    }
    // --------------------------------------
    // Validate booking items
    // --------------------------------------
    if (!((_a = booking.items) === null || _a === void 0 ? void 0 : _a.length)) {
        console.log(`Booking ${bookingId} has no items`);
        return;
    }
    // --------------------------------------
    // Check stock before updating anything
    // --------------------------------------
    for (const item of booking.items) {
        const product = yield product_model_1.Product.findById(item.product);
        if (!product) {
            throw new Error(`Product not found: ${item.product}`);
        }
        if (!product.stock || product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${item.name}`);
        }
    }
    // --------------------------------------
    // Decrease product stock
    // --------------------------------------
    for (const item of booking.items) {
        const product = yield product_model_1.Product.findById(item.product);
        if (!product) {
            throw new Error(`Product not found: ${item.product}`);
        }
        product.stock =
            product.stock - item.quantity;
        yield product.save();
        console.log(`Stock decreased: ${item.name} (-${item.quantity})`);
    }
    // --------------------------------------
    // Update booking
    // --------------------------------------
    booking.paymentStatus =
        booking_interface_1.PaymentStatus.PAID;
    booking.bookingStatus =
        booking_interface_1.BookingStatus.CONFIRMED;
    if (sessionId) {
        booking.stripeSessionId =
            sessionId;
    }
    if (paymentIntentId) {
        booking.stripePaymentIntentId =
            paymentIntentId;
    }
    yield booking.save();
    // --------------------------------------
    // Clear user's cart
    // --------------------------------------
    yield cart_model_1.Cart.findOneAndUpdate({
        user: booking.user,
    }, {
        $set: {
            items: [],
        },
    });
    console.log(`Cart cleared for user ${booking.user}`);
    console.log(`Booking ${bookingId} successfully processed`);
});
// ========================================
// STRIPE WEBHOOK
// ========================================
const handleStripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const signature = req.headers["stripe-signature"];
    // --------------------------------------
    // Check signature
    // --------------------------------------
    if (!signature) {
        return res.status(400).send("Missing stripe-signature");
    }
    // --------------------------------------
    // Check webhook secret
    // --------------------------------------
    if (!env_1.envVers.STRIPE
        .STRIPE_WEBHOOK_SECRET) {
        return res.status(500).send("Stripe webhook secret is missing");
    }
    let event;
    // --------------------------------------
    // Verify Stripe webhook
    // --------------------------------------
    try {
        event =
            stripe_config_1.stripe.webhooks.constructEvent(req.body, signature, env_1.envVers.STRIPE
                .STRIPE_WEBHOOK_SECRET);
    }
    catch (error) {
        console.error("Webhook signature verification failed:", error);
        return res.status(400).send("Webhook signature verification failed");
    }
    // --------------------------------------
    // Handle event
    // --------------------------------------
    try {
        switch (event.type) {
            // ==================================
            // CHECKOUT SESSION COMPLETED
            // ==================================
            case "checkout.session.completed": {
                const session = event.data.object;
                const bookingId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.bookingId;
                if (!bookingId) {
                    console.log("Booking ID missing from session metadata");
                    break;
                }
                console.log(`Processing checkout.session.completed for ${bookingId}`);
                yield processSuccessfulPayment(bookingId, session.id, typeof session.payment_intent ===
                    "string"
                    ? session.payment_intent
                    : undefined);
                break;
            }
            // ==================================
            // PAYMENT INTENT SUCCEEDED
            // ==================================
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const bookingId = (_b = paymentIntent.metadata) === null || _b === void 0 ? void 0 : _b.bookingId;
                if (!bookingId) {
                    console.log("Booking ID missing from PaymentIntent metadata");
                    break;
                }
                console.log(`Processing payment_intent.succeeded for ${bookingId}`);
                yield processSuccessfulPayment(bookingId, undefined, paymentIntent.id);
                break;
            }
            // ==================================
            // PAYMENT INTENT FAILED
            // ==================================
            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                const bookingId = (_c = paymentIntent.metadata) === null || _c === void 0 ? void 0 : _c.bookingId;
                if (!bookingId) {
                    console.log("Booking ID missing from failed PaymentIntent");
                    break;
                }
                const booking = yield booking_model_1.Booking.findById(bookingId);
                if (!booking) {
                    console.log(`Booking not found: ${bookingId}`);
                    break;
                }
                // --------------------------------
                // Don't overwrite successful payment
                // --------------------------------
                if (booking.paymentStatus ===
                    booking_interface_1.PaymentStatus.PAID) {
                    console.log(`Booking ${bookingId} already paid`);
                    break;
                }
                booking.paymentStatus =
                    booking_interface_1.PaymentStatus.FAILED;
                yield booking.save();
                console.log(`Payment failed for booking ${bookingId}`);
                break;
            }
            // ==================================
            // OTHER EVENTS
            // ==================================
            default: {
                console.log(`Unhandled Stripe event: ${event.type}`);
            }
        }
        // --------------------------------------
        // Stripe success response
        // --------------------------------------
        return res.status(200).json({
            received: true,
        });
    }
    catch (error) {
        console.error("Stripe webhook processing error:", error);
        return res.status(500).json({
            success: false,
            message: "Webhook processing failed",
        });
    }
});
// ========================================
// EXPORT
// ========================================
exports.paymentController = {
    createCheckoutSession,
    handleStripeWebhook,
};
