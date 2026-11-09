

import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import AppError from "../../errorHerplrs/appError";
import { googleSearchConsoleService } from "./google.search.service";
import { GoogleSearchConsole } from "./google.search.model";



// ============================================
// CONNECT GOOGLE SEARCH CONSOLE
// ============================================

const connect = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user?.userId;

  if (!adminId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Admin authentication required"
    );
  }

  const authorizationUrl =
    googleSearchConsoleService.getOAuthUrl(adminId);

  sentResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Google authorization URL generated successfully",
    data: {
      authorizationUrl,
    },
  });
});

// ============================================
// GOOGLE OAUTH CALLBACK
// ============================================

const callback = catchAsync(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Google authorization failed: ${String(error)}`
    );
  }

  if (
    typeof code !== "string" ||
    typeof state !== "string"
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid Google OAuth callback parameters"
    );
  }

  const result =
    await googleSearchConsoleService.handleOAuthCallback(
      code,
      state
    );

  sentResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Google Search Console connected successfully",
    data: result,
  });
});

// ============================================
// CONNECTION STATUS
// ============================================

const getStatus = catchAsync(async (req: Request, res: Response) => {
  const result =
    await googleSearchConsoleService.getConnectionStatus();

  sentResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Google Search Console status retrieved successfully",
    data: result,
  });
});

// ============================================
// GET PROPERTIES
// ============================================

const getProperties = catchAsync(
  async (req: Request, res: Response) => {
    const connection = await GoogleSearchConsole.findOne({
      isConnected: true,
    });

    if (!connection) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Google Search Console is not connected"
      );
    }

    const result =
      await googleSearchConsoleService.getProperties(
        connection.id
      );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Search Console properties retrieved successfully",
      data: result,
    });
  }
);

// ============================================
// SELECT PROPERTY
// ============================================

const selectProperty = catchAsync(
  async (req: Request, res: Response) => {
    const { siteUrl } = req.body;

    if (!siteUrl || typeof siteUrl !== "string") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Valid siteUrl is required"
      );
    }

    const connection = await GoogleSearchConsole.findOne({
      isConnected: true,
    });

    if (!connection) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Google Search Console is not connected"
      );
    }

    const result =
      await googleSearchConsoleService.selectProperty(
        connection.id,
        siteUrl
      );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Search Console property selected successfully",
      data: result,
    });
  }
);

// ============================================
// DISCONNECT
// ============================================

const disconnect = catchAsync(
  async (req: Request, res: Response) => {
    const connection = await GoogleSearchConsole.findOne({
      isConnected: true,
    });

    if (!connection) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Google Search Console is not connected"
      );
    }

    await googleSearchConsoleService.disconnect(
      connection.id
    );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Google Search Console disconnected successfully",
      data: null,
    });
  }
);

// ============================================
// EXPORT CONTROLLER
// ============================================

export const googleSearchConsoleController = {
  connect,
  callback,
  getStatus,
  getProperties,
  selectProperty,
  disconnect,
};
