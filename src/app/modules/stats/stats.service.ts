import { Booking } from "../booking/booking.model";
import {
  BookingStatus,
  PaymentStatus,
} from "../booking/booking.interface";
import { Product } from "../product/product.model";
import { User } from "../user/user.model";

const getAdminStats = async () => {
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
    recentBookings,
    recentUsers,
    monthlyStats,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
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
    Booking.countDocuments({
      paymentStatus: PaymentStatus.PAID,
    }),
    Booking.countDocuments({
      paymentStatus: PaymentStatus.PENDING,
    }),
    Booking.countDocuments({
      paymentStatus: PaymentStatus.FAILED,
    }),
    Booking.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.PAID,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("email items totalAmount paymentStatus bookingStatus createdAt")
      .lean(),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt")
      .lean(),
    Booking.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.PAID,
          createdAt: {
            $gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 5,
              1,
            ),
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

  const monthlyMap = new Map(
    monthlyStats.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item,
    ]),
  );

  const now = new Date();

  const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1,
    );

    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const found = monthlyMap.get(key);

    return {
      month: monthNames[date.getMonth()],
      orders: found?.orders ?? 0,
      revenue: found?.revenue ?? 0,
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
    totalRevenue: revenueResult[0]?.total ?? 0,
    recentBookings,
    recentUsers,
    monthlyStats: lastSixMonths,
  };
};

const getUserStats = async (userId: string) => {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    cancelledOrders,
    paidOrders,
    pendingPayments,
    spentResult,
    recentOrders,
  ] = await Promise.all([
    Booking.countDocuments({ user: userId }),
    Booking.countDocuments({
      user: userId,
      bookingStatus: BookingStatus.PENDING,
    }),
    Booking.countDocuments({
      user: userId,
      bookingStatus: BookingStatus.CONFIRMED,
    }),
    Booking.countDocuments({
      user: userId,
      bookingStatus: BookingStatus.CANCELLED,
    }),
    Booking.countDocuments({
      user: userId,
      paymentStatus: PaymentStatus.PAID,
    }),
    Booking.countDocuments({
      user: userId,
      paymentStatus: PaymentStatus.PENDING,
    }),
    Booking.aggregate([
      {
        $match: {
          user: new (await import("mongoose")).Types.ObjectId(userId),
          paymentStatus: PaymentStatus.PAID,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]),
    Booking.find({ user: userId })
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
    totalSpent: spentResult[0]?.total ?? 0,
    recentOrders,
  };
};

export const statsService = {
  getAdminStats,
  getUserStats,
};