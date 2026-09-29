import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";
import { statsService } from "./stats.service";

const getAdminStats = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await statsService.getAdminStats();

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin stats retrieved successfully",
      data: result,
    });
  },
);

const getUserStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return;
    }

    const result = await statsService.getUserStats(userId);

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User stats retrieved successfully",
      data: result,
    });
  },
);

export const statsController = {
  getAdminStats,
  getUserStats,
};