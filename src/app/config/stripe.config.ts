import Stripe from "stripe";
import { envVers } from "./env";

if (!envVers.STRIPE.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

console.log(
  "STRIPE KEY TYPE:",
  envVers.STRIPE.STRIPE_SECRET_KEY.slice(0, 8)
);

export const stripe = new Stripe(
  envVers.STRIPE.STRIPE_SECRET_KEY
);