

import { Types } from "mongoose";

export interface IGoogleSearchConsole {
  _id?: Types.ObjectId;

  // Google account information
  googleEmail: string;

  // OAuth credentials
  accessToken: string;
  refreshToken: string;
  tokenExpiryDate?: Date;

  // Connection status
  isConnected: boolean;

  // Selected Search Console property
  selectedProperty?: string;

  // Available verified properties
  properties?: IGoogleSearchConsoleProperty[];

  connectedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGoogleSearchConsoleProperty {
  siteUrl: string;

  permissionLevel?: string;
}

export interface IGoogleSearchAnalyticsQuery {
  siteUrl: string;
  startDate: string;
  endDate: string;

  dimensions?: (
    | "query"
    | "page"
    | "country"
    | "device"
    | "date"
    | "searchAppearance"
  )[];

  rowLimit?: number;
  startRow?: number;
  type?: "web" | "image" | "video" | "news" | "googleNews" | "discover";
}

export interface IGoogleSearchAnalyticsRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface IGoogleSearchAnalyticsResponse {
  rows: IGoogleSearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface IGoogleSearchConsoleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
}
