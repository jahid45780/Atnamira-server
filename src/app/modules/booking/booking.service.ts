import mongoose from "mongoose";

import { Booking } from "./booking.model";
import {
  BookingStatus,
  PaymentStatus,
} from "./booking.interface";


import { Product } from "../product/product.model";
import { User } from "../user/user.model";

import { stripe } from "../../config/stripe.config";
import { envVers } from "../../config/env";
import { Cart } from "../card/cart.model";
import AppError from "../../errorHerplrs/appError";


// ==========================================
// Create Booking
// ==========================================

const createBooking = async (
  userId: string,
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    // ========================================
    // 1. Find User
    // ========================================

    const user = await User.findById(userId)
      .session(session)
      .lean();

    if (!user) {
      throw new AppError( 404, "User not found");
    }

    // ========================================
    // 2. Check User Information
    // ========================================

    if (!user.name) {
      throw new AppError(
       400, "Please update your name before booking",
      );
    }

    if (!user.phone) {
      throw new AppError(
      400,  "Please update your phone number before booking",
      );
    }

    if (!user.address) {
      throw new AppError(
       400, "Please update your address before booking",
      );
    }

    // ========================================
    // 3. Find Cart
    // ========================================

    const cart = await Cart.findOne({
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
      const product =
        cartItem.product as unknown as {
          _id: mongoose.Types.ObjectId;
          name: string;
          price: number;
          stock: number;
          isActive: boolean;
          colors: string[];
          sizes: string[];
        };

      // Product exists?
      if (!product) {
        throw new AppError(
         400, "Product not found",
        );
      }

      // Product active?
      if (!product.isActive) {
        throw new Error(
          `${product.name} is not available`,
        );
      }

      // ======================================
      // Check Color
      // ======================================

      if (
        !product.colors.includes(
          cartItem.color,
        )
      ) {
        throw new Error(
          `Color ${cartItem.color} is not available for ${product.name}`,
        );
      }

      // ======================================
      // Check Size
      // ======================================

      if (
        !product.sizes.includes(
          cartItem.size,
        )
      ) {
        throw new Error(
          `Size ${cartItem.size} is not available for ${product.name}`,
        );
      }

      // ======================================
      // Check Stock
      // ======================================

      if (
        product.stock <
        cartItem.quantity
      ) {
        throw new Error(
          `Not enough stock for ${product.name}`,
        );
      }

      // ======================================
      // IMPORTANT
      // Price comes from database
      // ======================================

      const price = product.price;

      const subtotal =
        price * cartItem.quantity;

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

    const bookingArray =
      await Booking.create(
        [
          {
            user: userId,

            items: bookingItems,

            shippingAddress,

            totalAmount,

            paymentStatus:
              PaymentStatus.PENDING,

            bookingStatus:
              BookingStatus.PENDING,
          },
        ],
        {
          session,
        },
      );

    const booking = bookingArray[0];

    // ========================================
    // 7. Create Stripe Checkout Session
    // ========================================

    const checkoutSession =
      await stripe.checkout.sessions.create(
        {
          mode: "payment",

          line_items:
            bookingItems.map((item) => ({
              price_data: {
                currency: "usd",

                product_data: {
                  name: `${item.name} - ${item.color} - ${item.size}`,
                },

                unit_amount:
                  Math.round(
                    item.price * 100,
                  ),
              },

              quantity: item.quantity,
            })),

          success_url:
            `${envVers.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${envVers.FRONTEND_URL}/payment/cancel`,

          metadata: {
            bookingId:
              booking._id.toString(),

            userId,
          },
        },
      );

    // ========================================
    // 8. Save Stripe Session ID
    // ========================================

    booking.stripeSessionId =
      checkoutSession.id;

    await booking.save({
      session,
    });

    // ========================================
    // 9. Commit Transaction
    // ========================================

    await session.commitTransaction();

    // ========================================
    // 10. Return Data
    // ========================================

    return {
      booking,

      checkoutUrl:
        checkoutSession.url,
    };
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
};


// ==========================================
// Get My Bookings
// ==========================================

const getMyBookings = async (
  userId: string,
) => {
  const bookings =
    await Booking.find({
      user: userId,
    })
      .populate(
        "items.product",
        "name images price",
      )
      .sort({
        createdAt: -1,
      });

  return bookings;
};


// ==========================================
// Get Single Booking
// ==========================================

const getBookingById = async (
  userId: string,
  bookingId: string,
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      bookingId,
    )
  ) {
    throw new Error(
      "Invalid booking ID",
    );
  }

  const booking =
    await Booking.findOne({
      _id: bookingId,
      user: userId,
    }).populate(
      "items.product",
      "name images price",
    );

  if (!booking) {
    throw new Error(
      "Booking not found",
    );
  }

  return booking;
};


export const bookingService = {
  createBooking,
  getMyBookings,
  getBookingById,
};