import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";
import { trackingService } from "./tracking.service";

const getPublicSettings = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await trackingService.getPublicSettings();

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Tracking settings retrieved",
      data: result,
    });
  },
);

const getAdminSettings = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await trackingService.getAdminSettings();

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin tracking settings retrieved",
      data: result,
    });
  },
);

const updateSettings = catchAsync(
  async (req: Request, res: Response) => {
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new Error("Admin identity is missing");
    }

    const result = await trackingService.updateSettings(
      req.body,
      adminId,
    );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Tracking settings updated",
      data: result,
    });
  },
);

export const trackingController = {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
};