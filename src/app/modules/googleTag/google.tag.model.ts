import { model, Schema } from "mongoose";
import { IGoogleTagManager } from "./google.tag.interface";


const googleTagManagerSchema = new Schema<IGoogleTagManager>(
  {
    googleEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    accessToken: {
      type: String,
      required: true,
      select: false,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    tokenExpiryDate: {
      type: Date,
    },

    isConnected: {
      type: Boolean,
      default: true,
    },

    connectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

googleTagManagerSchema.index({ connectedBy: 1 }, { unique: true });
googleTagManagerSchema.index({ googleEmail: 1 });

export const GoogleTagManager = model<IGoogleTagManager>(
  "GoogleTagManager",
  googleTagManagerSchema,
);