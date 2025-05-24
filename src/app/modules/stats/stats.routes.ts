import express from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import StatsController from './stats.controller';

const router = express.Router();

// GET /api/v1/stats/summary - Get summary metrics
router.get('/summary', auth(Role.ADMIN), StatsController.GetSummaryStats);

// GET /api/v1/stats/weekly-sales - Get weekly sales data
router.get('/weekly-sales', auth(Role.ADMIN), StatsController.GetWeeklySales);

// GET /api/v1/stats/category-sales - Get sales by category
router.get(
  '/category-sales',
  auth(Role.ADMIN),
  StatsController.GetCategorySales,
);

export const StatsRoutes = router;
