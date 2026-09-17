import { Types } from "mongoose";

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
}

export interface IBookingItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  color: string;
  size: string;
  subtotal: number;
}

export interface IShippingAddress {
  name: string;
  phone: string;
  address: string;
}

export interface IBooking {
  user: Types.ObjectId;

  items: IBookingItem[];

  shippingAddress: IShippingAddress;

  totalAmount: number;

  paymentStatus: PaymentStatus;

  bookingStatus: BookingStatus;

  stripeSessionId?: string;

  stripePaymentIntentId?: string;

  createdAt?: Date;
  updatedAt?: Date;
}