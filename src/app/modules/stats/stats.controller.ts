import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import StatsService from './stats.services';

const GetSummaryStats = catchAsync(async (_req, res) => {
  const result = await StatsService.GetSummaryStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Summary statistics retrieved successfully',
    data: result,
  });
});

const GetWeeklySales = catchAsync(async (_req, res) => {
  const result = await StatsService.GetWeeklySales();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Weekly sales data retrieved successfully',
    data: result,
  });
});

const GetCategorySales = catchAsync(async (_req, res) => {
  const result = await StatsService.GetCategorySales();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category sales data retrieved successfully',
    data: result,
  });
});

const StatsController = {
  GetSummaryStats,
  GetWeeklySales,
  GetCategorySales,
};

export default StatsController;
