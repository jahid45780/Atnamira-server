import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { bookingService } from "./booking.service";

import { sentResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";


// ==========================================
// Create Booking
// ==========================================

const createBooking = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    if (!req.user) {
      return;
    }

    const result =
      await bookingService.createBooking(
        req.user.userId,
      );

    sentResponse(res, {
      success: true,
      statusCode:
        httpStatus.CREATED,

      message:
        "Booking created successfully",

      data: result,
    });
  },
);


// ==========================================
// Get My Bookings
// ==========================================

const getMyBookings = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    if (!req.user) {
      return;
    }

    const result =
      await bookingService.getMyBookings(
        req.user.userId,
      );

    sentResponse(res, {
      success: true,
      statusCode:
        httpStatus.OK,

      message:
        "Bookings retrieved successfully",

      data: result,
    });
  },
);


// ==========================================
// Get Single Booking
// ==========================================

const getBookingById = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    if (!req.user) {
      return;
    }

    const bookingId =
      String(req.params.id);

    const result =
      await bookingService.getBookingById(
        req.user.userId,
        bookingId,
      );

    sentResponse(res, {
      success: true,
      statusCode:
        httpStatus.OK,

      message:
        "Booking retrieved successfully",

      data: result,
    });
  },
);


export const bookingController = {
  createBooking,
  getMyBookings,
  getBookingById,
};