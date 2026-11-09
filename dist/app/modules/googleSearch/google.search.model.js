"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSearchConsole = void 0;
const mongoose_1 = require("mongoose");
const googleSearchConsolePropertySchema = new mongoose_1.Schema({
    siteUrl: {
        type: String,
        required: true,
        trim: true,
    },
    permissionLevel: {
        type: String,
        default: "siteUnverifiedUser",
    },
}, {
    _id: false,
    versionKey: false,
});
const googleSearchConsoleSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.GoogleSearchConsole = (0, mongoose_1.model)("GoogleSearchConsole", googleSearchConsoleSchema);
