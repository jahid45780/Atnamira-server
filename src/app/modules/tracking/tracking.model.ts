import { Schema, model } from "mongoose";
import { ITrackingSettings } from "./tracking.interface";

const trackingSchema = new Schema<ITrackingSettings>(
  {
    metaPixelId: {
      type: String,
      trim: true,
      default: "",
    },
    gaMeasurementId: {
      type: String,
      trim: true,
      default: "",
    },
    googleAdsId: {
      type: String,
      trim: true,
      default: "",
    },

    metaPixelEnabled: {
      type: Boolean,
      default: false,
    },
    gaEnabled: {
      type: Boolean,
      default: false,
    },
    googleAdsEnabled: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export const TrackingSettings = model<ITrackingSettings>(
  "TrackingSettings",
  trackingSchema,
);