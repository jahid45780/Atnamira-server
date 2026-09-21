import { Booking } from "../booking/booking.model";
import {
  BookingStatus,
  PaymentStatus,
} from "../booking/booking.interface";

import { Product } from "../product/product.model";

import { Role, isActive } from "../user/user.interface";
import { User } from "../user/user.model";

import {
  IAdminBooking,
  IBookingStats,
  IGetOrdersParams,
  IGetOrdersResult,
  IPaymentStats,
  IProductStats,
  IUserOverviewStats,
  IUserStats,
} from "./stats.interface";

/* =========================================================
   DATE
========================================================= */

const now = new Date();

const sevenDaysAgo = new Date(now);
sevenDaysAgo.setDate(
  sevenDaysAgo.getDate() - 7,
);

const thirtyDaysAgo = new Date(now);
thirtyDaysAgo.setDate(
  thirtyDaysAgo.getDate() - 30,
);

/* =========================================================
   USER DASHBOARD
   Logged-in user only
========================================================= */

const getUserStats = async (
  userId: string,
): Promise<IUserStats> => {
  /* =========================
     GET USER BOOKINGS
  ========================= */

  const bookings = await Booking.find({
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

  const pendingBookings = bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      BookingStatus.PENDING,
  ).length;

  const confirmedBookings = bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      BookingStatus.CONFIRMED,
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      BookingStatus.CANCELLED,
  ).length;

  /* =========================
     TOTAL SPENT

     Only PAID bookings
  ========================= */

  const totalSpent = bookings
    .filter(
      (booking) =>
        booking.paymentStatus ===
        PaymentStatus.PAID,
    )
    .reduce(
      (total, booking) =>
        total + booking.totalAmount,
      0,
    );

  /* =========================
     PAYMENT COUNTS
  ========================= */

  const paid = bookings.filter(
    (booking) =>
      booking.paymentStatus ===
      PaymentStatus.PAID,
  ).length;

  const pending = bookings.filter(
    (booking) =>
      booking.paymentStatus ===
      PaymentStatus.PENDING,
  ).length;

  const failed = bookings.filter(
    (booking) =>
      booking.paymentStatus ===
      PaymentStatus.FAILED,
  ).length;

  /* =========================
     ALL USER BOOKINGS
  ========================= */

  const userBookings = bookings.map(
    (booking) => ({
      _id: booking._id,

      totalAmount: booking.totalAmount,

      paymentStatus:
        booking.paymentStatus,

      bookingStatus:
        booking.bookingStatus,

      items: booking.items,

      shippingAddress:
        booking.shippingAddress,

      stripeSessionId:
        booking.stripeSessionId,

      createdAt:
        booking.createdAt,
    }),
  );

  /* =========================
     PRODUCT HISTORY

     Which product user bought
     and how many times
  ========================= */

  const productHistory =
    await Booking.aggregate([
      {
        $match: {
          user: bookings[0]?.user,
          paymentStatus:
            PaymentStatus.PAID,
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
};

/* =========================================================
   ADMIN - USER OVERVIEW
========================================================= */

const getUserOverviewStats =
  async (): Promise<IUserOverviewStats> => {
    /* =========================
       USER COUNTS
    ========================= */

    const totalUsersPromise =
      User.countDocuments();

    const totalActiveUsersPromise =
      User.countDocuments({
        IsActive: isActive.ACTIVE,
      });

    const totalInactiveUsersPromise =
      User.countDocuments({
        IsActive: isActive.INACTIVE,
      });

    const totalBlockedUsersPromise =
      User.countDocuments({
        IsActive: isActive.BLOCKED,
      });

    /* =========================
       NEW USERS
    ========================= */

    const newUsersLast7DaysPromise =
      User.countDocuments({
        createdAt: {
          $gte: sevenDaysAgo,
        },
      });

    const newUsersLast30DaysPromise =
      User.countDocuments({
        createdAt: {
          $gte: thirtyDaysAgo,
        },
      });

    /* =========================
       USERS BY ROLE
    ========================= */

    const usersByRolePromise =
      User.aggregate([
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

    const [
      totalUsers,
      totalActiveUsers,
      totalInactiveUsers,
      totalBlockedUsers,
      newUsersLast7Days,
      newUsersLast30Days,
      usersByRole,
    ] = await Promise.all([
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
  };

/* =========================================================
   ADMIN - PRODUCT STATS
========================================================= */

const getProductStats =
  async (): Promise<IProductStats> => {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      lowStockProducts,
      totalStockResult,
      productsByCategory,
      topProducts,
    ] = await Promise.all([
      /* Total */

      Product.countDocuments(),

      /* Active */

      Product.countDocuments({
        isActive: true,
      }),

      /* Inactive */

      Product.countDocuments({
        isActive: false,
      }),

      /* Out of stock */

      Product.countDocuments({
        stock: 0,
      }),

      /* Low stock */

      Product.countDocuments({
        stock: {
          $gt: 0,
          $lte: 5,
        },
      }),

      /* Total stock */

      Product.aggregate([
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

      Product.aggregate([
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

      Product.find({
        isActive: true,
      })
        .select(
          "name slug price rating reviews stock images.main",
        )
        .sort({
          rating: -1,
          reviews: -1,
        })
        .limit(5)
        .lean(),
    ]);

    const totalStock =
      totalStockResult[0]?.totalStock ?? 0;

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
  };

/* =========================================================
   ADMIN - BOOKING STATS
========================================================= */

const getBookingStats =
  async (): Promise<IBookingStats> => {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      bookingsLast7Days,
      bookingsLast30Days,
      uniqueCustomers,
      bookingsByStatus,
      recentBookings,
    ] = await Promise.all([
      /* Total */

      Booking.countDocuments(),

      /* Pending */

      Booking.countDocuments({
        bookingStatus:
          BookingStatus.PENDING,
      }),

      /* Confirmed */

      Booking.countDocuments({
        bookingStatus:
          BookingStatus.CONFIRMED,
      }),

      /* Cancelled */

      Booking.countDocuments({
        bookingStatus:
          BookingStatus.CANCELLED,
      }),

      /* Last 7 days */

      Booking.countDocuments({
        createdAt: {
          $gte: sevenDaysAgo,
        },
      }),

      /* Last 30 days */

      Booking.countDocuments({
        createdAt: {
          $gte: thirtyDaysAgo,
        },
      }),

      /* Unique customers */

      Booking.distinct("user").then(
        (users) => users.length,
      ),

      /* Status */

      Booking.aggregate([
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

      Booking.find()
        .populate(
          "user",
          "name email phone",
        )
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
  };

/* =========================================================
   ADMIN - PAYMENT STATS
========================================================= */

const getPaymentStats =
  async (): Promise<IPaymentStats> => {
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      paymentsByStatus,
      revenueResult,
      averagePaymentResult,
    ] = await Promise.all([
      /* Total */

      Booking.countDocuments(),

      /* Paid */

      Booking.countDocuments({
        paymentStatus:
          PaymentStatus.PAID,
      }),

      /* Pending */

      Booking.countDocuments({
        paymentStatus:
          PaymentStatus.PENDING,
      }),

      /* Failed */

      Booking.countDocuments({
        paymentStatus:
          PaymentStatus.FAILED,
      }),

      /* Payment status */

      Booking.aggregate([
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

      Booking.aggregate([
        {
          $match: {
            paymentStatus:
              PaymentStatus.PAID,
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

      Booking.aggregate([
        {
          $match: {
            paymentStatus:
              PaymentStatus.PAID,
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

    const totalRevenue =
      revenueResult[0]?.totalRevenue ?? 0;

    const averagePaymentAmount =
      averagePaymentResult[0]
        ?.averagePaymentAmount ?? 0;

    return {
      totalPayments,

      paidPayments,

      pendingPayments,

      failedPayments,

      totalRevenue,

      averagePaymentAmount,

      paymentsByStatus,
    };
  };



const getAllAdminBookings = async ({
  page,
  limit,
}: IGetOrdersParams): Promise<IGetOrdersResult> => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Booking.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    data: orders as unknown as IAdminBooking[],

    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};



/* ========================================================
   EXPORT
========================================================= */

export const StatsService = {
  getUserStats,
  getUserOverviewStats,
  getProductStats,
  getBookingStats,
  getPaymentStats,
  getAllAdminBookings,
 
};