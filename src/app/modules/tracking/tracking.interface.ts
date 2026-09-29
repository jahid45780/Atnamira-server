
export interface ITrackingSettings {
  metaPixelId?: string;
  gaMeasurementId?: string;
  googleAdsId?: string;

  metaPixelEnabled: boolean;
  gaEnabled: boolean;
  googleAdsEnabled: boolean;

  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUpdateTrackingSettings {
  metaPixelId?: string;
  gaMeasurementId?: string;
  googleAdsId?: string;

  metaPixelEnabled?: boolean;
  gaEnabled?: boolean;
  googleAdsEnabled?: boolean;
}