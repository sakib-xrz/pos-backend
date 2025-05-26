import { z } from 'zod';
import { ShopType, SubscriptionPlan } from '@prisma/client';

const CreateShopSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Shop name is required'),
    branch_name: z.string().optional(),
    type: z.nativeEnum(ShopType),
    subscription_plan: z.nativeEnum(SubscriptionPlan),
    subscription_end: z.string().datetime('Invalid subscription end date'),
    admin_name: z.string().min(1, 'Admin name is required'),
    admin_email: z.string().email('Invalid email format'),
    admin_password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const UpdateShopSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    branch_name: z.string().optional(),
    type: z.nativeEnum(ShopType).optional(),
    subscription_plan: z.nativeEnum(SubscriptionPlan).optional(),
    subscription_end: z.string().datetime().optional(),
    is_active: z.boolean().optional(),
  }),
});

const UpdateSubscriptionSchema = z.object({
  body: z.object({
    subscription_plan: z.nativeEnum(SubscriptionPlan),
    subscription_end: z.string().datetime('Invalid subscription end date'),
  }),
});

const ShopValidation = {
  CreateShopSchema,
  UpdateShopSchema,
  UpdateSubscriptionSchema,
};

export default ShopValidation;
