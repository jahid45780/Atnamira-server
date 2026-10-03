import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { bookingService } from "./booking.service";
import { sentResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHerplrs/appError";

// ======================================================
// CHECKOUT
// Guest + Logged-in User
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
    } = req.body ?? {};

    console.log(
      "========== CHECKOUT DEBUG =========="
    );

    console.log("User ID:", userId);
    console.log("Guest ID:", guestId);
    console.log("Cookies:", req.cookies);
    console.log("Body:", req.body);

    console.log(
      "====================================="
    );

    if (!userId && !guestId) {
      throw new AppError(
        400,
        "No user or guest cart ID found"
      );
    }

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
// GET MY BOOKINGS
// Guest + Logged-in User
// ======================================================

const getMyBookings = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const guestId = userId
      ? undefined
      : req.cookies?.guestCartId;

    console.log(
      "========== GET MY BOOKINGS =========="
    );

    console.log("User ID:", userId);
    console.log("Guest ID:", guestId);
    console.log("Cookies:", req.cookies);

    console.log(
      "======================================"
    );

    if (!userId && !guestId) {
      throw new AppError(
        400,
        "No user or guest cart ID found"
      );
    }

    const result =
      await bookingService.getMyBookings({
        userId,
        guestId,
      });

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
// GET BOOKING BY ID
// Guest + Logged-in User
// ======================================================

const getBookingById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const guestId = userId
      ? undefined
      : req.cookies?.guestCartId;

    const bookingId = String(req.params.id);

    console.log(
      "========== GET BOOKING DETAILS =========="
    );

    console.log("Booking ID:", bookingId);
    console.log("User ID:", userId);
    console.log("Guest ID:", guestId);

    console.log(
      "=========================================="
    );

    if (!userId && !guestId) {
      throw new AppError(
        400,
        "No user or guest cart ID found"
      );
    }

    const result =
      await bookingService.getBookingById({
        userId,
        guestId,
        bookingId,
      });

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