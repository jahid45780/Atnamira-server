import express, {
  Request,
  Response,
} from "express";

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


// ======================================================
// SESSION
// ======================================================

app.use(
  expressSession({
    secret:
      envVers.EXPRESS_SESSION_SECRET,

    resave: false,

    saveUninitialized: false,
  }),
);


// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: envVers.FRONTEND_URL,

    credentials: true,
  }),
);


// ======================================================
// STRIPE WEBHOOK
//
// IMPORTANT:
// This MUST come before express.json()
// ======================================================

app.use(
  "/api/v1/payment/webhook",

  express.raw({
    type: "application/json",
  }),

  paymentController.handleStripeWebhook,
);


// ======================================================
// BODY PARSERS
// ======================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);


// ======================================================
// COOKIE
// ======================================================

app.use(cookieParser());


// ======================================================
// PASSPORT
// ======================================================

app.use(passport.initialize());

app.use(passport.session());


// ======================================================
// API ROUTES
// ======================================================

app.use(
  "/api/v1",
  router,
);


// ======================================================
// ROOT ROUTE
// ======================================================

app.get(
  "/",
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,

      message:
        "Welcome to the Atnamira server",
    });
  },
);


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(globalErrorHandler);

app.use(NotFound);


export default app;