"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const booking_service_1 = require("./booking.service");
const sendResponse_1 = require("../../utils/sendResponse");
const catchAsync_1 = require("../../utils/catchAsync");
// ======================================================
// Checkout
// ======================================================
const checkout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const guestId = userId
        ? undefined
        : (_b = req.cookies) === null || _b === void 0 ? void 0 : _b.guestCartId;
    const { email, name, phone, address, } = req.body;
    const result = yield booking_service_1.bookingService.createCheckoutBooking({
        userId,
        guestId,
        email,
        name,
        phone,
        address,
    });
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Checkout session created successfully",
        data: result,
    });
}));
// ======================================================
// Get My Bookings
// ======================================================
const getMyBookings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user)
        return;
    const result = yield booking_service_1.bookingService.getMyBookings(req.user.userId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Bookings retrieved successfully",
        data: result,
    });
}));
// ======================================================
// Get Booking By ID
// ======================================================
const getBookingById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user)
        return;
    const bookingId = String(req.params.id);
    const result = yield booking_service_1.bookingService.getBookingById(req.user.userId, bookingId);
    (0, sendResponse_1.sentResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Booking retrieved successfully",
        data: result,
    });
}));
exports.bookingController = {
    checkout,
    getMyBookings,
    getBookingById,
};
