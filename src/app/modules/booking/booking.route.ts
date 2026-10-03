import { Router } from "express";

import { bookingController } from "./booking.controller";
import { Role } from "../user/user.interface";
import {
  checkAuth,
  optionalAuth,
} from "../auth/authCheck";

const router = Router();

// ======================================================
// CHECKOUT
// Guest + Logged-in User
// ======================================================

router.post(
  "/checkout",
  optionalAuth(...Object.values(Role)),
  bookingController.checkout
);

// ======================================================
// MY BOOKINGS
// Guest + Logged-in User
// ======================================================

router.get(
  "/my-bookings",
  optionalAuth(...Object.values(Role)),
  bookingController.getMyBookings
);

// ======================================================
// BOOKING DETAILS
// Guest + Logged-in User
// ======================================================

router.get(
  "/:id",
  optionalAuth(...Object.values(Role)),
  bookingController.getBookingById
);

export const bookingRoutes = router;