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
const prisma_1 = __importDefault(require("../../utils/prisma"));
// Get summary statistics
const GetSummaryStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    // Execute all queries in parallel for better performance
    const [thisMonthStats, lastMonthStats, activeStaffCount, lastMonthStaffCount,] = yield Promise.all([
        // This month's revenue and orders
        prisma_1.default.order.aggregate({
            where: {
                status: 'PAID',
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
        prisma_1.default.order.aggregate({
            where: {
                status: 'PAID',
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
        prisma_1.default.user.count({
            where: {
                is_deleted: false,
                role: 'STAFF',
                created_at: {
                    lte: now,
                },
            },
        }),
        // Staff count last month
        prisma_1.default.user.count({
            where: {
                is_deleted: false,
                role: 'STAFF',
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
    const revenueChange = lastMonthRevenue > 0
        ? Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : totalRevenue > 0
            ? 100
            : 0;
    const ordersChange = lastMonthOrders > 0
        ? Math.round(((totalOrders - lastMonthOrders) / lastMonthOrders) * 100)
        : totalOrders > 0
            ? 100
            : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const lastMonthAvgOrderValue = lastMonthOrders > 0 ? lastMonthRevenue / lastMonthOrders : 0;
    const avgOrderChange = lastMonthAvgOrderValue > 0
        ? Math.round(((averageOrderValue - lastMonthAvgOrderValue) /
            lastMonthAvgOrderValue) *
            100)
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
});
// Get weekly sales data for the current week
const GetWeeklySales = () => __awaiter(void 0, void 0, void 0, function* () {
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
    const dailySales = yield prisma_1.default.$queryRaw `
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
            total: Number((dayData === null || dayData === void 0 ? void 0 : dayData.total) || 0),
        };
    });
    return salesByDay;
});
// Get sales by category (pie chart data)
const GetCategorySales = () => __awaiter(void 0, void 0, void 0, function* () {
    const categorySales = yield prisma_1.default.$queryRaw `
    SELECT 
      c.name as category_name,
      COALESCE(SUM(oi.price * oi.quantity), 0) as total_sales
    FROM category c
    LEFT JOIN product p ON p.category_id = c.id AND p.is_deleted = false
    LEFT JOIN order_item oi ON oi.product_id = p.id
    LEFT JOIN "order" o ON o.id = oi.order_id AND o.status = 'PAID'
    WHERE c.is_deleted = false
    GROUP BY c.id, c.name
    ORDER BY total_sales DESC
  `;
    // Calculate total sales for percentage calculation
    const totalSales = categorySales.reduce((sum, category) => sum + Number(category.total_sales), 0);
    // Calculate percentages (will be 0 if totalSales is 0)
    const categoryPercentages = categorySales.map((category) => ({
        category: category.category_name,
        percentage: totalSales > 0
            ? Math.round((Number(category.total_sales) / totalSales) * 100)
            : 0,
    }));
    return categoryPercentages;
});
const StatsService = {
    GetSummaryStats,
    GetWeeklySales,
    GetCategorySales,
};
exports.default = StatsService;
