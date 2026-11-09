
import { model, Schema } from "mongoose";
import { IGoogleSearchConsole, IGoogleSearchConsoleProperty } from "./google.search.interface";


const googleSearchConsolePropertySchema =
  new Schema<IGoogleSearchConsoleProperty>(
    {
      siteUrl: {
        type: String,
        required: true,
        trim: true,
      },
      permissionLevel: {
        type: String,
        default: "siteUnverifiedUser",
      },
    },
    {
      _id: false,
      versionKey: false,
    }
  );

const googleSearchConsoleSchema =
  new Schema<IGoogleSearchConsole>(
    {
      googleEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
      },

      accessToken: {
        type: String,
        required: true,
        select: false,
      },

      refreshToken: {
        type: String,
        required: true,
        select: false,
      },

      tokenExpiryDate: {
        type: Date,
      },

      isConnected: {
        type: Boolean,
        default: true,
      },

      selectedProperty: {
        type: String,
        trim: true,
      },

      properties: {
        type: [googleSearchConsolePropertySchema],
        default: [],
      },

      connectedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

export const GoogleSearchConsole = model<IGoogleSearchConsole>(
  "GoogleSearchConsole",
  googleSearchConsoleSchema
);
