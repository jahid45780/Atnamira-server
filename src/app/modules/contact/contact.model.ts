import { Schema, model } from "mongoose";
import { IContact } from "./contact.interface";

const contactSchema = new Schema<IContact>(
  {
    locationName: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    mapUrl: {
      type: String,
      required: true,
      trim: true,
    },

    businessHours: {
      mondayFriday: {
        type: String,
        required: true,
        trim: true,
      },

      saturday: {
        type: String,
        required: true,
        trim: true,
      },

      sunday: {
        type: String,
        required: true,
        trim: true,
      },

      timezone: {
        type: String,
        required: true,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

export const Contact = model<IContact>("Contact", contactSchema);