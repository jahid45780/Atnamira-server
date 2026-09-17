
import { Request, Response } from "express";
import Stripe from "stripe";

import { envVers } from "../../config/env";

import { Booking } from "../booking/booking.model";

import {
  PaymentStatus,
  BookingStatus,
} from "../booking/booking.interface";

import { paymentService } from "./payment.service";
import { stripe } from "../../config/stripe.config";


// ========================================
// CREATE CHECKOUT SESSION
// ========================================

const createCheckoutSession = async (
  req: Request,
  res: Response,
) => {
  try {
    const { bookingId } = req.body;

    const userId = req.user?.userId;

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

    const booking = await Booking.findOne({
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

    if (
      booking.paymentStatus ===
      PaymentStatus.PAID
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking is already paid",
      });
    }

    // -----------------------------
    // Create Stripe session
    // -----------------------------

    const session =
      await paymentService.createCheckoutSession({
        bookingId: booking._id.toString(),

        userId: userId.toString(),

        customerEmail:
          req.user?.email || "",

        totalAmount:
          booking.totalAmount,
      });

    // -----------------------------
    // Save Stripe Session ID
    // -----------------------------

    booking.stripeSessionId =
      session.id;

    // -----------------------------
    // Save Payment Intent ID
    // -----------------------------

    if (
      typeof session.payment_intent ===
      "string"
    ) {
      booking.stripePaymentIntentId =
        session.payment_intent;
    }

    await booking.save();

    // -----------------------------
    // Response
    // -----------------------------

    return res.status(200).json({
      success: true,

      message:
        "Checkout session created successfully",

      data: {
        sessionId: session.id,

        url: session.url,
      },
    });
  } catch (error) {
    console.error(
      "Create checkout session error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to create checkout session",
    });
  }
};


// ========================================
// STRIPE WEBHOOK
// ========================================

const handleStripeWebhook = async (
  req: Request,
  res: Response,
) => {
  const signature =
    req.headers["stripe-signature"];

  // -----------------------------
  // Check signature
  // -----------------------------

  if (!signature) {
    return res.status(400).send(
      "Missing stripe-signature",
    );
  }

  // -----------------------------
  // Check webhook secret
  // -----------------------------

  if (!envVers.STRIPE.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send(
      "Stripe webhook secret is missing",
    );
  }

  let event: Stripe.Event;

  // -----------------------------
  // Verify Stripe webhook
  // -----------------------------

  try {
    event =
      stripe.webhooks.constructEvent(
        req.body,
        signature,
        envVers.STRIPE.STRIPE_WEBHOOK_SECRET,
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

  // -----------------------------
  // Handle event
  // -----------------------------

  try {
    switch (event.type) {

      // ==================================
      // CHECKOUT SESSION COMPLETED
      // ==================================

      case "checkout.session.completed": {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        const bookingId =
          session.metadata?.bookingId;

        if (!bookingId) {
          console.log(
            "Booking ID missing from metadata",
          );

          break;
        }

        const booking =
          await Booking.findById(
            bookingId,
          );

        if (!booking) {
          console.log(
            `Booking not found: ${bookingId}`,
          );

          break;
        }

        // -----------------------------
        // Payment successful
        // -----------------------------

        booking.paymentStatus =
          PaymentStatus.PAID;

        // -----------------------------
        // Confirm booking
        // -----------------------------

        booking.bookingStatus =
          BookingStatus.CONFIRMED;

        // -----------------------------
        // Save Stripe Session ID
        // -----------------------------

        booking.stripeSessionId =
          session.id;

        // -----------------------------
        // Save Payment Intent ID
        // -----------------------------

        if (
          typeof session.payment_intent ===
          "string"
        ) {
          booking.stripePaymentIntentId =
            session.payment_intent;
        }

        await booking.save();

        console.log(
          `Booking ${bookingId} payment completed`,
        );

        break;
      }


      // ==================================
      // PAYMENT INTENT SUCCEEDED
      // ==================================

      case "payment_intent.succeeded": {
        const paymentIntent =
          event.data.object as
            Stripe.PaymentIntent;

        const bookingId =
          paymentIntent.metadata?.bookingId;

        if (!bookingId) {
          console.log(
            "Booking ID missing from PaymentIntent",
          );

          break;
        }

        const booking =
          await Booking.findById(
            bookingId,
          );

        if (!booking) {
          console.log(
            `Booking not found: ${bookingId}`,
          );

          break;
        }

        // -----------------------------
        // Payment successful
        // -----------------------------

        booking.paymentStatus =
          PaymentStatus.PAID;

        // -----------------------------
        // Confirm booking
        // -----------------------------

        booking.bookingStatus =
          BookingStatus.CONFIRMED;

        // -----------------------------
        // Save PaymentIntent ID
        // -----------------------------

        booking.stripePaymentIntentId =
          paymentIntent.id;

        await booking.save();

        console.log(
          `Payment succeeded for booking ${bookingId}`,
        );

        break;
      }


      // ==================================
      // PAYMENT INTENT FAILED
      // ==================================

      case "payment_intent.payment_failed": {
        const paymentIntent =
          event.data.object as
            Stripe.PaymentIntent;

        const bookingId =
          paymentIntent.metadata?.bookingId;

        if (!bookingId) {
          console.log(
            "Booking ID missing from failed payment",
          );

          break;
        }

        const booking =
          await Booking.findById(
            bookingId,
          );

        if (!booking) {
          console.log(
            `Booking not found: ${bookingId}`,
          );

          break;
        }

        // -----------------------------
        // Payment failed
        // -----------------------------

        booking.paymentStatus =
          PaymentStatus.FAILED;

        await booking.save();

        console.log(
          `Payment failed for booking ${bookingId}`,
        );

        break;
      }


      // ==================================
      // OTHER EVENTS
      // ==================================

      default: {
        console.log(
          `Unhandled Stripe event: ${event.type}`,
        );
      }
    }

    // -----------------------------
    // Stripe success response
    // -----------------------------

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


// ========================================
// EXPORT
// ========================================

export const paymentController = {
  createCheckoutSession,
  handleStripeWebhook,
};