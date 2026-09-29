"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsService = void 0;
const booking_model_1 = require("../booking/booking.model");
const booking_interface_1 = require("../booking/booking.interface");
const product_model_1 = require("../product/product.model");
const user_model_1 = require("../user/user.model");
const getAdminStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    var _b;
    const [totalUsers, totalProducts, totalBookings, pendingBookings, confirmedBookings, cancelledBookings, paidOrders, pendingPayments, failedPayments, revenueResult, recentBookings, recentUsers, monthlyStats,] = yield Promise.all([
        user_model_1.User.countDocuments(),
        product_model_1.Product.countDocuments(),
        booking_model_1.Booking.countDocuments(),
        booking_model_1.Booking.countDocuments({
            bookingStatus: booking_interface_1.BookingStatus.PENDING,
        }),
        booking_model_1.Booking.countDocuments({
            bookingStatus: booking_interface_1.BookingStatus.CONFIRMED,
        }),
        booking_model_1.Booking.countDocuments({
            bookingStatus: booking_interface_1.BookingStatus.CANCELLED,
        }),
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.PAID,
        }),
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.PENDING,
        }),
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.FAILED,
        }),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    paymentStatus: booking_interface_1.PaymentStatus.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" },
                },
            },
        ]),
        booking_model_1.Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("email items totalAmount paymentStatus bookingStatus createdAt")
            .lean(),
        user_model_1.User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("name email role createdAt")
            .lean(),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    paymentStatus: booking_interface_1.PaymentStatus.PAID,
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    orders: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" },
                },
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                },
            },
        ]),
    ]);
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthlyMap = new Map(monthlyStats.map((item) => [
        `${item._id.year}-${item._id.month}`,
        item,
    ]));
    const now = new Date();
    const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
        var _a, _b;
        const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const found = monthlyMap.get(key);
        return {
            month: monthNames[date.getMonth()],
            orders: (_a = found === null || found === void 0 ? void 0 : found.orders) !== null && _a !== void 0 ? _a : 0,
            revenue: (_b = found === null || found === void 0 ? void 0 : found.revenue) !== null && _b !== void 0 ? _b : 0,
        };
    });
    return {
        totalUsers,
        totalProducts,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        paidOrders,
        pendingPayments,
        failedPayments,
        totalRevenue: (_b = (_a = revenueResult[0]) === null || _a === void 0 ? void 0 : _a.total) !== null && _b !== void 0 ? _b : 0,
        recentBookings,
        recentUsers,
        monthlyStats: lastSixMonths,
    };
});
const getUserStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    var _b;
    const [totalOrders, pendingOrders, confirmedOrders, cancelledOrders, paidOrders, pendingPayments, spentResult, recentOrders,] = yield Promise.all([
        booking_model_1.Booking.countDocuments({ user: userId }),
        booking_model_1.Booking.countDocuments({
            user: userId,
            bookingStatus: booking_interface_1.BookingStatus.PENDING,
        }),
        booking_model_1.Booking.countDocuments({
            user: userId,
            bookingStatus: booking_interface_1.BookingStatus.CONFIRMED,
        }),
        booking_model_1.Booking.countDocuments({
            user: userId,
            bookingStatus: booking_interface_1.BookingStatus.CANCELLED,
        }),
        booking_model_1.Booking.countDocuments({
            user: userId,
            paymentStatus: booking_interface_1.PaymentStatus.PAID,
        }),
        booking_model_1.Booking.countDocuments({
            user: userId,
            paymentStatus: booking_interface_1.PaymentStatus.PENDING,
        }),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    user: new (yield Promise.resolve().then(() => __importStar(require("mongoose")))).Types.ObjectId(userId),
                    paymentStatus: booking_interface_1.PaymentStatus.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" },
                },
            },
        ]),
        booking_model_1.Booking.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("items totalAmount paymentStatus bookingStatus createdAt")
            .lean(),
    ]);
    return {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        cancelledOrders,
        paidOrders,
        pendingPayments,
        totalSpent: (_b = (_a = spentResult[0]) === null || _a === void 0 ? void 0 : _a.total) !== null && _b !== void 0 ? _b : 0,
        recentOrders,
    };
});
exports.statsService = {
    getAdminStats,
    getUserStats,
};
