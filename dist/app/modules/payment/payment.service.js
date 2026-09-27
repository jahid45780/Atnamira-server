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
exports.paymentService = void 0;
const env_1 = require("../../config/env");
const stripe_config_1 = require("../../config/stripe.config");
const createCheckoutSession = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId, userId, customerEmail, totalAmount, } = payload;
    const session = yield stripe_config_1.stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: customerEmail,
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Atnamira Booking #${bookingId}`,
                        description: "Atnamira booking payment",
                    },
                    // Stripe amount = cents
                    unit_amount: Math.round(totalAmount * 100),
                },
                quantity: 1,
            },
        ],
        // Checkout Session metadata
        metadata: {
            bookingId,
            userId,
        },
        // PaymentIntent metadata
        payment_intent_data: {
            metadata: {
                bookingId,
                userId,
            },
        },
        success_url: `${env_1.envVers.FRONTEND_URL}/payment/success` +
            "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: `${env_1.envVers.FRONTEND_URL}/payment/cancel`,
    });
    return session;
});
const getCheckoutSession = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield stripe_config_1.stripe.checkout.sessions.retrieve(sessionId);
    return session;
});
exports.paymentService = {
    createCheckoutSession,
    getCheckoutSession,
};
