import httpStatus from 'http-status';
import { v4 as uuidv4 } from 'uuid';
import { Prisma, OrderStatus, PaymentType } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import { JwtPayload } from 'jsonwebtoken';

interface GetOrdersQuery extends IPaginationOptions {
  search?: string;
  status?: OrderStatus;
  payment_type?: PaymentType;
  date_from?: string;
  date_to?: string;
}

interface CreateOrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface CreateOrderPayload {
  payment_type: PaymentType;
  table_number?: string;
  note?: string;
  order_items: CreateOrderItem[];
}

const generateOrderNumber = (): string => {
  const uuid = uuidv4();
  const alphanumeric = uuid.replace(/[^a-z0-9]/gi, '');
  return alphanumeric.substring(0, 6).toUpperCase();
};

const GetOrders = async (query: GetOrdersQuery, userShopId?: string) => {
  const {
    search,
    status,
    payment_type,
    date_from,
    date_to,
    ...paginationOptions
  } = query;

  // Calculate pagination with your utility
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  // Build where clause for optimized filtering
  const whereClause: Prisma.OrderWhereInput = {
    shop_id: userShopId,
  };

  // Add search filter
  if (search) {
    whereClause.order_number = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Add status filter
  if (status) {
    whereClause.status = status;
  }

  // Add payment type filter
  if (payment_type) {
    whereClause.payment_type = payment_type;
  }

  // Add date range filter
  if (date_from || date_to) {
    whereClause.created_at = {};

    if (date_from) {
      whereClause.created_at.gte = new Date(`${date_from}T00:00:00.000Z`);
    }

    if (date_to) {
      whereClause.created_at.lte = new Date(`${date_to}T23:59:59.999Z`);
    }
  }

  // Build dynamic order by clause
  const orderBy: Prisma.OrderOrderByWithRelationInput[] = [];

  // Map sort_by to proper Prisma field
  const sortField = sort_by as keyof Prisma.OrderOrderByWithRelationInput;

  if (
    [
      'order_number',
      'total_amount',
      'status',
      'created_at',
      'updated_at',
    ].includes(sort_by)
  ) {
    orderBy.push({ [sortField]: sort_order as 'asc' | 'desc' });
  } else {
    // Default sorting: newest orders first
    orderBy.push({ created_at: 'desc' });
  }

  // Execute optimized queries in parallel
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        order_number: true,
        total_amount: true,
        status: true,
        created_at: true,
        payment_type: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.order.count({
      where: whereClause,
    }),
  ]);

  const meta = {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  };

  return { orders, meta };
};

const GetOrderById = async (id: string, userShopId?: string) => {
  const order = await prisma.order.findUnique({
    where: { id, shop_id: userShopId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      order_items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      receipt: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  return order;
};

const CreateOrder = async (
  payload: CreateOrderPayload,
  userId: string,
  user: JwtPayload,
) => {
  // Validate all products exist and are available
  const productIds = payload.order_items.map((item) => item.product_id);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      is_deleted: false,
      is_available: true,
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Some products are not available or do not exist',
    );
  }

  // Calculate total amount
  const totalAmount = payload.order_items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Generate unique order number
  let orderNumber = generateOrderNumber();
  let orderExists = await prisma.order.findUnique({
    where: { order_number: orderNumber },
  });

  // Ensure uniqueness
  while (orderExists) {
    orderNumber = generateOrderNumber();
    orderExists = await prisma.order.findUnique({
      where: { order_number: orderNumber },
    });
  }

  // Create order with order items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        order_number: orderNumber,
        total_amount: totalAmount,
        status: OrderStatus.OPEN,
        payment_type: payload.payment_type,
        note: payload.note,
        created_by: userId,
        shop_id: user.shop_id,
      },
    });

    // Create order items
    await tx.orderItem.createMany({
      data: payload.order_items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    return newOrder;
  });

  // Return order with details
  return await GetOrderById(order.id, user.shop_id);
};

const UpdateOrderStatus = async (
  id: string,
  status: OrderStatus,
  userShopId?: string,
) => {
  // Check if order exists
  const existingOrder = await prisma.order.findUnique({
    where: { id, shop_id: userShopId },
  });

  if (!existingOrder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Validate status transition
  if (existingOrder.status === OrderStatus.CANCELLED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot update status of a cancelled order',
    );
  }

  if (
    existingOrder.status === OrderStatus.PAID &&
    status === OrderStatus.OPEN
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot reopen a paid order');
  }

  const updatedOrder = await prisma.order.update({
    where: { id, shop_id: userShopId },
    data: { status },
  });

  return await GetOrderById(updatedOrder.id, userShopId);
};

const OrderService = {
  GetOrders,
  GetOrderById,
  CreateOrder,
  UpdateOrderStatus,
};

export default OrderService;
