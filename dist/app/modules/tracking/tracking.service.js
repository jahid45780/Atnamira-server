"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingService = void 0;
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
const tracking_model_1 = require("./tracking.model");
const getPublicSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield tracking_model_1.TrackingSettings.findOne().lean();
    if (!settings) {
        const created = yield tracking_model_1.TrackingSettings.create({});
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
});
const getAdminSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    let settings = yield tracking_model_1.TrackingSettings.findOne();
    if (!settings) {
        settings = yield tracking_model_1.TrackingSettings.create({});
    }
    return settings;
});
const updateSettings = (payload, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const allowedFields = [
        "metaPixelId",
        "gaMeasurementId",
        "googleAdsId",
        "metaPixelEnabled",
        "gaEnabled",
        "googleAdsEnabled",
    ];
    const update = {};
    for (const field of allowedFields) {
        const value = payload[field];
        if (value !== undefined) {
            if (typeof value === "string") {
                update[field] = value.trim();
            }
            else {
                update[field] = value;
            }
        }
    }
    if (update.metaPixelEnabled === true &&
        !update.metaPixelId) {
        const existing = yield tracking_model_1.TrackingSettings.findOne();
        if (!(existing === null || existing === void 0 ? void 0 : existing.metaPixelId)) {
            throw new appError_1.default(400, "Meta Pixel ID is required");
        }
    }
    if (update.gaEnabled === true &&
        !update.gaMeasurementId) {
        const existing = yield tracking_model_1.TrackingSettings.findOne();
        if (!(existing === null || existing === void 0 ? void 0 : existing.gaMeasurementId)) {
            throw new appError_1.default(400, "GA Measurement ID is required");
        }
    }
    if (update.googleAdsEnabled === true &&
        !update.googleAdsId) {
        const existing = yield tracking_model_1.TrackingSettings.findOne();
        if (!(existing === null || existing === void 0 ? void 0 : existing.googleAdsId)) {
            throw new appError_1.default(400, "Google Ads ID is required");
        }
    }
    const settings = yield tracking_model_1.TrackingSettings.findOneAndUpdate({}, {
        $set: Object.assign(Object.assign({}, update), { updatedBy: adminId }),
    }, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
    });
    return settings;
});
exports.trackingService = {
    getPublicSettings,
    getAdminSettings,
    updateSettings,
};
