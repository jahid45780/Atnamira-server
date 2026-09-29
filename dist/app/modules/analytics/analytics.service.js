"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const analytics_interface_1 = require("./analytics.interface");
const analytics_model_1 = require("./analytics.model");
const trackEvent = (payload, userId, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    const allowedEvents = [
        analytics_interface_1.AnalyticsEventType.PAGE_VIEW,
        analytics_interface_1.AnalyticsEventType.VIEW_CONTENT,
        analytics_interface_1.AnalyticsEventType.ADD_TO_CART,
        analytics_interface_1.AnalyticsEventType.INITIATE_CHECKOUT,
    ];
    if (!allowedEvents.includes(payload.event)) {
        throw new appError_1.default(400, "Unsupported public analytics event");
    }
    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(payload.visitorId) ||
        !/^[a-zA-Z0-9_-]{8,100}$/.test(payload.sessionId)) {
        throw new appError_1.default(400, "Invalid visitorId or sessionId");
    }
    if (!payload.path.startsWith("/") || payload.path.length > 500) {
        throw new appError_1.default(400, "Invalid page path");
    }
    if (payload.value !== undefined &&
        (!Number.isFinite(payload.value) || payload.value < 0)) {
        throw new appError_1.default(400, "Invalid event value");
    }
    try {
        return yield analytics_model_1.AnalyticsEvent.create(Object.assign(Object.assign({}, payload), { user: userId || undefined, userAgent: userAgent === null || userAgent === void 0 ? void 0 : userAgent.slice(0, 500) }));
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000 && payload.eventId) {
            return { duplicate: true };
        }
        throw error;
    }
});
const getOverview = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (days = 30) {
    var _a;
    var _b;
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);
    const [totals, daily, topPages, topProducts] = yield Promise.all([
        analytics_model_1.AnalyticsEvent.aggregate([
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
        analytics_model_1.AnalyticsEvent.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    event: analytics_interface_1.AnalyticsEventType.PAGE_VIEW,
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
        analytics_model_1.AnalyticsEvent.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    event: analytics_interface_1.AnalyticsEventType.PAGE_VIEW,
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
        analytics_model_1.AnalyticsEvent.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    event: analytics_interface_1.AnalyticsEventType.VIEW_CONTENT,
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
    const countFor = (event) => { var _a; var _b; return (_b = (_a = totals.find((item) => item.event === event)) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0; };
    return {
        periodDays: safeDays,
        startDate,
        endDate: new Date(),
        pageViews: countFor(analytics_interface_1.AnalyticsEventType.PAGE_VIEW),
        productViews: countFor(analytics_interface_1.AnalyticsEventType.VIEW_CONTENT),
        addToCarts: countFor(analytics_interface_1.AnalyticsEventType.ADD_TO_CART),
        checkouts: countFor(analytics_interface_1.AnalyticsEventType.INITIATE_CHECKOUT),
        uniqueVisitors: (_b = (_a = totals.find((item) => item.event === analytics_interface_1.AnalyticsEventType.PAGE_VIEW)) === null || _a === void 0 ? void 0 : _a.uniqueVisitors) !== null && _b !== void 0 ? _b : 0,
        daily,
        topPages,
        topProducts,
    };
});
const createVerifiedPurchaseEvent = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = payload.userId || payload.guestId;
    if (!ownerId) {
        throw new Error("Purchase event requires a booking owner");
    }
    const eventId = `purchase-${payload.bookingId}`;
    try {
        return yield analytics_model_1.AnalyticsEvent.create({
            event: analytics_interface_1.AnalyticsEventType.PURCHASE,
            eventId,
            visitorId: `buyer-${ownerId}`,
            sessionId: `purchase-${payload.bookingId}`,
            user: payload.userId || undefined,
            path: "/payment/success",
            value: payload.totalAmount,
            currency: (payload.currency || "USD").toUpperCase(),
            source: "stripe",
        });
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            // This booking's purchase event was already recorded.
            return null;
        }
        throw error;
    }
});
exports.analyticsService = {
    trackEvent,
    getOverview,
    createVerifiedPurchaseEvent
};
