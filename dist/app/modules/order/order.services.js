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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const pagination_1 = __importDefault(require("../../utils/pagination"));
const generateOrderNumber = () => {
    const uuid = (0, uuid_1.v4)();
    const alphanumeric = uuid.replace(/[^a-z0-9]/gi, '');
    return alphanumeric.substring(0, 6).toUpperCase();
};
const GetOrders = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, payment_type, date_from, date_to } = query, paginationOptions = __rest(query, ["status", "payment_type", "date_from", "date_to"]);
    // Calculate pagination with your utility
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    // Build where clause for optimized filtering
    const whereClause = {};
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
    const orderBy = [];
    // Map sort_by to proper Prisma field
    const sortField = sort_by;
    if ([
        'order_number',
        'total_amount',
        'status',
        'created_at',
        'updated_at',
    ].includes(sort_by)) {
        orderBy.push({ [sortField]: sort_order });
    }
    else {
        // Default sorting: newest orders first
        orderBy.push({ created_at: 'desc' });
    }
    // Execute optimized queries in parallel
    const [orders, total] = yield Promise.all([
        prisma_1.default.order.findMany({
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
        prisma_1.default.order.count({
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
});
const GetOrderById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield prisma_1.default.order.findUnique({
        where: { id },
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    return order;
});
const CreateOrder = (payload, userId, user) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate all products exist and are available
    const productIds = payload.order_items.map((item) => item.product_id);
    const products = yield prisma_1.default.product.findMany({
        where: {
            id: { in: productIds },
            is_deleted: false,
            is_available: true,
        },
    });
    if (products.length !== productIds.length) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Some products are not available or do not exist');
    }
    // Calculate total amount
    const totalAmount = payload.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Generate unique order number
    let orderNumber = generateOrderNumber();
    let orderExists = yield prisma_1.default.order.findUnique({
        where: { order_number: orderNumber },
    });
    // Ensure uniqueness
    while (orderExists) {
        orderNumber = generateOrderNumber();
        orderExists = yield prisma_1.default.order.findUnique({
            where: { order_number: orderNumber },
        });
    }
    // Create order with order items in a transaction
    const order = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const newOrder = yield tx.order.create({
            data: {
                order_number: orderNumber,
                total_amount: totalAmount,
                status: client_1.OrderStatus.OPEN,
                payment_type: payload.payment_type,
                note: payload.note,
                created_by: userId,
                shop_id: user.shop_id,
            },
        });
        // Create order items
        yield tx.orderItem.createMany({
            data: payload.order_items.map((item) => ({
                order_id: newOrder.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })),
        });
        return newOrder;
    }));
    // Return order with details
    return yield GetOrderById(order.id);
});
const UpdateOrderStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if order exists
    const existingOrder = yield prisma_1.default.order.findUnique({
        where: { id },
    });
    if (!existingOrder) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    // Validate status transition
    if (existingOrder.status === client_1.OrderStatus.CANCELLED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot update status of a cancelled order');
    }
    if (existingOrder.status === client_1.OrderStatus.PAID &&
        status === client_1.OrderStatus.OPEN) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot reopen a paid order');
    }
    const updatedOrder = yield prisma_1.default.order.update({
        where: { id },
        data: { status },
    });
    return yield GetOrderById(updatedOrder.id);
});
const OrderService = {
    GetOrders,
    GetOrderById,
    CreateOrder,
    UpdateOrderStatus,
};
exports.default = OrderService;
