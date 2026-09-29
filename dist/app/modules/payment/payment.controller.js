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
const cart_model_1 = require("../card/cart.model");
const booking_interface_1 = require("../booking/booking.interface");
// ======================================================
// PROCESS SUCCESSFUL PAYMENT
// ======================================================
const processSuccessfulPayment = (bookingId, sessionId, paymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    const mongoSession = yield booking_model_1.Booking.startSession();
    try {
        mongoSession.startTransaction();
        // --------------------------------------------------
        // 1. Find booking
        // --------------------------------------------------
        const booking = yield booking_model_1.Booking.findById(bookingId).session(mongoSession);
        if (!booking) {
            console.log(`Booking not found: ${bookingId}`);
            yield mongoSession.abortTransaction();
            return;
        }
        // --------------------------------------------------
        // 2. Already paid protection
        // --------------------------------------------------
        if (booking.paymentStatus ===
            booking_interface_1.PaymentStatus.PAID) {
            console.log(`Booking ${bookingId} already processed`);
            yield mongoSession.commitTransaction();
            return;
        }
        // --------------------------------------------------
        // 3. Validate booking items
        // --------------------------------------------------
        if (!booking.items ||
            booking.items.length === 0) {
            throw new Error(`Booking ${bookingId} has no items`);
        }
        // --------------------------------------------------
        // 4. Check and decrease stock atomically
        // --------------------------------------------------
        for (const item of booking.items) {
            const updatedProduct = yield product_model_1.Product.findOneAndUpdate({
                _id: item.product,
                // Important:
                // only decrease if enough stock exists
                stock: {
                    $gte: item.quantity,
                },
            }, {
                $inc: {
                    stock: -item.quantity,
                },
            }, {
                new: true,
                session: mongoSession,
            });
            if (!updatedProduct) {
                throw new Error(`Insufficient stock for product: ${item.name}`);
            }
            console.log(`Stock decreased: ${item.name} (-${item.quantity})`);
        }
        // --------------------------------------------------
        // 5. Update booking
        // --------------------------------------------------
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
        yield booking.save({
            session: mongoSession,
        });
        // --------------------------------------------------
        // 6. Clear cart
        // --------------------------------------------------
        if (booking.user) {
            yield cart_model_1.Cart.findOneAndUpdate({
                user: booking.user,
            }, {
                $set: {
                    items: [],
                },
            }, {
                session: mongoSession,
            });
            console.log(`User cart cleared: ${booking.user}`);
        }
        else if (booking.guestId) {
            yield cart_model_1.Cart.findOneAndDelete({
                guestId: booking.guestId,
            }, {
                session: mongoSession,
            });
            console.log(`Guest cart deleted: ${booking.guestId}`);
        }
        // --------------------------------------------------
        // 7. Commit transaction
        // --------------------------------------------------
        yield mongoSession.commitTransaction();
        console.log(`Booking ${bookingId} successfully processed`);
    }
    catch (error) {
        yield mongoSession.abortTransaction();
        console.error(`Failed to process booking ${bookingId}:`, error);
        throw error;
    }
    finally {
        yield mongoSession.endSession();
    }
});
// ======================================================
// STRIPE WEBHOOK
// ======================================================
const handleStripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const signature = req.headers["stripe-signature"];
    // --------------------------------------------------
    // 1. Check signature
    // --------------------------------------------------
    if (!signature) {
        return res.status(400).send("Missing stripe-signature");
    }
    // --------------------------------------------------
    // 2. Check webhook secret
    // --------------------------------------------------
    const webhookSecret = env_1.envVers.STRIPE
        .STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("Stripe webhook secret is missing");
        return res.status(500).send("Stripe webhook secret is missing");
    }
    let event;
    // --------------------------------------------------
    // 3. Verify Stripe event
    // --------------------------------------------------
    try {
        event =
            stripe_config_1.stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        console.error("Webhook signature verification failed:", error);
        return res.status(400).send("Webhook signature verification failed");
    }
    // --------------------------------------------------
    // 4. Handle Stripe event
    // --------------------------------------------------
    try {
        switch (event.type) {
            // ==============================================
            // CHECKOUT SESSION COMPLETED
            // ==============================================
            case "checkout.session.completed": {
                const session = event.data.object;
                const bookingId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.bookingId;
                if (!bookingId) {
                    console.error("Booking ID missing from Checkout Session metadata");
                    break;
                }
                console.log(`Stripe checkout completed: ${bookingId}`);
                yield processSuccessfulPayment(bookingId, session.id, typeof session.payment_intent ===
                    "string"
                    ? session.payment_intent
                    : undefined);
                break;
            }
            // ==============================================
            // PAYMENT INTENT SUCCEEDED
            // ==============================================
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const bookingId = (_b = paymentIntent.metadata) === null || _b === void 0 ? void 0 : _b.bookingId;
                if (!bookingId) {
                    console.error("Booking ID missing from PaymentIntent metadata");
                    break;
                }
                console.log(`Stripe payment succeeded: ${bookingId}`);
                yield processSuccessfulPayment(bookingId, undefined, paymentIntent.id);
                break;
            }
            // ==============================================
            // PAYMENT FAILED
            // ==============================================
            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                const bookingId = (_c = paymentIntent.metadata) === null || _c === void 0 ? void 0 : _c.bookingId;
                if (!bookingId) {
                    console.error("Booking ID missing from failed PaymentIntent metadata");
                    break;
                }
                const booking = yield booking_model_1.Booking.findById(bookingId);
                if (!booking) {
                    console.error(`Booking not found: ${bookingId}`);
                    break;
                }
                // --------------------------------------------
                // Don't change successful payment
                // --------------------------------------------
                if (booking.paymentStatus ===
                    booking_interface_1.PaymentStatus.PAID) {
                    console.log(`Booking ${bookingId} is already paid`);
                    break;
                }
                booking.paymentStatus =
                    booking_interface_1.PaymentStatus.FAILED;
                yield booking.save();
                console.log(`Payment failed: ${bookingId}`);
                break;
            }
            // ==============================================
            // OTHER EVENTS
            // ==============================================
            default: {
                console.log(`Unhandled Stripe event: ${event.type}`);
            }
        }
        // --------------------------------------------------
        // Stripe requires successful response
        // --------------------------------------------------
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
// ======================================================
// EXPORT
// ======================================================
exports.paymentController = {
    handleStripeWebhook,
};
