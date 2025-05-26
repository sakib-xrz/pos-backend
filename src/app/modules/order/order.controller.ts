import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import OrderService from './order.services';

const GetOrders = catchAsync(async (req, res) => {
  const result = await OrderService.GetOrders(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.orders,
  });
});

const GetOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderService.GetOrderById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const CreateOrder = catchAsync(async (req, res) => {
  const result = await OrderService.CreateOrder(
    req.body,
    req.user.id,
    req.user,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Order created successfully',
    data: result,
  });
});

const UpdateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await OrderService.UpdateOrderStatus(id, status);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order status updated successfully',
    data: result,
  });
});

const OrderController = {
  GetOrders,
  GetOrderById,
  CreateOrder,
  UpdateOrderStatus,
};

export default OrderController;
