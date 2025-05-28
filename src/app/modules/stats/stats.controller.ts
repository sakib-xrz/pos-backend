import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import StatsService from './stats.services';

const GetSummaryStats = catchAsync(async (req, res) => {
  const result = await StatsService.GetSummaryStats(req.user?.shop_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Summary statistics retrieved successfully',
    data: result,
  });
});

const GetWeeklySales = catchAsync(async (req, res) => {
  const result = await StatsService.GetWeeklySales(req.user?.shop_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Weekly sales data retrieved successfully',
    data: result,
  });
});

const GetCategorySales = catchAsync(async (req, res) => {
  const result = await StatsService.GetCategorySales(req.user?.shop_id);

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
