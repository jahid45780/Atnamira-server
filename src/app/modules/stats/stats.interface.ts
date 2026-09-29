export interface IAdminStats {
  totalUsers: number;
  totalProducts: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  paidOrders: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  recentBookings: unknown[];
  recentUsers: unknown[];
  monthlyStats: {
    month: string;
    orders: number;
    revenue: number;
  }[];
}

export interface IUserStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  pendingPayments: number;
  totalSpent: number;
  recentOrders: unknown[];
}