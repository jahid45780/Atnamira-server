import { Schema, model } from "mongoose";
import {
  AnalyticsEventType,
  IAnalyticsEvent,
} from "./analytics.interface";

const analyticsSchema = new Schema<IAnalyticsEvent>(
  {
    event: {
      type: String,
      enum: Object.values(AnalyticsEventType),
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
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Prevent duplicate submissions when a client retries an event.
analyticsSchema.index(
  { eventId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      eventId: { $type: "string" },
    },
  },
);

analyticsSchema.index({ createdAt: -1, event: 1 });

export const AnalyticsEvent = model<IAnalyticsEvent>(
  "AnalyticsEvent",
  analyticsSchema,
);