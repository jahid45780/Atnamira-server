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

const app = express();

app.use(
  expressSession({
    secret: envVers.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  cors({
    origin: envVers.FRONTEND_URL,
    credentials: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "welcome to the server",
  });
});

app.use(globalErrorHandler);
app.use(NotFound);

export default app;