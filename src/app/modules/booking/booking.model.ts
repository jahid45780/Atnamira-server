import { Schema, model } from "mongoose";

import {
  IBooking,
  IBookingItem,
  IShippingAddress,
  PaymentStatus,
  BookingStatus,
} from "./booking.interface";

// =============================
// Booking Item Schema
// =============================

const bookingItemSchema =
  new Schema<IBookingItem>(
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

// =============================
// Shipping Address Schema
// =============================

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

// =============================
// Booking Schema
// =============================

const bookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

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

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },

    bookingStatus: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true,
    },

    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },

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