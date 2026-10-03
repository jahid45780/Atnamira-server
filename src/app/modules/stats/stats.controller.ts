import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";
import { statsService } from "./stats.service";
import AppError from "../../errorHerplrs/appError";


// ==========================================
// ADMIN STATS
// ==========================================

const getAdminStats = catchAsync(
  async (_req: Request, res: Response) => {
    const result =
      await statsService.getAdminStats();

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
        "Admin stats retrieved successfully",
      data: result,
    });
  },
);


// ==========================================
// USER STATS
// ==========================================

const getUserStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "User not authenticated",
      );
    }

    const result =
      await statsService.getUserStats(userId);

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
        "User stats retrieved successfully",
      data: result,
    });
  },
);

// ==========================================
// GET ALL ORDERS - ADMIN
// ==========================================

const getAllOrders = catchAsync(
  async (req: Request, res: Response) => {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const result =
      await statsService.getAllOrders(
        page,
        limit,
      );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
        "All orders retrieved successfully",

      data: result.data,

      meta: result.meta,
    });
  },
);


export const statsController = {
  getAdminStats,
  getUserStats,
   getAllOrders
};