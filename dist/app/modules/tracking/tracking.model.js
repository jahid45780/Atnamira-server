"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingSettings = void 0;
const mongoose_1 = require("mongoose");
const trackingSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.TrackingSettings = (0, mongoose_1.model)("TrackingSettings", trackingSchema);
