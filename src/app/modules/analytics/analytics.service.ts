import AppError from "../../errorHerplrs/appError";
import {
  AnalyticsEventType,
  ITrackEventPayload,
} from "./analytics.interface";
import { AnalyticsEvent } from "./analytics.model";

const trackEvent = async (
  payload: ITrackEventPayload,
  userId?: string,
  userAgent?: string,
) => {
  const allowedEvents = [
    AnalyticsEventType.PAGE_VIEW,
    AnalyticsEventType.VIEW_CONTENT,
    AnalyticsEventType.ADD_TO_CART,
    AnalyticsEventType.INITIATE_CHECKOUT,
  ];

  if (!allowedEvents.includes(payload.event)) {
    throw new AppError(400, "Unsupported public analytics event");
  }

  if (
    !/^[a-zA-Z0-9_-]{8,100}$/.test(payload.visitorId) ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(payload.sessionId)
  ) {
    throw new AppError(400, "Invalid visitorId or sessionId");
  }

  if (!payload.path.startsWith("/") || payload.path.length > 500) {
    throw new AppError(400, "Invalid page path");
  }

  if (
    payload.value !== undefined &&
    (!Number.isFinite(payload.value) || payload.value < 0)
  ) {
    throw new AppError(400, "Invalid event value");
  }

  try {
    return await AnalyticsEvent.create({
      ...payload,
      user: userId || undefined,
      userAgent: userAgent?.slice(0, 500),
    });
  } catch (error: any) {
    if (error?.code === 11000 && payload.eventId) {
      return { duplicate: true };
    }
    throw error;
  }
};

const getOverview = async (days = 30) => {
  const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - safeDays);

  const [totals, daily, topPages, topProducts] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$event",
          count: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" },
        },
      },
      {
        $project: {
          event: "$_id",
          count: 1,
          uniqueVisitors: { $size: "$visitors" },
        },
      },
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          event: AnalyticsEventType.PAGE_VIEW,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          pageViews: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          pageViews: 1,
          visitors: { $size: "$visitors" },
        },
      },
      { $sort: { "date.year": 1, "date.month": 1, "date.day": 1 } },
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          event: AnalyticsEventType.PAGE_VIEW,
        },
      },
      {
        $group: {
          _id: "$path",
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          event: AnalyticsEventType.VIEW_CONTENT,
          productId: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$productId",
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const countFor = (event: AnalyticsEventType) =>
    totals.find((item) => item.event === event)?.count ?? 0;

  return {
    periodDays: safeDays,
    startDate,
    endDate: new Date(),
    pageViews: countFor(AnalyticsEventType.PAGE_VIEW),
    productViews: countFor(AnalyticsEventType.VIEW_CONTENT),
    addToCarts: countFor(AnalyticsEventType.ADD_TO_CART),
    checkouts: countFor(AnalyticsEventType.INITIATE_CHECKOUT),
    uniqueVisitors:
      totals.find((item) => item.event === AnalyticsEventType.PAGE_VIEW)
        ?.uniqueVisitors ?? 0,
    daily,
    topPages,
    topProducts,
  };
};


const createVerifiedPurchaseEvent = async (payload: {
  bookingId: string;
  userId?: string;
  guestId?: string;
  totalAmount: number;
  currency?: string;
}) => {
  const ownerId = payload.userId || payload.guestId;

  if (!ownerId) {
    throw new Error("Purchase event requires a booking owner");
  }

  const eventId = `purchase-${payload.bookingId}`;

  try {
    return await AnalyticsEvent.create({
      event: AnalyticsEventType.PURCHASE,
      eventId,
      visitorId: `buyer-${ownerId}`,
      sessionId: `purchase-${payload.bookingId}`,
      user: payload.userId || undefined,
      path: "/payment/success",
      value: payload.totalAmount,
      currency: (payload.currency || "USD").toUpperCase(),
      source: "stripe",
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      // This booking's purchase event was already recorded.
      return null;
    }
    throw error;
  }
};

export const analyticsService = {
  trackEvent,
  getOverview,
  createVerifiedPurchaseEvent
};