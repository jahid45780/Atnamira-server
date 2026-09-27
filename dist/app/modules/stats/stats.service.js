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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const booking_model_1 = require("../booking/booking.model");
const booking_interface_1 = require("../booking/booking.interface");
const product_model_1 = require("../product/product.model");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
/* =========================================================
   DATE
========================================================= */
const now = new Date();
const sevenDaysAgo = new Date(now);
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const thirtyDaysAgo = new Date(now);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
/* =========================================================
   USER DASHBOARD
   Logged-in user only
========================================================= */
const getUserStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    /* =========================
       GET USER BOOKINGS
    ========================= */
    var _a;
    const bookings = yield booking_model_1.Booking.find({
        user: userId,
    })
        .sort({
        createdAt: -1,
    })
        .lean();
    /* =========================
       BOOKING COUNTS
    ========================= */
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter((booking) => booking.bookingStatus ===
        booking_interface_1.BookingStatus.PENDING).length;
    const confirmedBookings = bookings.filter((booking) => booking.bookingStatus ===
        booking_interface_1.BookingStatus.CONFIRMED).length;
    const cancelledBookings = bookings.filter((booking) => booking.bookingStatus ===
        booking_interface_1.BookingStatus.CANCELLED).length;
    /* =========================
       TOTAL SPENT
  
       Only PAID bookings
    ========================= */
    const totalSpent = bookings
        .filter((booking) => booking.paymentStatus ===
        booking_interface_1.PaymentStatus.PAID)
        .reduce((total, booking) => total + booking.totalAmount, 0);
    /* =========================
       PAYMENT COUNTS
    ========================= */
    const paid = bookings.filter((booking) => booking.paymentStatus ===
        booking_interface_1.PaymentStatus.PAID).length;
    const pending = bookings.filter((booking) => booking.paymentStatus ===
        booking_interface_1.PaymentStatus.PENDING).length;
    const failed = bookings.filter((booking) => booking.paymentStatus ===
        booking_interface_1.PaymentStatus.FAILED).length;
    /* =========================
       ALL USER BOOKINGS
    ========================= */
    const userBookings = bookings.map((booking) => ({
        _id: booking._id,
        totalAmount: booking.totalAmount,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        items: booking.items,
        shippingAddress: booking.shippingAddress,
        stripeSessionId: booking.stripeSessionId,
        createdAt: booking.createdAt,
    }));
    /* =========================
       PRODUCT HISTORY
  
       Which product user bought
       and how many times
    ========================= */
    const productHistory = yield booking_model_1.Booking.aggregate([
        {
            $match: {
                user: (_a = bookings[0]) === null || _a === void 0 ? void 0 : _a.user,
                paymentStatus: booking_interface_1.PaymentStatus.PAID,
            },
        },
        {
            $unwind: "$items",
        },
        {
            $group: {
                _id: "$items.product",
                productName: {
                    $first: "$items.name",
                },
                totalQuantity: {
                    $sum: "$items.quantity",
                },
                totalSpent: {
                    $sum: "$items.subtotal",
                },
            },
        },
        {
            $sort: {
                totalQuantity: -1,
            },
        },
        {
            $project: {
                _id: 1,
                productName: 1,
                totalQuantity: 1,
                totalSpent: 1,
            },
        },
    ]);
    return {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalSpent,
        payments: {
            paid,
            pending,
            failed,
        },
        bookings: userBookings,
        productHistory,
    };
});
/* =========================================================
   ADMIN - USER OVERVIEW
========================================================= */
const getUserOverviewStats = () => __awaiter(void 0, void 0, void 0, function* () {
    /* =========================
       USER COUNTS
    ========================= */
    const totalUsersPromise = user_model_1.User.countDocuments();
    const totalActiveUsersPromise = user_model_1.User.countDocuments({
        IsActive: user_interface_1.isActive.ACTIVE,
    });
    const totalInactiveUsersPromise = user_model_1.User.countDocuments({
        IsActive: user_interface_1.isActive.INACTIVE,
    });
    const totalBlockedUsersPromise = user_model_1.User.countDocuments({
        IsActive: user_interface_1.isActive.BLOCKED,
    });
    /* =========================
       NEW USERS
    ========================= */
    const newUsersLast7DaysPromise = user_model_1.User.countDocuments({
        createdAt: {
            $gte: sevenDaysAgo,
        },
    });
    const newUsersLast30DaysPromise = user_model_1.User.countDocuments({
        createdAt: {
            $gte: thirtyDaysAgo,
        },
    });
    /* =========================
       USERS BY ROLE
    ========================= */
    const usersByRolePromise = user_model_1.User.aggregate([
        {
            $group: {
                _id: "$role",
                count: {
                    $sum: 1,
                },
            },
        },
        {
            $sort: {
                count: -1,
            },
        },
    ]);
    const [totalUsers, totalActiveUsers, totalInactiveUsers, totalBlockedUsers, newUsersLast7Days, newUsersLast30Days, usersByRole,] = yield Promise.all([
        totalUsersPromise,
        totalActiveUsersPromise,
        totalInactiveUsersPromise,
        totalBlockedUsersPromise,
        newUsersLast7DaysPromise,
        newUsersLast30DaysPromise,
        usersByRolePromise,
    ]);
    return {
        totalUsers,
        totalActiveUsers,
        totalInactiveUsers,
        totalBlockedUsers,
        newUsersLast7Days,
        newUsersLast30Days,
        usersByRole,
    };
});
/* =========================================================
   ADMIN - PRODUCT STATS
========================================================= */
const getProductStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    var _b;
    const [totalProducts, activeProducts, inactiveProducts, outOfStockProducts, lowStockProducts, totalStockResult, productsByCategory, topProducts,] = yield Promise.all([
        /* Total */
        product_model_1.Product.countDocuments(),
        /* Active */
        product_model_1.Product.countDocuments({
            isActive: true,
        }),
        /* Inactive */
        product_model_1.Product.countDocuments({
            isActive: false,
        }),
        /* Out of stock */
        product_model_1.Product.countDocuments({
            stock: 0,
        }),
        /* Low stock */
        product_model_1.Product.countDocuments({
            stock: {
                $gt: 0,
                $lte: 5,
            },
        }),
        /* Total stock */
        product_model_1.Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalStock: {
                        $sum: "$stock",
                    },
                },
            },
        ]),
        /* Category */
        product_model_1.Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
        ]),
        /* Top rated products */
        product_model_1.Product.find({
            isActive: true,
        })
            .select("name slug price rating reviews stock images.main")
            .sort({
            rating: -1,
            reviews: -1,
        })
            .limit(5)
            .lean(),
    ]);
    const totalStock = (_b = (_a = totalStockResult[0]) === null || _a === void 0 ? void 0 : _a.totalStock) !== null && _b !== void 0 ? _b : 0;
    return {
        totalProducts,
        activeProducts,
        inactiveProducts,
        outOfStockProducts,
        lowStockProducts,
        totalStock,
        productsByCategory,
        topProducts,
    };
});
/* =========================================================
   ADMIN - BOOKING STATS
========================================================= */
const getBookingStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const [totalBookings, pendingBookings, confirmedBookings, cancelledBookings, bookingsLast7Days, bookingsLast30Days, uniqueCustomers, bookingsByStatus, recentBookings,] = yield Promise.all([
        /* Total */
        booking_model_1.Booking.countDocuments(),
        /* Pending */
        booking_model_1.Booking.countDocuments({
            bookingStatus: booking_interface_1.BookingStatus.PENDING,
        }),
        /* Confirmed */
        booking_model_1.Booking.countDocuments({
            bookingStatus: booking_interface_1.BookingStatus.CONFIRMED,
        }),
        /* Cancelled */
        booking_model_1.Booking.countDocuments({
            bookingStatus: booking_interface_1.BookingStatus.CANCELLED,
        }),
        /* Last 7 days */
        booking_model_1.Booking.countDocuments({
            createdAt: {
                $gte: sevenDaysAgo,
            },
        }),
        /* Last 30 days */
        booking_model_1.Booking.countDocuments({
            createdAt: {
                $gte: thirtyDaysAgo,
            },
        }),
        /* Unique customers */
        booking_model_1.Booking.distinct("user").then((users) => users.length),
        /* Status */
        booking_model_1.Booking.aggregate([
            {
                $group: {
                    _id: "$bookingStatus",
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
        ]),
        /* Recent */
        booking_model_1.Booking.find()
            .populate("user", "name email phone")
            .sort({
            createdAt: -1,
        })
            .limit(5)
            .lean(),
    ]);
    return {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        bookingsLast7Days,
        bookingsLast30Days,
        uniqueCustomers,
        bookingsByStatus,
        recentBookings,
    };
});
/* =========================================================
   ADMIN - PAYMENT STATS
========================================================= */
const getPaymentStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    var _c, _d;
    const [totalPayments, paidPayments, pendingPayments, failedPayments, paymentsByStatus, revenueResult, averagePaymentResult,] = yield Promise.all([
        /* Total */
        booking_model_1.Booking.countDocuments(),
        /* Paid */
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.PAID,
        }),
        /* Pending */
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.PENDING,
        }),
        /* Failed */
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.FAILED,
        }),
        /* Payment status */
        booking_model_1.Booking.aggregate([
            {
                $group: {
                    _id: "$paymentStatus",
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
        ]),
        /* Revenue */
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    paymentStatus: booking_interface_1.PaymentStatus.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$totalAmount",
                    },
                },
            },
        ]),
        /* Average payment */
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    paymentStatus: booking_interface_1.PaymentStatus.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    averagePaymentAmount: {
                        $avg: "$totalAmount",
                    },
                },
            },
        ]),
    ]);
    const totalRevenue = (_c = (_a = revenueResult[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) !== null && _c !== void 0 ? _c : 0;
    const averagePaymentAmount = (_d = (_b = averagePaymentResult[0]) === null || _b === void 0 ? void 0 : _b.averagePaymentAmount) !== null && _d !== void 0 ? _d : 0;
    return {
        totalPayments,
        paidPayments,
        pendingPayments,
        failedPayments,
        totalRevenue,
        averagePaymentAmount,
        paymentsByStatus,
    };
});
const getAllAdminBookings = (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit, search, paymentStatus, bookingStatus, }) {
    const skip = (page - 1) * limit;
    const filter = {};
    // =====================================
    // PAYMENT STATUS FILTER
    // =====================================
    if (paymentStatus &&
        paymentStatus !== "ALL") {
        filter.paymentStatus = paymentStatus;
    }
    // =====================================
    // BOOKING STATUS FILTER
    // =====================================
    if (bookingStatus &&
        bookingStatus !== "ALL") {
        filter.bookingStatus = bookingStatus;
    }
    // =====================================
    // SEARCH
    // =====================================
    if (search === null || search === void 0 ? void 0 : search.trim()) {
        const searchRegex = {
            $regex: search.trim(),
            $options: "i",
        };
        const users = yield user_model_1.User.find({
            $or: [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
            ],
        })
            .select("_id")
            .lean();
        const userIds = users.map((user) => user._id);
        filter.$or = [
            {
                _id: search.trim(),
            },
            {
                user: {
                    $in: userIds,
                },
            },
        ];
    }
    // =====================================
    // GET ORDERS + TOTAL
    // =====================================
    const [orders, total] = yield Promise.all([
        booking_model_1.Booking.find(filter)
            .populate("user", "name email phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        booking_model_1.Booking.countDocuments(filter),
    ]);
    // =====================================
    // TOTAL PAGE
    // =====================================
    const totalPage = Math.ceil(total / limit);
    return {
        data: orders,
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
    };
});
/* ========================================================
   EXPORT
========================================================= */
exports.StatsService = {
    getUserStats,
    getUserOverviewStats,
    getProductStats,
    getBookingStats,
    getPaymentStats,
    getAllAdminBookings,
};
