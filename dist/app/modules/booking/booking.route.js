"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRoutes = void 0;
const express_1 = require("express");
const booking_controller_1 = require("./booking.controller");
const user_interface_1 = require("../user/user.interface");
const authCheck_1 = require("../auth/authCheck");
const router = (0, express_1.Router)();
// ======================================================
// Checkout
// Guest + Logged-in User
// ======================================================
router.post("/checkout", (0, authCheck_1.optionalAuth)(...Object.values(user_interface_1.Role)), booking_controller_1.bookingController.checkout);
// ======================================================
// Logged-in User Bookings
// ======================================================
router.get("/my-bookings", (0, authCheck_1.checkAuth)(...Object.values(user_interface_1.Role)), booking_controller_1.bookingController.getMyBookings);
// ======================================================
// Logged-in User Booking Details
// ======================================================
router.get("/:id", (0, authCheck_1.checkAuth)(...Object.values(user_interface_1.Role)), booking_controller_1.bookingController.getBookingById);
exports.bookingRoutes = router;
