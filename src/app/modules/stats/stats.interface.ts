export interface IUserStats {
  totalBookings: number;

  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;

  totalSpent: number;

  payments: {
    paid: number;
    pending: number;
    failed: number;
  };

  bookings: unknown[];

  productHistory: unknown[];
}

export interface IUserOverviewStats {
  totalUsers: number;

  totalActiveUsers: number;
  totalInactiveUsers: number;
  totalBlockedUsers: number;

  newUsersLast7Days: number;
  newUsersLast30Days: number;

  usersByRole: unknown[];
}

export interface IProductStats {
  totalProducts: number;

  activeProducts: number;
  inactiveProducts: number;

  outOfStockProducts: number;
  lowStockProducts: number;

  totalStock: number;

  productsByCategory: unknown[];

  topProducts: unknown[];
}

export interface IBookingStats {
  totalBookings: number;

  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;

  bookingsLast7Days: number;
  bookingsLast30Days: number;

  uniqueCustomers: number;

  bookingsByStatus: unknown[];

  recentBookings: unknown[];
}

export interface IPaymentStats {
  totalPayments: number;

  paidPayments: number;
  pendingPayments: number;
  failedPayments: number;

  totalRevenue: number;

  averagePaymentAmount: number;

  paymentsByStatus: unknown[];
}