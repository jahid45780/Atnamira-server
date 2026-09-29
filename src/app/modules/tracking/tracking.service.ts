
import AppError from "../../errorHerplrs/appError";
import {
  IUpdateTrackingSettings,
} from "./tracking.interface";
import { TrackingSettings } from "./tracking.model";

const getPublicSettings = async () => {
  let settings = await TrackingSettings.findOne().lean();

  if (!settings) {
    const created = await TrackingSettings.create({});
    settings = created.toObject();
  }

  // Only safe, browser-usable IDs are returned.
  return {
    metaPixelId: settings.metaPixelId || "",
    gaMeasurementId: settings.gaMeasurementId || "",
    googleAdsId: settings.googleAdsId || "",
    metaPixelEnabled: settings.metaPixelEnabled,
    gaEnabled: settings.gaEnabled,
    googleAdsEnabled: settings.googleAdsEnabled,
  };
};

const getAdminSettings = async () => {
  let settings = await TrackingSettings.findOne();

  if (!settings) {
    settings = await TrackingSettings.create({});
  }

  return settings;
};

const updateSettings = async (
  payload: IUpdateTrackingSettings,
  adminId: string,
) => {
  const allowedFields = [
    "metaPixelId",
    "gaMeasurementId",
    "googleAdsId",
    "metaPixelEnabled",
    "gaEnabled",
    "googleAdsEnabled",
  ] as const;

  const update: Record<string, string | boolean> = {};

  for (const field of allowedFields) {
    const value = payload[field];

    if (value !== undefined) {
      if (typeof value === "string") {
        update[field] = value.trim();
      } else {
        update[field] = value;
      }
    }
  }

  if (
    update.metaPixelEnabled === true &&
    !update.metaPixelId
  ) {
    const existing = await TrackingSettings.findOne();
    if (!existing?.metaPixelId) {
      throw new AppError(400, "Meta Pixel ID is required");
    }
  }

  if (
    update.gaEnabled === true &&
    !update.gaMeasurementId
  ) {
    const existing = await TrackingSettings.findOne();
    if (!existing?.gaMeasurementId) {
      throw new AppError(400, "GA Measurement ID is required");
    }
  }

  if (
    update.googleAdsEnabled === true &&
    !update.googleAdsId
  ) {
    const existing = await TrackingSettings.findOne();
    if (!existing?.googleAdsId) {
      throw new AppError(400, "Google Ads ID is required");
    }
  }

  const settings = await TrackingSettings.findOneAndUpdate(
    {},
    {
      $set: {
        ...update,
        updatedBy: adminId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return settings;
};

export const trackingService = {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
};