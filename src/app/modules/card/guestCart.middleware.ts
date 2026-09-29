
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import AppError from "../../errorHerplrs/appError";


export interface CartOwner {
  user?: string;
  guestId?: string;
}

export const guestCartMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Authenticated requests should be handled by auth middleware.
    if (req.user?.userId) {
      res.locals.cartOwner = {
        user: req.user.userId,
      } satisfies CartOwner;

      return next();
    }

    let guestId = req.cookies?.guestCartId as
      | string
      | undefined;

    if (!guestId) {
      guestId = crypto.randomUUID();

      res.cookie("guestCartId", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });
    }

    res.locals.cartOwner = {
      guestId,
    } satisfies CartOwner;

    next();
  } catch {
    next(new AppError(500, "Unable to initialize cart"));
  }
};