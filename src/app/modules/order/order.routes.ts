import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import OrderValidation from './order.validation';
import OrderController from './order.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// GET /api/orders - Get orders with filters and pagination (Admin/Staff)
router.get('/', auth(Role.ADMIN, Role.STAFF), OrderController.GetOrders);

// GET /api/orders/:id - Get order details (Admin/Staff)
router.get('/:id', auth(Role.ADMIN, Role.STAFF), OrderController.GetOrderById);

// POST /api/orders - Create new order (Admin/Staff)
router.post(
  '/',
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(OrderValidation.CreateOrderSchema),
  OrderController.CreateOrder,
);

// PATCH /api/orders/:id/status - Update order status (Admin/Staff)
router.patch(
  '/:id/status',
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(OrderValidation.UpdateOrderStatusSchema),
  OrderController.UpdateOrderStatus,
);

export const OrderRoutes = router;
