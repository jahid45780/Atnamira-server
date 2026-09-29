import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";
import AppError from "../../errorHerplrs/appError";
import { analyticsService } from "./analytics.service";

const trackEvent = catchAsync(async (req: Request, res: Response) => {
  const {
    event,
    eventId,
    visitorId,
    sessionId,
    path,
    productId,
    value,
    currency,
    source,
  } = req.body;

  if (
    !event ||
    !visitorId ||
    !sessionId ||
    !path
  ) {
    throw new AppError(
      400,
      "event, visitorId, sessionId and path are required",
    );
  }

  const result = await analyticsService.trackEvent(
    {
      event,
      eventId,
      visitorId,
      sessionId,
      path,
      productId,
      value,
      currency,
      source,
    },
    req.user?.userId,
    req.headers["user-agent"],
  );

  sentResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Analytics event received",
    data: result,
  });
});

const getOverview = catchAsync(async (req: Request, res: Response) => {
  const days = Number(req.query.days ?? 30);

  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new AppError(400, "days must be an integer from 1 to 90");
  }

  const result = await analyticsService.getOverview(days);

  sentResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Analytics overview retrieved",
    data: result,
  });
});

export const analyticsController = {
  trackEvent,
  getOverview,
};