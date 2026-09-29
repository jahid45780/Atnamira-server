"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsEvent = void 0;
const mongoose_1 = require("mongoose");
const analytics_interface_1 = require("./analytics.interface");
const analyticsSchema = new mongoose_1.Schema({
    event: {
        type: String,
        enum: Object.values(analytics_interface_1.AnalyticsEventType),
        required: true,
        index: true,
    },
    eventId: {
        type: String,
        trim: true,
    },
    visitorId: {
        type: String,
        required: true,
        index: true,
    },
    sessionId: {
        type: String,
        required: true,
        index: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true,
    },
    path: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    productId: {
        type: String,
        trim: true,
    },
    value: {
        type: Number,
        min: 0,
    },
    currency: {
        type: String,
        uppercase: true,
        maxlength: 3,
    },
    source: {
        type: String,
        trim: true,
        maxlength: 200,
    },
    userAgent: {
        type: String,
        maxlength: 500,
    },
}, { timestamps: { createdAt: true, updatedAt: false } });
// Prevent duplicate submissions when a client retries an event.
analyticsSchema.index({ eventId: 1 }, {
    unique: true,
    partialFilterExpression: {
        eventId: { $type: "string" },
    },
});
analyticsSchema.index({ createdAt: -1, event: 1 });
exports.AnalyticsEvent = (0, mongoose_1.model)("AnalyticsEvent", analyticsSchema);
