import { Router } from "express";

import { bookingController } from "./booking.controller";



import { Role } from "../user/user.interface";
import { checkAuth, optionalAuth } from "../auth/authCheck";

const router = Router();


// ======================================================
// Checkout
// Guest + Logged-in User
// ======================================================

router.post(
  "/checkout",

  optionalAuth(...Object.values(Role)),

  bookingController.checkout
);


// ======================================================
// Logged-in User Bookings
// ======================================================

router.get(
  "/my-bookings",

  checkAuth(...Object.values(Role)),

  bookingController.getMyBookings
);


// ======================================================
// Logged-in User Booking Details
// ======================================================

router.get(
  "/:id",

  checkAuth(...Object.values(Role)),

  bookingController.getBookingById
);


export const bookingRoutes = router;