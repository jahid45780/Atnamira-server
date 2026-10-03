import mongoose from "mongoose";


import AppError from "../../errorHerplrs/appError";

import { Booking } from "./booking.model";
import {
  BookingStatus,
  IBookingItem,
  ICreateCheckoutBooking,
  PaymentStatus,
} from "./booking.interface";

import { User } from "../user/user.model";
import { Cart } from "../card/cart.model";
import { stripe } from "../../config/stripe.config";
import { envVers } from "../../config/env";

const createCheckoutBooking = async (
  payload: ICreateCheckoutBooking
) => {
  const {
    userId,
    guestId,
    email,
    name,
    phone,
    address,
  } = payload;

  // --------------------------------------------------
  // 1. Validate owner
  // --------------------------------------------------

  if (!userId && !guestId) {
    throw new AppError(
      400,
      "Either userId or guestId is required"
    );
  }

  if (userId && guestId) {
    throw new AppError(
      400,
      "userId and guestId cannot be used together"
    );
  }

  // --------------------------------------------------
  // 2. Validate checkout information
  // --------------------------------------------------

  if (!email?.trim()) {
    throw new AppError(400, "Email is required");
  }

  if (!name?.trim()) {
    throw new AppError(400, "Name is required");
  }

  if (!phone?.trim()) {
    throw new AppError(400, "Phone is required");
  }

  if (!address?.trim()) {
    throw new AppError(400, "Address is required");
  }

  // --------------------------------------------------
  // 3. Validate logged-in user
  // --------------------------------------------------

  if (userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (user.IsDeleted) {
      throw new AppError(403, "User account is deleted");
    }

    if (!user.IsActive) {
      throw new AppError(403, "User account is inactive");
    }
  }

  // --------------------------------------------------
  // 4. Find cart
  // --------------------------------------------------

  const cartQuery = userId
    ? { user: userId }
    : { guestId };

  const cart = await Cart.findOne(cartQuery).populate(
    "items.product"
  );

  if (!cart) {
    throw new AppError(404, "Cart not found");
  }

  if (!cart.items || cart.items.length === 0) {
    throw new AppError(400, "Your cart is empty");
  }

  // --------------------------------------------------
  // 5. Validate products and calculate total
  // --------------------------------------------------

  const bookingItems: IBookingItem[] = [];

  let totalAmount = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product as any;

    if (!product) {
      throw new AppError(
        404,
        "One of the products in your cart no longer exists"
      );
    }

    // Product active check
    if (product.isActive === false) {
      throw new AppError(
        400,
        `${product.name} is no longer available`
      );
    }

    // Stock check
    if (product.stock < cartItem.quantity) {
      throw new AppError(
        400,
        `${product.name} has only ${product.stock} item(s) in stock`
      );
    }

    // Color check
    if (
      product.colors?.length &&
      !product.colors.includes(cartItem.color)
    ) {
      throw new AppError(
        400,
        `${cartItem.color} is not available for ${product.name}`
      );
    }

    // Size check
    if (
      product.sizes?.length &&
      !product.sizes.includes(cartItem.size)
    ) {
      throw new AppError(
        400,
        `${cartItem.size} is not available for ${product.name}`
      );
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

  const booking = await Booking.create({
    ...(userId
      ? {
          user: new mongoose.Types.ObjectId(userId),
        }
      : {
          guestId,
        }),

    email: email.trim().toLowerCase(),

    items: bookingItems,

    shippingAddress: {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
    },

    totalAmount,

    paymentStatus: PaymentStatus.PENDING,

    bookingStatus: BookingStatus.PENDING,
  });

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

    const metadata: Record<string, string> = {
      bookingId: booking._id.toString(),
      email: email.trim().toLowerCase(),
    };

    if (userId) {
      metadata.userId = userId;
    }

    if (guestId) {
      metadata.guestId = guestId;
    }

    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode: "payment",

        customer_email: email.trim().toLowerCase(),

        line_items: lineItems,

        metadata,

        payment_intent_data: {
          metadata,
        },

        success_url:
          `${envVers.FRONTEND_URL}/payment/success` +
          `?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${envVers.FRONTEND_URL}/payment/cancel`,

      });

    // --------------------------------------------------
    // 8. Save Stripe information
    // --------------------------------------------------

    booking.stripeSessionId = checkoutSession.id;

    if (
      typeof checkoutSession.payment_intent === "string"
    ) {
      booking.stripePaymentIntentId =
        checkoutSession.payment_intent;
    }

    await booking.save();

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
  } catch (error) {
    // Stripe session failed.
    // Delete the pending booking because payment session
    // was never created.

    await Booking.findByIdAndDelete(booking._id);

    throw new AppError(
      500,
      "Failed to create Stripe checkout session"
    );
  }
};


// ======================================================
// Get My Bookings
// ======================================================

const getMyBookings = async ({
  userId,
  guestId,
}: {
  userId?: string;
  guestId?: string;
}) => {
  // ======================================================
  // Validate owner
  // ======================================================

  if (!userId && !guestId) {
    throw new AppError(
      400,
      "No user or guest ID found"
    );
  }

  if (userId && guestId) {
    throw new AppError(
      400,
      "userId and guestId cannot be used together"
    );
  }

  // ======================================================
  // Build query
  // ======================================================

  const query = userId
    ? { user: userId }
    : { guestId };

  // ======================================================
  // Get bookings
  // ======================================================

  const bookings = await Booking.find(query)
    .sort({ createdAt: -1 })
    .populate("items.product");

  return bookings;
};


// ======================================================
// Get Booking By ID
// Guest + Logged-in User
// ======================================================

const getBookingById = async ({
  userId,
  guestId,
  bookingId,
}: {
  userId?: string;
  guestId?: string;
  bookingId: string;
}) => {
  // ======================================================
  // Validate owner
  // ======================================================

  if (!userId && !guestId) {
    throw new AppError(
      400,
      "No user or guest ID found"
    );
  }

  if (userId && guestId) {
    throw new AppError(
      400,
      "userId and guestId cannot be used together"
    );
  }

  // ======================================================
  // Build owner query
  // ======================================================

  const ownerQuery = userId
    ? { user: userId }
    : { guestId };

  // ======================================================
  // Find booking
  // ======================================================

  const booking = await Booking.findOne({
    _id: bookingId,
    ...ownerQuery,
  }).populate("items.product");

  // ======================================================
  // Not found
  // ======================================================

  if (!booking) {
    throw new AppError(
      404,
      "Booking not found"
    );
  }

  return booking;
};





export const bookingService = {
  createCheckoutBooking,
  getMyBookings,
  getBookingById,
};