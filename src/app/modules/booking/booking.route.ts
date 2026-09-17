import { Router } from "express";

import { bookingController } from "./booking.controller";

import { checkAuth } from "../auth/authCheck";
import { Role } from "../user/user.interface";

const router = Router();


// ==========================================
// Create Booking
// ==========================================

router.post(
  "/create",
  checkAuth(...Object.values(Role)),
  bookingController.createBooking,
);


// ==========================================
// Get My Bookings
// ==========================================

router.get(
  "/my-bookings",
  checkAuth(...Object.values(Role)),
  bookingController.getMyBookings,
);


// ==========================================
// Get Single Booking
// ==========================================

router.get(
  "/:id",
  checkAuth(...Object.values(Role)),
  bookingController.getBookingById,
);


export const bookingRoutes = router;