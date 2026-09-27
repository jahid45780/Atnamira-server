"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.userSchema = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
const authProviderSchema = new mongoose_1.Schema({
    provider: { type: String, required: true },
    providerID: { type: String, required: true }
}, {
    versionKey: false,
    id: false
});
exports.userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    role: {
        type: String,
        enum: Object.values(user_interface_1.Role),
        default: user_interface_1.Role.USER
    },
    picture: { type: String },
    address: { type: String },
    IsActive: {
        type: String,
        enum: Object.values(user_interface_1.isActive),
        default: user_interface_1.isActive.ACTIVE
    },
    IsVerified: { type: Boolean, default: false },
    IsDeleted: { type: Boolean, default: false },
    auths: [authProviderSchema]
}, {
    timestamps: true,
    versionKey: false
});
exports.User = (0, mongoose_1.model)("User", exports.userSchema);
