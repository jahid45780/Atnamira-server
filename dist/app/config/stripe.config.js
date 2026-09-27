"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("./env");
if (!env_1.envVers.STRIPE.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
}
console.log("STRIPE KEY TYPE:", env_1.envVers.STRIPE.STRIPE_SECRET_KEY.slice(0, 8));
exports.stripe = new stripe_1.default(env_1.envVers.STRIPE.STRIPE_SECRET_KEY);
