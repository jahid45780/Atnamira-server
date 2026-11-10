import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import AppError from "../../errorHerplrs/appError";
import { catchAsync } from "../../utils/catchAsync";
import { googleSearchConsoleService } from "./google.search.service";
import { sentResponse } from "../../utils/sendResponse";
import { GoogleSearchConsole } from "./google.search.model";


// ---------------------------------------------
// Analytics Query Validation
// ---------------------------------------------

const getAnalyticsOptions = (req: Request) => {
  const startDate =
    typeof req.query.startDate === "string"
      ? req.query.startDate
      : "";

  const endDate =
    typeof req.query.endDate === "string"
      ? req.query.endDate
      : "";

  const rowLimitValue =
    typeof req.query.rowLimit === "string"
      ? Number(req.query.rowLimit)
      : 1000;

  if (!startDate || !endDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "startDate and endDate are required"
    );
  }

  if (
    !Number.isInteger(rowLimitValue) ||
    rowLimitValue < 1 ||
    rowLimitValue > 25000
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "rowLimit must be an integer between 1 and 25000"
    );
  }

  return {
    startDate,
    endDate,
    rowLimit: rowLimitValue,
  };
};

// ---------------------------------------------
// Get Active Connection
// ---------------------------------------------

const getActiveConnection = async () => {
  const connection = await GoogleSearchConsole.findOne({
    isConnected: true,
  });

  if (!connection) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Google Search Console is not connected"
    );
  }

  return connection;
};

// ---------------------------------------------
// Connect Google Search Console
// ---------------------------------------------

const connect = catchAsync(
  async (req: Request, res: Response) => {
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Admin authentication is required"
      );
    }

    const authorizationUrl =
      await googleSearchConsoleService.getOAuthUrl(
        adminId.toString()
      );

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Google Search Console authorization URL generated",
      data: {
        authorizationUrl,
      },
    });
  }
);

// ---------------------------------------------
// Google OAuth Callback
// ---------------------------------------------

const callback = catchAsync(
  async (req: Request, res: Response) => {
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
        "Google authorization code or state is missing"
      );
    }

    const connection =
      await googleSearchConsoleService.handleOAuthCallback(
        code,
        state
      );

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Google Search Console connected successfully",
      data: connection,
    });
  }
);

// ---------------------------------------------
// Get Connection Status
// ---------------------------------------------

const getStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await googleSearchConsoleService.getConnectionStatus();

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Google Search Console connection status retrieved",
      data: result,
    });
  }
);

// ---------------------------------------------
// Get Properties
// ---------------------------------------------

const getProperties = catchAsync(
  async (req: Request, res: Response) => {
    const connection = await getActiveConnection();

    const properties =
      await googleSearchConsoleService.getProperties(
        connection.id
      );

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Google Search Console properties retrieved",
      data: properties,
    });
  }
);

// ---------------------------------------------
// Select Property
// ---------------------------------------------

const selectProperty = catchAsync(
  async (req: Request, res: Response) => {
    const { siteUrl } = req.body;

    if (
      typeof siteUrl !== "string" ||
      !siteUrl.trim()
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "A valid siteUrl is required"
      );
    }

    const connection = await getActiveConnection();

    const result =
      await googleSearchConsoleService.selectProperty(
        connection.id,
        siteUrl.trim()
      );

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Google Search Console property selected successfully",
      data: result,
    });
  }
);

// ---------------------------------------------
// Disconnect Google Search Console
// ---------------------------------------------

const disconnect = catchAsync(
  async (req: Request, res: Response) => {
    const connection = await getActiveConnection();

    const result =
      await googleSearchConsoleService.disconnect(
        connection.id
      );

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Google Search Console disconnected successfully",
      data: result,
    });
  }
);

// ---------------------------------------------
// Overall Search Analytics
// ---------------------------------------------

const getAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const options = getAnalyticsOptions(req);

    const result =
      await googleSearchConsoleService.getAnalytics(options);

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Search analytics retrieved successfully",
      data: result,
    });
  }
);

// ---------------------------------------------
// Top Search Queries
// ---------------------------------------------

const getTopQueries = catchAsync(
  async (req: Request, res: Response) => {
    const options = getAnalyticsOptions(req);

    const result =
      await googleSearchConsoleService.getTopQueries(options);

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Top search queries retrieved successfully",
      data: result,
    });
  }
);

// ---------------------------------------------
// Top Pages
// ---------------------------------------------

const getTopPages = catchAsync(
  async (req: Request, res: Response) => {
    const options = getAnalyticsOptions(req);

    const result =
      await googleSearchConsoleService.getTopPages(options);

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Top pages analytics retrieved successfully",
      data: result,
    });
  }
);

// ---------------------------------------------
// Country Analytics
// ---------------------------------------------

const getCountryAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const options = getAnalyticsOptions(req);

    const result =
      await googleSearchConsoleService.getCountryAnalytics(
        options
      );

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Country analytics retrieved successfully",
      data: result,
    });
  }
);

// ---------------------------------------------
// Device Analytics
// ---------------------------------------------

const getDeviceAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const options = getAnalyticsOptions(req);

    const result =
      await googleSearchConsoleService.getDeviceAnalytics(
        options
      );

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Device analytics retrieved successfully",
      data: result,
    });
  }
);

// ---------------------------------------------
// Date-wise Analytics
// ---------------------------------------------

const getDateAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const options = getAnalyticsOptions(req);

    const result =
      await googleSearchConsoleService.getDateAnalytics(
        options
      );

    sentResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Date-wise search analytics retrieved successfully",
      data: result,
    });
  }
);

// ---------------------------------------------
// Export Controller
// ---------------------------------------------

export const googleSearchConsoleController = {
  connect,
  callback,
  getStatus,
  getProperties,
  selectProperty,
  disconnect,
  getAnalytics,
  getTopQueries,
  getTopPages,
  getCountryAnalytics,
  getDeviceAnalytics,
  getDateAnalytics,
};