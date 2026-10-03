
import mongoose from "mongoose";

import { User } from "../user/user.model";
import { Product } from "../product/product.model";
import { Booking } from "../booking/booking.model";

import {
  BookingStatus,
  PaymentStatus,
} from "../booking/booking.interface";

// ==========================================
// ADMIN STATS
// ==========================================

const getAdminStats = async () => {
  const sixMonthsAgo = new Date();

  sixMonthsAgo.setMonth(
    sixMonthsAgo.getMonth() - 5,
  );

  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalProducts,
    totalBookings,

    pendingBookings,
    confirmedBookings,
    cancelledBookings,

    paidOrders,
    pendingPayments,
    failedPayments,

    revenueResult,
    averagePaymentResult,

    recentBookings,
    recentUsers,

    monthlyStats,
    customerStats,
  ] = await Promise.all([
    // ==========================================
    // USERS
    // ==========================================

    User.countDocuments(),

    // ==========================================
    // PRODUCTS
    // ==========================================

    Product.countDocuments({
      isActive: true,
    }),

    // ==========================================
    // BOOKINGS
    // ==========================================

    Booking.countDocuments(),

    Booking.countDocuments({
      bookingStatus: BookingStatus.PENDING,
    }),

    Booking.countDocuments({
      bookingStatus: BookingStatus.CONFIRMED,
    }),

    Booking.countDocuments({
      bookingStatus: BookingStatus.CANCELLED,
    }),

    // ==========================================
    // PAYMENTS
    // ==========================================

    Booking.countDocuments({
      paymentStatus: PaymentStatus.PAID,
    }),

    Booking.countDocuments({
      paymentStatus: PaymentStatus.PENDING,
    }),

    Booking.countDocuments({
      paymentStatus: PaymentStatus.FAILED,
    }),

    // ==========================================
    // TOTAL REVENUE
    // ==========================================

    Booking.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.PAID,
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

    Booking.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.PAID,
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

    Booking.find()
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .populate(
        "user",
        "name email phone address",
      )
      .lean(),

    // ==========================================
    // RECENT USERS
    // ==========================================

    User.find()
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .select(
        "name email phone address Role IsActive createdAt",
      )
      .lean(),

    // ==========================================
    // MONTHLY STATS
    // ==========================================

    Booking.aggregate([
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
                    PaymentStatus.PAID,
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

    Booking.aggregate([
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
                    PaymentStatus.PAID,
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
                    PaymentStatus.PAID,
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

  const totalRevenue =
    revenueResult[0]?.totalRevenue || 0;

  const averagePayment =
    averagePaymentResult[0]?.averageAmount || 0;

  // ==========================================
  // CUSTOMER TYPE
  // ==========================================

  const formattedCustomers =
    customerStats.map(
      (customer) => ({
        name:
          customer.name ||
          "Unknown",

        email:
          customer.email || "",

        phone:
          customer.phone || "",

        address:
          customer.address || "",

        city:
          customer.city || "",

        postalCode:
          customer.postalCode || "",

        totalOrders:
          customer.totalOrders,

        paidOrders:
          customer.paidOrders,

        totalSpent:
          customer.totalSpent,

        lastOrderAt:
          customer.lastOrderAt,

        customerType:
          customer.registeredOrders > 0
            ? "REGISTERED"
            : "GUEST",
      }),
    );

  const guestCustomers =
    formattedCustomers.filter(
      (customer) =>
        customer.customerType ===
        "GUEST",
    ).length;

  const registeredCustomers =
    formattedCustomers.filter(
      (customer) =>
        customer.customerType ===
        "REGISTERED",
    ).length;

  // ==========================================
  // MONTHLY STATS
  // ==========================================

  const formattedMonthlyStats =
    monthlyStats.map(
      (item) => ({
        year: item._id.year,

        month: item._id.month,

        orders: item.orders,

        revenue: item.revenue,
      }),
    );

  // ==========================================
  // RECENT BOOKINGS
  // ==========================================

  const formattedRecentBookings =
    recentBookings.map(
      (booking: any) => {
        const shippingAddress =
          booking.shippingAddress || {};

        const customer =
          booking.customer || {};

        return {
          _id: booking._id,

          // ====================================
          // USER
          // ====================================

          user:
            booking.user || null,

          // ====================================
          // GUEST ID
          // ====================================

          guestId:
            booking.guestId || null,

          // ====================================
          // ROOT EMAIL
          // IMPORTANT FOR GUEST
          // ====================================

          email:
            booking.email ||
            customer.email ||
            booking.user?.email ||
            "",

          // ====================================
          // SHIPPING ADDRESS
          // IMPORTANT FOR GUEST
          // ====================================

          shippingAddress: {
            name:
              shippingAddress.name ||
              customer.name ||
              booking.user?.name ||
              "",

            phone:
              shippingAddress.phone ||
              customer.phone ||
              booking.user?.phone ||
              "",

            address:
              shippingAddress.address ||
              customer.address ||
              booking.user?.address ||
              "",

            city:
              shippingAddress.city ||
              customer.city ||
              "",

            postalCode:
              shippingAddress.postalCode ||
              customer.postalCode ||
              "",
          },

          // ====================================
          // CUSTOMER
          // Keep backward compatibility
          // ====================================

          customer: {
            name:
              shippingAddress.name ||
              customer.name ||
              booking.user?.name ||
              "",

            email:
              booking.email ||
              customer.email ||
              booking.user?.email ||
              "",

            phone:
              shippingAddress.phone ||
              customer.phone ||
              booking.user?.phone ||
              "",

            address:
              shippingAddress.address ||
              customer.address ||
              booking.user?.address ||
              "",

            city:
              shippingAddress.city ||
              customer.city ||
              "",

            postalCode:
              shippingAddress.postalCode ||
              customer.postalCode ||
              "",
          },

          // ====================================
          // ITEMS
          // ====================================

          items:
            booking.items || [],

          // ====================================
          // AMOUNT
          // ====================================

          totalAmount:
            Number(
              booking.totalAmount,
            ) || 0,

          // ====================================
          // PAYMENT
          // ====================================

          paymentStatus:
            booking.paymentStatus || "",

          // ====================================
          // BOOKING STATUS
          // ====================================

          bookingStatus:
            booking.bookingStatus || "",

          // ====================================
          // CUSTOMER TYPE
          // ====================================

          customerType:
            booking.user
              ? "REGISTERED"
              : "GUEST",

          // ====================================
          // DATE
          // ====================================

          createdAt:
            booking.createdAt,

          updatedAt:
            booking.updatedAt,
        };
      },
    );

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

    averagePaymentAmount:
      Number(
        averagePayment.toFixed(2),
      ),

    // ========================================
    // CUSTOMER
    // ========================================

    uniqueCustomers:
      formattedCustomers.length,

    guestCustomers,

    registeredCustomers,

    customers:
      formattedCustomers,

    // ========================================
    // RECENT
    // ========================================

    recentBookings:
      formattedRecentBookings,

    recentUsers,

    // ========================================
    // CHART
    // ========================================

    monthlyStats:
      formattedMonthlyStats,
  };
};

// ==================================================
// USER STATS
// ==================================================

const getUserStats = async (
  userId: string,
) => {
  const objectId =
    new mongoose.Types.ObjectId(
      userId,
    );

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    cancelledOrders,
    paidOrders,
    pendingPayments,
    failedPayments,
    totalSpentResult,
    recentOrders,
  ] = await Promise.all([
    Booking.countDocuments({
      user: objectId,
    }),

    Booking.countDocuments({
      user: objectId,

      bookingStatus:
        BookingStatus.PENDING,
    }),

    Booking.countDocuments({
      user: objectId,

      bookingStatus:
        BookingStatus.CONFIRMED,
    }),

    Booking.countDocuments({
      user: objectId,

      bookingStatus:
        BookingStatus.CANCELLED,
    }),

    Booking.countDocuments({
      user: objectId,

      paymentStatus:
        PaymentStatus.PAID,
    }),

    Booking.countDocuments({
      user: objectId,

      paymentStatus:
        PaymentStatus.PENDING,
    }),

    Booking.countDocuments({
      user: objectId,

      paymentStatus:
        PaymentStatus.FAILED,
    }),

    Booking.aggregate([
      {
        $match: {
          user: objectId,

          paymentStatus:
            PaymentStatus.PAID,
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

    Booking.find({
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

    totalSpent:
      totalSpentResult[0]
        ?.totalSpent || 0,

    recentOrders,
  };
};

// ==================================================
// GET ALL ORDERS - ADMIN
// ==================================================

const getAllOrders = async (
  page = 1,
  limit = 10,
) => {
  const skip =
    (page - 1) * limit;

  const [orders, total] =
    await Promise.all([
      Booking.find()
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .populate(
          "user",
          "name email phone address",
        )
        .lean(),

      Booking.countDocuments(),
    ]);

  const formattedOrders =
    orders.map(
      (booking: any) => {
        // ======================================
        // SAFE DATA SOURCES
        // ======================================

        const shippingAddress =
          booking.shippingAddress ||
          {};

        const customer =
          booking.customer ||
          {};

        const user =
          booking.user ||
          null;

        // ======================================
        // CUSTOMER NAME
        // Priority:
        // shippingAddress
        // customer
        // user
        // ======================================

        const customerName =
          shippingAddress.name ||
          customer.name ||
          user?.name ||
          booking.name ||
          "Guest Customer";

        // ======================================
        // CUSTOMER EMAIL
        // Priority:
        // booking.email
        // customer.email
        // user.email
        // ======================================

        const customerEmail =
          booking.email ||
          customer.email ||
          user?.email ||
          "";

        // ======================================
        // CUSTOMER PHONE
        // Priority:
        // shippingAddress.phone
        // customer.phone
        // user.phone
        // ======================================

        const customerPhone =
          shippingAddress.phone ||
          customer.phone ||
          user?.phone ||
          booking.phone ||
          "";

        // ======================================
        // CUSTOMER ADDRESS
        // ======================================

        const customerAddress =
          shippingAddress.address ||
          customer.address ||
          user?.address ||
          booking.address ||
          "";

        // ======================================
        // CITY
        // ======================================

        const customerCity =
          shippingAddress.city ||
          customer.city ||
          booking.city ||
          "";

        // ======================================
        // POSTAL CODE
        // ======================================

        const customerPostalCode =
          shippingAddress.postalCode ||
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

          guestId:
            booking.guestId ||
            null,

          // ====================================
          // ROOT EMAIL
          // ====================================

          email:
            customerEmail,

          // ====================================
          // SHIPPING ADDRESS
          // This is what frontend needs
          // ====================================

          shippingAddress: {
            name:
              customerName,

            phone:
              customerPhone,

            address:
              customerAddress,

            city:
              customerCity,

            postalCode:
              customerPostalCode,
          },

          // ====================================
          // CUSTOMER
          // Backward compatibility
          // ====================================

          customer: {
            name:
              customerName,

            email:
              customerEmail,

            phone:
              customerPhone,

            address:
              customerAddress,

            city:
              customerCity,

            postalCode:
              customerPostalCode,
          },

          // ====================================
          // ORDER ITEMS
          // ====================================

          items:
            booking.items || [],

          // ====================================
          // AMOUNT
          // ====================================

          totalAmount:
            Number(
              booking.totalAmount,
            ) || 0,

          // ====================================
          // PAYMENT
          // ====================================

          paymentStatus:
            booking.paymentStatus || "",

          // ====================================
          // ORDER STATUS
          // ====================================

          bookingStatus:
            booking.bookingStatus || "",

          // ====================================
          // CUSTOMER TYPE
          // ====================================

          customerType:
            user
              ? "REGISTERED"
              : "GUEST",

          // ====================================
          // DATE
          // ====================================

          createdAt:
            booking.createdAt,

          updatedAt:
            booking.updatedAt,
        };
      },
    );

  // ==========================================
  // FINAL RESPONSE
  // ==========================================

  return {
    data:
      formattedOrders,

    meta: {
      page,

      limit,

      total,

      totalPage:
        Math.ceil(
          total / limit,
        ),
    },
  };
};

// ==================================================
// EXPORT
// ==================================================

export const statsService = {
  getAdminStats,

  getUserStats,

  getAllOrders,
};

