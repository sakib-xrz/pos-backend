import { z } from 'zod';
import { OrderStatus, PaymentType } from '@prisma/client';

const CreateOrderItemSchema = z.object({
  product_id: z
    .string({
      required_error: 'Product ID is required',
      invalid_type_error: 'Product ID must be a string',
    })
    .uuid('Product ID must be a valid UUID'),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be an integer')
    .positive('Quantity must be positive'),
  price: z
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be positive'),
});

const CreateOrderSchema = z.object({
  body: z.object({
    payment_type: z.enum([PaymentType.CASH, PaymentType.CARD], {
      required_error: 'Payment type is required',
      invalid_type_error: 'Payment type must be either CASH or CARD',
    }),
    table_number: z
      .string({
        invalid_type_error: 'Table number must be a string',
      })
      .optional(),
    note: z
      .string({
        invalid_type_error: 'Note must be a string',
      })
      .optional(),
    order_items: z
      .array(CreateOrderItemSchema, {
        required_error: 'Order items are required',
        invalid_type_error: 'Order items must be an array',
      })
      .min(1, 'At least one order item is required'),
  }),
});

const UpdateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(
      [OrderStatus.OPEN, OrderStatus.PAID, OrderStatus.CANCELLED],
      {
        required_error: 'Status is required',
        invalid_type_error: 'Status must be OPEN, PAID, or CANCELLED',
      },
    ),
  }),
});

const OrderValidation = {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
};

export default OrderValidation;
