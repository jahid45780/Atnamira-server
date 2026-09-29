import { Schema, model } from "mongoose";

import {
  BookingStatus,
  IBooking,
  IBookingItem,
  IShippingAddress,
  PaymentStatus,
} from "./booking.interface";

const bookingItemSchema = new Schema<IBookingItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const shippingAddressSchema =
  new Schema<IShippingAddress>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      _id: false,
    },
  );

const bookingSchema = new Schema<IBooking>(
  {
    // ==========================================
    // LOGGED-IN USER
    // ==========================================

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // ==========================================
    // GUEST USER
    // ==========================================

    guestId: {
      type: String,
      required: false,
      index: true,
    },

    // ==========================================
    // CUSTOMER EMAIL
    // ==========================================

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // ==========================================
    // BOOKING ITEMS
    // ==========================================

    items: {
      type: [bookingItemSchema],
      required: true,

      validate: {
        validator: (items: IBookingItem[]) =>
          items.length > 0,

        message:
          "Booking must contain at least one item",
      },
    },

    // ==========================================
    // SHIPPING ADDRESS
    // ==========================================

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // ==========================================
    // TOTAL AMOUNT
    // ==========================================

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },

    // ==========================================
    // BOOKING STATUS
    // ==========================================

    bookingStatus: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true,
    },

    // ==========================================
    // STRIPE SESSION ID
    // ==========================================

    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // ==========================================
    // STRIPE PAYMENT INTENT ID
    // ==========================================

    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },

  {
    timestamps: true,
  },
);

export const Booking = model<IBooking>(
  "Booking",
  bookingSchema,
);