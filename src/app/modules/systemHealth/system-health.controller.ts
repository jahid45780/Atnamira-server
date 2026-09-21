import { Request, Response } from "express";


import { systemHealthService } from "./system-health.service";
import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";

const getSystemHealth = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await systemHealthService.getSystemHealth();

    sentResponse(res, {
      statusCode: 200,
      success: true,
      message: "System health fetched successfully",
      data: result,
    });
  }
);

export const systemHealthController = {
  getSystemHealth,
};