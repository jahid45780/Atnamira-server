import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";

import { StatsService } from "./stats.service";

/* =========================================================
   USER DASHBOARD
========================================================= */

const getUserStats = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user?.userId;

      if (!userId) {
    throw new Error("User not authenticated");
  }


    const result =
      await StatsService.getUserStats(
        userId,
      );

    sentResponse(res, {
      success: true,

      statusCode: httpStatus.OK,

      message:
        "User statistics retrieved successfully",

      data: result,
    });
  },
);

/* =========================================================
   ADMIN - USER OVERVIEW
========================================================= */

const getUserOverviewStats = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await StatsService.getUserOverviewStats();

    sentResponse(res, {
      success: true,

      statusCode: httpStatus.OK,

      message:
        "User overview statistics retrieved successfully",

      data: result,
    });
  },
);

/* =========================================================
   ADMIN - PRODUCT
========================================================= */

const getProductStats = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await StatsService.getProductStats();

    sentResponse(res, {
      success: true,

      statusCode: httpStatus.OK,

      message:
        "Product statistics retrieved successfully",

      data: result,
    });
  },
);

/* =========================================================
   ADMIN - BOOKING
========================================================= */

const getBookingStats = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await StatsService.getBookingStats();

    sentResponse(res, {
      success: true,

      statusCode: httpStatus.OK,

      message:
        "Booking statistics retrieved successfully",

      data: result,
    });
  },
);

/* =========================================================
   ADMIN - PAYMENT
========================================================= */

const getPaymentStats = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await StatsService.getPaymentStats();

    sentResponse(res, {
      success: true,

      statusCode: httpStatus.OK,

      message:
        "Payment statistics retrieved successfully",

      data: result,
    });
  },
);

/* =========================================================
   EXPORT
========================================================= */

export const StatsController = {
  getUserStats,

  getUserOverviewStats,

  getProductStats,

  getBookingStats,

  getPaymentStats,
};