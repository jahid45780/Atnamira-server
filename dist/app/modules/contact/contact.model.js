"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const mongoose_1 = require("mongoose");
const contactSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
exports.Contact = (0, mongoose_1.model)("Contact", contactSchema);
