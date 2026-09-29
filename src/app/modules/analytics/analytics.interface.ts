import { Types } from "mongoose";

export enum AnalyticsEventType {
  PAGE_VIEW = "PAGE_VIEW",
  VIEW_CONTENT = "VIEW_CONTENT",
  ADD_TO_CART = "ADD_TO_CART",
  INITIATE_CHECKOUT = "INITIATE_CHECKOUT",
  PURCHASE = "PURCHASE",
}

export interface IAnalyticsEvent {
  event: AnalyticsEventType;
  eventId?: string;
  visitorId: string;
  sessionId: string;
  user?: Types.ObjectId;
  path: string;
  productId?: string;
  value?: number;
  currency?: string;
  source?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface ITrackEventPayload {
  event: AnalyticsEventType;
  eventId?: string;
  visitorId: string;
  sessionId: string;
  path: string;
  productId?: string;
  value?: number;
  currency?: string;
  source?: string;
}