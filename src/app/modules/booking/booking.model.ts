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
  }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
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
  }
);

const bookingSchema = new Schema<IBooking>(
  {
    // Logged-in user
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // Guest user
    guestId: {
      type: String,
      required: false,
      index: true,
    },

    // Customer email
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    items: {
      type: [bookingItemSchema],
      required: true,

      validate: {
        validator: (items: IBookingItem[]) => items.length > 0,
        message: "Booking must contain at least one item",
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
  }
);

/**
 * Booking must belong to either:
 * 1. logged-in user
 * OR
 * 2. guest user
 *
 * Not both.
 */
bookingSchema.pre("validate", function (next:any) {
  const hasUser = Boolean(this.user);
  const hasGuest = Boolean(this.guestId);

  if (hasUser === hasGuest) {
    return next(
      new Error("Booking must belong to either a user or a guest")
    );
  }

  next();
});

export const Booking = model<IBooking>("Booking", bookingSchema);