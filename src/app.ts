import express, { Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import expressSession from "express-session";

import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import NotFound from "./app/middleware/NotFound";
import { envVers } from "./app/config/env";

import "./app/config/passport";

import { paymentController } from "./app/modules/payment/payment.controller";

const app = express();

/* ================================
   Session
================================ */

app.use(
  expressSession({
    secret: envVers.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

/* ================================
   CORS
================================ */

app.use(
  cors({
    origin: envVers.FRONTEND_URL,
    credentials: true,
  }),
);

/* ================================
   Stripe Webhook
   MUST BE BEFORE express.json()
================================ */

app.use(
  "/api/v1/payment/webhook",
  express.raw({
    type: "application/json",
  }),
  paymentController.handleStripeWebhook,
);

/* ================================
   Body Parsers
================================ */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

/* ================================
   Cookie
================================ */

app.use(cookieParser());

/* ================================
   Passport
================================ */

app.use(passport.initialize());
app.use(passport.session());

/* ================================
   API Routes
================================ */

app.use("/api/v1", router);

/* ================================
   Root Route
================================ */

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Atnamira server",
  });
});

/* ================================
   Error Handler
================================ */

app.use(globalErrorHandler);

app.use(NotFound);

export default app;