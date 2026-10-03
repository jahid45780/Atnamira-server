import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const guestCartMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // ===============================
  // LOGGED IN USER
  // ===============================

  if (req.user?.userId) {
    res.locals.cartOwner = {
      user: req.user.userId,
    };

    return next();
  }

  // ===============================
  // GUEST USER
  // ===============================

  let guestId = req.cookies?.guestCartId;

  if (!guestId) {
    guestId = crypto.randomUUID();

    res.cookie("guestCartId", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  res.locals.cartOwner = {
    guestId,
  };

  next();
};