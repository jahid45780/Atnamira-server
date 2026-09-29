
import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";
import AppError from "../../errorHerplrs/appError";

import { seoService } from "./seo.service";

// ======================================================
// AUDIT PAGE
// ======================================================

const auditPage = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const { url } =
      req.body as {
        url?: string;
      };

    if (
      !url ||
      typeof url !== "string" ||
      !url.trim()
    ) {
      throw new AppError(
        400,
        "URL is required",
      );
    }

    const result =
      await seoService.auditPage(
        url.trim(),
      );

    sentResponse(res, {
      success: true,
      statusCode:
        httpStatus.OK,
      message:
        "SEO audit completed successfully",
      data: result,
    });
  },
);

// ======================================================
// EXPORT
// ======================================================

export const seoController = {
  auditPage,
};

