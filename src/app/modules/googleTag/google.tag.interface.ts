import { Types } from "mongoose";

export interface IGoogleTagManager {
  googleEmail: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiryDate?: Date;
  isConnected: boolean;
  connectedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGoogleTagManagerSafe {
  _id: Types.ObjectId;
  googleEmail: string;
  isConnected: boolean;
  connectedBy: Types.ObjectId;
  tokenExpiryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GTMResource = "tags" | "triggers" | "variables";

export interface IGTMPayload {
  name: string;
  type?: string;
  parameter?: unknown[];
  firingTriggerId?: string[];
  blockingTriggerId?: string[];
  notes?: string;
  [key: string]: unknown;
}

export interface IGTMState {
  userId: string;
  purpose: "google-tag-manager";
}