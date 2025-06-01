"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const stats_controller_1 = __importDefault(require("./stats.controller"));
const router = express_1.default.Router();
// GET /api/v1/stats/summary - Get summary metrics
router.get('/summary', (0, auth_1.default)(client_1.Role.ADMIN), stats_controller_1.default.GetSummaryStats);
// GET /api/v1/stats/weekly-sales - Get weekly sales data
router.get('/weekly-sales', (0, auth_1.default)(client_1.Role.ADMIN), stats_controller_1.default.GetWeeklySales);
// GET /api/v1/stats/category-sales - Get sales by category
router.get('/category-sales', (0, auth_1.default)(client_1.Role.ADMIN), stats_controller_1.default.GetCategorySales);
// GET /api/v1/stats/super-admin - Get super admin dashboard stats
router.get('/super-admin', (0, auth_1.default)(client_1.Role.SUPER_ADMIN), stats_controller_1.default.GetSuperAdminStats);
// GET /api/v1/stats/recent-shops - Get recent shop registrations
router.get('/recent-shops', (0, auth_1.default)(client_1.Role.SUPER_ADMIN), stats_controller_1.default.GetRecentShopRegistrations);
exports.StatsRoutes = router;
