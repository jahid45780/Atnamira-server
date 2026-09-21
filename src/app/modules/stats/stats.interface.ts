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



export interface IAdminBooking {
  _id: string;

  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;

  items: {
    product: string;
    name: string;
    image?: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
    subtotal?: number;
  }[];

  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
    country?: string;
  };

  totalAmount: number;

  paymentStatus:
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED";

  bookingStatus:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";

  stripeSessionId?: string;

  createdAt: Date;
  updatedAt: Date;
}



 export interface IGetOrdersParams {
  page: number;
  limit: number;
}

 export interface IGetOrdersResult {
  data: IAdminBooking[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}



