import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { bookingService } from "./booking.service";
import { sentResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";


// ======================================================
// Checkout
// ======================================================

const checkout = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const guestId = userId
      ? undefined
      : req.cookies?.guestCartId;

    const {
      email,
      name,
      phone,
      address,
    } = req.body;

    const result =
      await bookingService.createCheckoutBooking({
        userId,
        guestId,

        email,
        name,
        phone,
        address,
      });

    sentResponse(res, {
      success: true,

      statusCode: httpStatus.CREATED,

      message:
        "Checkout session created successfully",

      data: result,
    });
  }
);


// ======================================================
// Get My Bookings
// ======================================================

const getMyBookings = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) return;

    const result =
      await bookingService.getMyBookings(
        req.user.userId
      );

    sentResponse(res, {
      success: true,

      statusCode: httpStatus.OK,

      message:
        "Bookings retrieved successfully",

      data: result,
    });
  }
);


// ======================================================
// Get Booking By ID
// ======================================================

const getBookingById = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) return;

    const bookingId = String(req.params.id);

    const result =
      await bookingService.getBookingById(
        req.user.userId,
        bookingId
      );

    sentResponse(res, {
      success: true,

      statusCode: httpStatus.OK,

      message:
        "Booking retrieved successfully",

      data: result,
    });
  }
);


export const bookingController = {
  checkout,
  getMyBookings,
  getBookingById,
};