import prisma from '../../utils/prisma';

// Get summary statistics
const GetSummaryStats = async (userShopId?: string) => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  // Execute all queries in parallel for better performance
  const [
    thisMonthStats,
    lastMonthStats,
    activeStaffCount,
    lastMonthStaffCount,
  ] = await Promise.all([
    // This month's revenue and orders
    prisma.order.aggregate({
      where: {
        status: 'PAID',
        shop_id: userShopId,
        created_at: {
          gte: startOfThisMonth,
        },
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
    }),

    // Last month's revenue and orders
    prisma.order.aggregate({
      where: {
        status: 'PAID',
        shop_id: userShopId,
        created_at: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
    }),

    // Active staff count (this month)
    prisma.user.count({
      where: {
        is_deleted: false,
        role: 'STAFF',
        shop_id: userShopId,
        created_at: {
          lte: now,
        },
      },
    }),

    // Staff count last month
    prisma.user.count({
      where: {
        is_deleted: false,
        role: 'STAFF',
        shop_id: userShopId,
        created_at: {
          lte: endOfLastMonth,
        },
      },
    }),
  ]);

  // Calculate metrics
  const totalRevenue = Number(thisMonthStats._sum.total_amount || 0);
  const lastMonthRevenue = Number(lastMonthStats._sum.total_amount || 0);
  const totalOrders = thisMonthStats._count.id;
  const lastMonthOrders = lastMonthStats._count.id;

  // Calculate percentage changes
  const revenueChange =
    lastMonthRevenue > 0
      ? Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : totalRevenue > 0
        ? 100
        : 0;

  const ordersChange =
    lastMonthOrders > 0
      ? Math.round(((totalOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : totalOrders > 0
        ? 100
        : 0;

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const lastMonthAvgOrderValue =
    lastMonthOrders > 0 ? lastMonthRevenue / lastMonthOrders : 0;

  const avgOrderChange =
    lastMonthAvgOrderValue > 0
      ? Math.round(
          ((averageOrderValue - lastMonthAvgOrderValue) /
            lastMonthAvgOrderValue) *
            100,
        )
      : averageOrderValue > 0
        ? 100
        : 0;

  const staffChange = activeStaffCount - lastMonthStaffCount;

  return {
    total_revenue: totalRevenue,
    revenue_change: revenueChange,
    total_orders: totalOrders,
    orders_change: ordersChange,
    average_order_value: Math.round(averageOrderValue * 100) / 100,
    avg_order_change: avgOrderChange,
    active_staff: activeStaffCount,
    staff_change: staffChange,
  };
};

// Get weekly sales data for the current week
const GetWeeklySales = async (userShopId?: string) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
  startOfWeek.setDate(now.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Get daily sales for the current week
  const dailySales = await prisma.$queryRaw<
    { day_name: string; total: number }[]
  >`
    SELECT 
      CASE EXTRACT(DOW FROM created_at)
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 0 THEN 'Sunday'
      END as day_name,
      COALESCE(SUM(total_amount), 0) as total
    FROM "order"
    WHERE status = 'PAID'
      AND shop_id = ${userShopId}
      AND created_at >= ${startOfWeek}
      AND created_at <= ${endOfWeek}
    GROUP BY EXTRACT(DOW FROM created_at)
    ORDER BY EXTRACT(DOW FROM created_at)
  `;

  // Ensure all days are present
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const salesByDay = daysOfWeek.map((day) => {
    const dayData = dailySales.find((sale) => sale.day_name === day);
    return {
      day,
      total: Number(dayData?.total || 0),
    };
  });

  return salesByDay;
};

// Get sales by category (pie chart data)
const GetCategorySales = async (userShopId?: string) => {
  const categorySales = await prisma.$queryRaw<
    { category_name: string; total_sales: number }[]
  >`
    SELECT 
      c.name as category_name,
      COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN oi.price * oi.quantity ELSE 0 END), 0) as total_sales
    FROM category c
    LEFT JOIN product p ON p.category_id = c.id AND p.is_deleted = false
    LEFT JOIN order_item oi ON oi.product_id = p.id
    LEFT JOIN "order" o ON o.id = oi.order_id
    WHERE c.is_deleted = false
      AND c.shop_id = ${userShopId}
    GROUP BY c.id, c.name
    ORDER BY total_sales DESC
  `;

  // Calculate total sales for percentage calculation
  const totalSales = categorySales.reduce(
    (sum, category) => sum + Number(category.total_sales),
    0,
  );

  // Calculate percentages (will be 0 if totalSales is 0)
  const categoryPercentages = categorySales.map((category) => ({
    category: category.category_name,
    percentage:
      totalSales > 0
        ? Math.round((Number(category.total_sales) / totalSales) * 100)
        : 0,
  }));

  return categoryPercentages;
};

// Get super admin dashboard statistics
const GetSuperAdminStats = async () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  // Execute all queries in parallel
  const [
    totalShops,
    lastMonthShops,
    activeShops,
    totalUsers,
    lastMonthUsers,
    subscriptionStats,
  ] = await Promise.all([
    // Total shops count
    prisma.shop.count(),

    // Shops created last month
    prisma.shop.count({
      where: {
        created_at: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    }),

    // Active shops count
    prisma.shop.count({
      where: {
        is_active: true,
      },
    }),

    // Total users count (excluding SUPER_ADMIN)
    prisma.user.count({
      where: {
        is_deleted: false,
        role: {
          not: 'SUPER_ADMIN',
        },
      },
    }),

    // Users created last month
    prisma.user.count({
      where: {
        is_deleted: false,
        role: {
          not: 'SUPER_ADMIN',
        },
        created_at: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    }),

    prisma.shop.groupBy({
      by: ['subscription_plan'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    }),
  ]);

  const thisMonthShops = await prisma.shop.count({
    where: {
      created_at: {
        gte: startOfThisMonth,
      },
    },
  });

  const thisMonthUsers = await prisma.user.count({
    where: {
      is_deleted: false,
      role: {
        not: 'SUPER_ADMIN',
      },
      created_at: {
        gte: startOfThisMonth,
      },
    },
  });

  const shopsChange = thisMonthShops - lastMonthShops;
  const usersChange = thisMonthUsers - lastMonthUsers;
  const activeRate =
    totalShops > 0 ? Math.round((activeShops / totalShops) * 100) : 0;

  // Format subscription stats
  const subscriptionBreakdown = subscriptionStats.reduce(
    (acc, stat) => {
      acc[stat.subscription_plan] = stat._count.id;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total_shops: totalShops,
    shops_change: shopsChange,
    active_shops: activeShops,
    active_rate: activeRate,
    total_users: totalUsers,
    users_change: usersChange,
    subscription_breakdown: {
      ONE_MONTH: subscriptionBreakdown.ONE_MONTH || 0,
      SIX_MONTHS: subscriptionBreakdown.SIX_MONTHS || 0,
      ONE_YEAR: subscriptionBreakdown.ONE_YEAR || 0,
    },
  };
};

// Get recent shop registrations
const GetRecentShopRegistrations = async (limit: number = 5) => {
  const recentShops = await prisma.shop.findMany({
    select: {
      id: true,
      name: true,
      branch_name: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
  });

  // Format the response with relative time
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInWeeks === 1) {
      return '1 week ago';
    } else {
      return `${diffInWeeks} weeks ago`;
    }
  };

  return recentShops.map((shop) => ({
    id: shop.id,
    name: shop.name,
    branch_name: shop.branch_name,
    time_ago: formatTimeAgo(shop.created_at),
  }));
};

const StatsService = {
  GetSummaryStats,
  GetWeeklySales,
  GetCategorySales,
  GetSuperAdminStats,
  GetRecentShopRegistrations,
};

export default StatsService;
