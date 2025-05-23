"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const CreateOrderItemSchema = zod_1.z.object({
    product_id: zod_1.z
        .string({
        required_error: 'Product ID is required',
        invalid_type_error: 'Product ID must be a string',
    })
        .uuid('Product ID must be a valid UUID'),
    quantity: zod_1.z
        .number({
        required_error: 'Quantity is required',
        invalid_type_error: 'Quantity must be a number',
    })
        .int('Quantity must be an integer')
        .positive('Quantity must be positive'),
    price: zod_1.z
        .number({
        required_error: 'Price is required',
        invalid_type_error: 'Price must be a number',
    })
        .positive('Price must be positive'),
});
const CreateOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        payment_type: zod_1.z.enum([client_1.PaymentType.CASH, client_1.PaymentType.CARD], {
            required_error: 'Payment type is required',
            invalid_type_error: 'Payment type must be either CASH or CARD',
        }),
        table_number: zod_1.z
            .string({
            invalid_type_error: 'Table number must be a string',
        })
            .optional(),
        note: zod_1.z
            .string({
            invalid_type_error: 'Note must be a string',
        })
            .optional(),
        order_items: zod_1.z
            .array(CreateOrderItemSchema, {
            required_error: 'Order items are required',
            invalid_type_error: 'Order items must be an array',
        })
            .min(1, 'At least one order item is required'),
    }),
});
const UpdateOrderStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([client_1.OrderStatus.OPEN, client_1.OrderStatus.PAID, client_1.OrderStatus.CANCELLED], {
            required_error: 'Status is required',
            invalid_type_error: 'Status must be OPEN, PAID, or CANCELLED',
        }),
    }),
});
const OrderValidation = {
    CreateOrderSchema,
    UpdateOrderStatusSchema,
};
exports.default = OrderValidation;
