import { Request, Response } from "express";
import Stripe from "stripe";

import { envVers } from "../../config/env";
import { stripe } from "../../config/stripe.config";

import { Booking } from "../booking/booking.model";
import { Product } from "../product/product.model";
import { Cart } from "../card/cart.model";

import {
  PaymentStatus,
  BookingStatus,
} from "../booking/booking.interface";


// ======================================================
// PROCESS SUCCESSFUL PAYMENT
// ======================================================

const processSuccessfulPayment = async (
  bookingId: string,
  sessionId?: string,
  paymentIntentId?: string,
) => {
  const mongoSession = await Booking.startSession();

  try {
    mongoSession.startTransaction();

    // --------------------------------------------------
    // 1. Find booking
    // --------------------------------------------------

    const booking = await Booking.findById(
      bookingId,
    ).session(mongoSession);

    if (!booking) {
      console.log(
        `Booking not found: ${bookingId}`,
      );

      await mongoSession.abortTransaction();
      return;
    }

    // --------------------------------------------------
    // 2. Already paid protection
    // --------------------------------------------------

    if (
      booking.paymentStatus ===
      PaymentStatus.PAID
    ) {
      console.log(
        `Booking ${bookingId} already processed`,
      );

      await mongoSession.commitTransaction();
      return;
    }

    // --------------------------------------------------
    // 3. Validate booking items
    // --------------------------------------------------

    if (
      !booking.items ||
      booking.items.length === 0
    ) {
      throw new Error(
        `Booking ${bookingId} has no items`,
      );
    }

    // --------------------------------------------------
    // 4. Check and decrease stock atomically
    // --------------------------------------------------

    for (const item of booking.items) {
      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: item.product,

            // Important:
            // only decrease if enough stock exists
            stock: {
              $gte: item.quantity,
            },
          },

          {
            $inc: {
              stock: -item.quantity,
            },
          },

          {
            new: true,
            session: mongoSession,
          },
        );

      if (!updatedProduct) {
        throw new Error(
          `Insufficient stock for product: ${item.name}`,
        );
      }

      console.log(
        `Stock decreased: ${item.name} (-${item.quantity})`,
      );
    }

    // --------------------------------------------------
    // 5. Update booking
    // --------------------------------------------------

    booking.paymentStatus =
      PaymentStatus.PAID;

    booking.bookingStatus =
      BookingStatus.CONFIRMED;

    if (sessionId) {
      booking.stripeSessionId =
        sessionId;
    }

    if (paymentIntentId) {
      booking.stripePaymentIntentId =
        paymentIntentId;
    }

    await booking.save({
      session: mongoSession,
    });

    // --------------------------------------------------
    // 6. Clear cart
    // --------------------------------------------------

    if (booking.user) {
      await Cart.findOneAndUpdate(
        {
          user: booking.user,
        },
        {
          $set: {
            items: [],
          },
        },
        {
          session: mongoSession,
        },
      );

      console.log(
        `User cart cleared: ${booking.user}`,
      );
    } else if (booking.guestId) {
      await Cart.findOneAndDelete(
        {
          guestId: booking.guestId,
        },
        {
          session: mongoSession,
        },
      );

      console.log(
        `Guest cart deleted: ${booking.guestId}`,
      );
    }

    // --------------------------------------------------
    // 7. Commit transaction
    // --------------------------------------------------

    await mongoSession.commitTransaction();

    console.log(
      `Booking ${bookingId} successfully processed`,
    );
  } catch (error) {
    await mongoSession.abortTransaction();

    console.error(
      `Failed to process booking ${bookingId}:`,
      error,
    );

    throw error;
  } finally {
    await mongoSession.endSession();
  }
};


// ======================================================
// STRIPE WEBHOOK
// ======================================================

const handleStripeWebhook = async (
  req: Request,
  res: Response,
) => {
  const signature =
    req.headers["stripe-signature"];

  // --------------------------------------------------
  // 1. Check signature
  // --------------------------------------------------

  if (!signature) {
    return res.status(400).send(
      "Missing stripe-signature",
    );
  }

  // --------------------------------------------------
  // 2. Check webhook secret
  // --------------------------------------------------

  const webhookSecret =
    envVers.STRIPE
      .STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "Stripe webhook secret is missing",
    );

    return res.status(500).send(
      "Stripe webhook secret is missing",
    );
  }

  let event: Stripe.Event;

  // --------------------------------------------------
  // 3. Verify Stripe event
  // --------------------------------------------------

  try {
    event =
      stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
  } catch (error) {
    console.error(
      "Webhook signature verification failed:",
      error,
    );

    return res.status(400).send(
      "Webhook signature verification failed",
    );
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
        const session =
          event.data.object as Stripe.Checkout.Session;

        const bookingId =
          session.metadata?.bookingId;

        if (!bookingId) {
          console.error(
            "Booking ID missing from Checkout Session metadata",
          );

          break;
        }

        console.log(
          `Stripe checkout completed: ${bookingId}`,
        );

        await processSuccessfulPayment(
          bookingId,

          session.id,

          typeof session.payment_intent ===
            "string"
            ? session.payment_intent
            : undefined,
        );

        break;
      }

      // ==============================================
      // PAYMENT INTENT SUCCEEDED
      // ==============================================

      case "payment_intent.succeeded": {
        const paymentIntent =
          event.data.object as Stripe.PaymentIntent;

        const bookingId =
          paymentIntent.metadata?.bookingId;

        if (!bookingId) {
          console.error(
            "Booking ID missing from PaymentIntent metadata",
          );

          break;
        }

        console.log(
          `Stripe payment succeeded: ${bookingId}`,
        );

        await processSuccessfulPayment(
          bookingId,
          undefined,
          paymentIntent.id,
        );

        break;
      }

      // ==============================================
      // PAYMENT FAILED
      // ==============================================

      case "payment_intent.payment_failed": {
        const paymentIntent =
          event.data.object as Stripe.PaymentIntent;

        const bookingId =
          paymentIntent.metadata?.bookingId;

        if (!bookingId) {
          console.error(
            "Booking ID missing from failed PaymentIntent metadata",
          );

          break;
        }

        const booking =
          await Booking.findById(
            bookingId,
          );

        if (!booking) {
          console.error(
            `Booking not found: ${bookingId}`,
          );

          break;
        }

        // --------------------------------------------
        // Don't change successful payment
        // --------------------------------------------

        if (
          booking.paymentStatus ===
          PaymentStatus.PAID
        ) {
          console.log(
            `Booking ${bookingId} is already paid`,
          );

          break;
        }

        booking.paymentStatus =
          PaymentStatus.FAILED;

        await booking.save();

        console.log(
          `Payment failed: ${bookingId}`,
        );

        break;
      }

      // ==============================================
      // OTHER EVENTS
      // ==============================================

      default: {
        console.log(
          `Unhandled Stripe event: ${event.type}`,
        );
      }
    }

    // --------------------------------------------------
    // Stripe requires successful response
    // --------------------------------------------------

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed",
    });
  }
};


// ======================================================
// EXPORT
// ======================================================

export const paymentController = {
  handleStripeWebhook,
};