
import { envVers } from "../../config/env";
import { stripe } from "../../config/stripe.config";

import {
  ICreateCheckoutSessionPayload,
} from "./payment.interface";

const createCheckoutSession = async (
  payload: ICreateCheckoutSessionPayload,
) => {
  const {
    bookingId,
    userId,
    customerEmail,
    totalAmount,
  } = payload;

  const session =
    await stripe.checkout.sessions.create({
      mode: "payment",

      payment_method_types: ["card"],

      customer_email: customerEmail,

      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name: `Atnamira Booking #${bookingId}`,
              description:
                "Atnamira booking payment",
            },

            // Stripe amount = cents
            unit_amount: Math.round(
              totalAmount * 100,
            ),
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

      success_url:
        `${envVers.FRONTEND_URL}/payment/success` +
        "?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        `${envVers.FRONTEND_URL}/payment/cancel`,
    });

  return session;
};

const getCheckoutSession = async (
  sessionId: string,
) => {
  const session =
    await stripe.checkout.sessions.retrieve(
      sessionId,
    );

  return session;
};

export const paymentService = {
  createCheckoutSession,
  getCheckoutSession,
};