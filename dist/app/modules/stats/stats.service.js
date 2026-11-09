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
exports.statsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../user/user.model");
const product_model_1 = require("../product/product.model");
const booking_model_1 = require("../booking/booking.model");
const booking_interface_1 = require("../booking/booking.interface");
// ==========================================
// ADMIN STATS
// ==========================================
const getAdminStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const [totalUsers, totalProducts, totalBookings, pendingBookings, confirmedBookings, cancelledBookings, paidOrders, pendingPayments, failedPayments, revenueResult, averagePaymentResult, recentBookings, recentUsers, monthlyStats, customerStats,] = yield Promise.all([
        // ==========================================
        // USERS
        // ==========================================
        user_model_1.User.countDocuments(),
        // ==========================================
        // PRODUCTS
        // ==========================================
        product_model_1.Product.countDocuments({
            isActive: true,
        }),
        // ==========================================
        // BOOKINGS
        // ==========================================
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
        // ==========================================
        // PAYMENTS
        // ==========================================
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.PAID,
        }),
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.PENDING,
        }),
        booking_model_1.Booking.countDocuments({
            paymentStatus: booking_interface_1.PaymentStatus.FAILED,
        }),
        // ==========================================
        // TOTAL REVENUE
        // ==========================================
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
        // ==========================================
        // AVERAGE PAYMENT
        // ==========================================
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    paymentStatus: booking_interface_1.PaymentStatus.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    averageAmount: {
                        $avg: "$totalAmount",
                    },
                },
            },
        ]),
        // ==========================================
        // RECENT ORDERS
        // ==========================================
        booking_model_1.Booking.find()
            .sort({
            createdAt: -1,
        })
            .limit(10)
            .populate("user", "name email phone address")
            .lean(),
        // ==========================================
        // RECENT USERS
        // ==========================================
        user_model_1.User.find()
            .sort({
            createdAt: -1,
        })
            .limit(10)
            .select("name email phone address Role IsActive createdAt")
            .lean(),
        // ==========================================
        // MONTHLY STATS
        // ==========================================
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: sixMonthsAgo,
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: {
                            $year: "$createdAt",
                        },
                        month: {
                            $month: "$createdAt",
                        },
                    },
                    orders: {
                        $sum: 1,
                    },
                    revenue: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$paymentStatus",
                                        booking_interface_1.PaymentStatus.PAID,
                                    ],
                                },
                                "$totalAmount",
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                },
            },
        ]),
        // ==========================================
        // CUSTOMER STATS
        // REGISTERED + GUEST
        // ==========================================
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    $or: [
                        {
                            "customer.email": {
                                $exists: true,
                                $ne: "",
                            },
                        },
                        {
                            email: {
                                $exists: true,
                                $ne: "",
                            },
                        },
                    ],
                },
            },
            // ========================================
            // CUSTOMER INFORMATION
            // ========================================
            {
                $project: {
                    user: 1,
                    customer: 1,
                    shippingAddress: 1,
                    customerEmail: {
                        $ifNull: [
                            "$customer.email",
                            "$email",
                        ],
                    },
                    customerName: {
                        $ifNull: [
                            "$customer.name",
                            "$shippingAddress.name",
                        ],
                    },
                    customerPhone: {
                        $ifNull: [
                            "$customer.phone",
                            "$shippingAddress.phone",
                        ],
                    },
                    customerAddress: {
                        $ifNull: [
                            "$customer.address",
                            "$shippingAddress.address",
                        ],
                    },
                    customerCity: {
                        $ifNull: [
                            "$customer.city",
                            "$shippingAddress.city",
                        ],
                    },
                    customerPostalCode: {
                        $ifNull: [
                            "$customer.postalCode",
                            "$shippingAddress.postalCode",
                        ],
                    },
                    totalAmount: 1,
                    paymentStatus: 1,
                    createdAt: 1,
                },
            },
            // ========================================
            // GROUP BY CUSTOMER EMAIL
            // ========================================
            {
                $group: {
                    _id: "$customerEmail",
                    name: {
                        $last: "$customerName",
                    },
                    email: {
                        $first: "$customerEmail",
                    },
                    phone: {
                        $last: "$customerPhone",
                    },
                    address: {
                        $last: "$customerAddress",
                    },
                    city: {
                        $last: "$customerCity",
                    },
                    postalCode: {
                        $last: "$customerPostalCode",
                    },
                    totalOrders: {
                        $sum: 1,
                    },
                    paidOrders: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$paymentStatus",
                                        booking_interface_1.PaymentStatus.PAID,
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    totalSpent: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$paymentStatus",
                                        booking_interface_1.PaymentStatus.PAID,
                                    ],
                                },
                                "$totalAmount",
                                0,
                            ],
                        },
                    },
                    lastOrderAt: {
                        $max: "$createdAt",
                    },
                    registeredOrders: {
                        $sum: {
                            $cond: [
                                {
                                    $ne: [
                                        "$user",
                                        null,
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $sort: {
                    lastOrderAt: -1,
                },
            },
        ]),
    ]);
    // ==========================================
    // REVENUE
    // ==========================================
    const totalRevenue = ((_a = revenueResult[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
    const averagePayment = ((_b = averagePaymentResult[0]) === null || _b === void 0 ? void 0 : _b.averageAmount) || 0;
    // ==========================================
    // CUSTOMER TYPE
    // ==========================================
    const formattedCustomers = customerStats.map((customer) => ({
        name: customer.name ||
            "Unknown",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        postalCode: customer.postalCode || "",
        totalOrders: customer.totalOrders,
        paidOrders: customer.paidOrders,
        totalSpent: customer.totalSpent,
        lastOrderAt: customer.lastOrderAt,
        customerType: customer.registeredOrders > 0
            ? "REGISTERED"
            : "GUEST",
    }));
    const guestCustomers = formattedCustomers.filter((customer) => customer.customerType ===
        "GUEST").length;
    const registeredCustomers = formattedCustomers.filter((customer) => customer.customerType ===
        "REGISTERED").length;
    // ==========================================
    // MONTHLY STATS
    // ==========================================
    const formattedMonthlyStats = monthlyStats.map((item) => ({
        year: item._id.year,
        month: item._id.month,
        orders: item.orders,
        revenue: item.revenue,
    }));
    // ==========================================
    // RECENT BOOKINGS
    // ==========================================
    const formattedRecentBookings = recentBookings.map((booking) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const shippingAddress = booking.shippingAddress || {};
        const customer = booking.customer || {};
        return {
            _id: booking._id,
            // ====================================
            // USER
            // ====================================
            user: booking.user || null,
            // ====================================
            // GUEST ID
            // ====================================
            guestId: booking.guestId || null,
            // ====================================
            // ROOT EMAIL
            // IMPORTANT FOR GUEST
            // ====================================
            email: booking.email ||
                customer.email ||
                ((_a = booking.user) === null || _a === void 0 ? void 0 : _a.email) ||
                "",
            // ====================================
            // SHIPPING ADDRESS
            // IMPORTANT FOR GUEST
            // ====================================
            shippingAddress: {
                name: shippingAddress.name ||
                    customer.name ||
                    ((_b = booking.user) === null || _b === void 0 ? void 0 : _b.name) ||
                    "",
                phone: shippingAddress.phone ||
                    customer.phone ||
                    ((_c = booking.user) === null || _c === void 0 ? void 0 : _c.phone) ||
                    "",
                address: shippingAddress.address ||
                    customer.address ||
                    ((_d = booking.user) === null || _d === void 0 ? void 0 : _d.address) ||
                    "",
                city: shippingAddress.city ||
                    customer.city ||
                    "",
                postalCode: shippingAddress.postalCode ||
                    customer.postalCode ||
                    "",
            },
            // ====================================
            // CUSTOMER
            // Keep backward compatibility
            // ====================================
            customer: {
                name: shippingAddress.name ||
                    customer.name ||
                    ((_e = booking.user) === null || _e === void 0 ? void 0 : _e.name) ||
                    "",
                email: booking.email ||
                    customer.email ||
                    ((_f = booking.user) === null || _f === void 0 ? void 0 : _f.email) ||
                    "",
                phone: shippingAddress.phone ||
                    customer.phone ||
                    ((_g = booking.user) === null || _g === void 0 ? void 0 : _g.phone) ||
                    "",
                address: shippingAddress.address ||
                    customer.address ||
                    ((_h = booking.user) === null || _h === void 0 ? void 0 : _h.address) ||
                    "",
                city: shippingAddress.city ||
                    customer.city ||
                    "",
                postalCode: shippingAddress.postalCode ||
                    customer.postalCode ||
                    "",
            },
            // ====================================
            // ITEMS
            // ====================================
            items: booking.items || [],
            // ====================================
            // AMOUNT
            // ====================================
            totalAmount: Number(booking.totalAmount) || 0,
            // ====================================
            // PAYMENT
            // ====================================
            paymentStatus: booking.paymentStatus || "",
            // ====================================
            // BOOKING STATUS
            // ====================================
            bookingStatus: booking.bookingStatus || "",
            // ====================================
            // CUSTOMER TYPE
            // ====================================
            customerType: booking.user
                ? "REGISTERED"
                : "GUEST",
            // ====================================
            // DATE
            // ====================================
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
        };
    });
    // ==========================================
    // FINAL RESPONSE
    // ==========================================
    return {
        // ========================================
        // BASIC
        // ========================================
        totalUsers,
        totalProducts,
        totalBookings,
        // ========================================
        // BOOKING
        // ========================================
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        // ========================================
        // PAYMENT
        // ========================================
        paidOrders,
        pendingPayments,
        failedPayments,
        totalRevenue,
        averagePaymentAmount: Number(averagePayment.toFixed(2)),
        // ========================================
        // CUSTOMER
        // ========================================
        uniqueCustomers: formattedCustomers.length,
        guestCustomers,
        registeredCustomers,
        customers: formattedCustomers,
        // ========================================
        // RECENT
        // ========================================
        recentBookings: formattedRecentBookings,
        recentUsers,
        // ========================================
        // CHART
        // ========================================
        monthlyStats: formattedMonthlyStats,
    };
});
// ==================================================
// USER STATS
// ==================================================
const getUserStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const objectId = new mongoose_1.default.Types.ObjectId(userId);
    const [totalOrders, pendingOrders, confirmedOrders, cancelledOrders, paidOrders, pendingPayments, failedPayments, totalSpentResult, recentOrders,] = yield Promise.all([
        booking_model_1.Booking.countDocuments({
            user: objectId,
        }),
        booking_model_1.Booking.countDocuments({
            user: objectId,
            bookingStatus: booking_interface_1.BookingStatus.PENDING,
        }),
        booking_model_1.Booking.countDocuments({
            user: objectId,
            bookingStatus: booking_interface_1.BookingStatus.CONFIRMED,
        }),
        booking_model_1.Booking.countDocuments({
            user: objectId,
            bookingStatus: booking_interface_1.BookingStatus.CANCELLED,
        }),
        booking_model_1.Booking.countDocuments({
            user: objectId,
            paymentStatus: booking_interface_1.PaymentStatus.PAID,
        }),
        booking_model_1.Booking.countDocuments({
            user: objectId,
            paymentStatus: booking_interface_1.PaymentStatus.PENDING,
        }),
        booking_model_1.Booking.countDocuments({
            user: objectId,
            paymentStatus: booking_interface_1.PaymentStatus.FAILED,
        }),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    user: objectId,
                    paymentStatus: booking_interface_1.PaymentStatus.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    totalSpent: {
                        $sum: "$totalAmount",
                    },
                },
            },
        ]),
        booking_model_1.Booking.find({
            user: objectId,
        })
            .sort({
            createdAt: -1,
        })
            .limit(10)
            .lean(),
    ]);
    return {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        cancelledOrders,
        paidOrders,
        pendingPayments,
        failedPayments,
        totalSpent: ((_a = totalSpentResult[0]) === null || _a === void 0 ? void 0 : _a.totalSpent) || 0,
        recentOrders,
    };
});
// ==================================================
// GET ALL ORDERS - ADMIN
// ==================================================
const getAllOrders = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = yield Promise.all([
        booking_model_1.Booking.find()
            .sort({
            createdAt: -1,
        })
            .skip(skip)
            .limit(limit)
            .populate("user", "name email phone address")
            .lean(),
        booking_model_1.Booking.countDocuments(),
    ]);
    const formattedOrders = orders.map((booking) => {
        // ======================================
        // SAFE DATA SOURCES
        // ======================================
        const shippingAddress = booking.shippingAddress ||
            {};
        const customer = booking.customer ||
            {};
        const user = booking.user ||
            null;
        // ======================================
        // CUSTOMER NAME
        // Priority:
        // shippingAddress
        // customer
        // user
        // ======================================
        const customerName = shippingAddress.name ||
            customer.name ||
            (user === null || user === void 0 ? void 0 : user.name) ||
            booking.name ||
            "Guest Customer";
        // ======================================
        // CUSTOMER EMAIL
        // Priority:
        // booking.email
        // customer.email
        // user.email
        // ======================================
        const customerEmail = booking.email ||
            customer.email ||
            (user === null || user === void 0 ? void 0 : user.email) ||
            "";
        // ======================================
        // CUSTOMER PHONE
        // Priority:
        // shippingAddress.phone
        // customer.phone
        // user.phone
        // ======================================
        const customerPhone = shippingAddress.phone ||
            customer.phone ||
            (user === null || user === void 0 ? void 0 : user.phone) ||
            booking.phone ||
            "";
        // ======================================
        // CUSTOMER ADDRESS
        // ======================================
        const customerAddress = shippingAddress.address ||
            customer.address ||
            (user === null || user === void 0 ? void 0 : user.address) ||
            booking.address ||
            "";
        // ======================================
        // CITY
        // ======================================
        const customerCity = shippingAddress.city ||
            customer.city ||
            booking.city ||
            "";
        // ======================================
        // POSTAL CODE
        // ======================================
        const customerPostalCode = shippingAddress.postalCode ||
            customer.postalCode ||
            booking.postalCode ||
            "";
        // ======================================
        // RETURN ORDER
        // ======================================
        return {
            _id: booking._id,
            // ====================================
            // USER
            // ====================================
            user,
            // ====================================
            // GUEST ID
            // ====================================
            guestId: booking.guestId ||
                null,
            // ====================================
            // ROOT EMAIL
            // ====================================
            email: customerEmail,
            // ====================================
            // SHIPPING ADDRESS
            // This is what frontend needs
            // ====================================
            shippingAddress: {
                name: customerName,
                phone: customerPhone,
                address: customerAddress,
                city: customerCity,
                postalCode: customerPostalCode,
            },
            // ====================================
            // CUSTOMER
            // Backward compatibility
            // ====================================
            customer: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                address: customerAddress,
                city: customerCity,
                postalCode: customerPostalCode,
            },
            // ====================================
            // ORDER ITEMS
            // ====================================
            items: booking.items || [],
            // ====================================
            // AMOUNT
            // ====================================
            totalAmount: Number(booking.totalAmount) || 0,
            // ====================================
            // PAYMENT
            // ====================================
            paymentStatus: booking.paymentStatus || "",
            // ====================================
            // ORDER STATUS
            // ====================================
            bookingStatus: booking.bookingStatus || "",
            // ====================================
            // CUSTOMER TYPE
            // ====================================
            customerType: user
                ? "REGISTERED"
                : "GUEST",
            // ====================================
            // DATE
            // ====================================
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
        };
    });
    // ==========================================
    // FINAL RESPONSE
    // ==========================================
    return {
        data: formattedOrders,
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
    };
});
// ==================================================
// EXPORT
// ==================================================
exports.statsService = {
    getAdminStats,
    getUserStats,
    getAllOrders,
};
