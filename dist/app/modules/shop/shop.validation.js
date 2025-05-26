"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const CreateShopSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Shop name is required'),
        branch_name: zod_1.z.string().optional(),
        type: zod_1.z.nativeEnum(client_1.ShopType),
        subscription_plan: zod_1.z.nativeEnum(client_1.SubscriptionPlan),
        subscription_end: zod_1.z.string().datetime('Invalid subscription end date'),
        admin_name: zod_1.z.string().min(1, 'Admin name is required'),
        admin_email: zod_1.z.string().email('Invalid email format'),
        admin_password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
const UpdateShopSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        branch_name: zod_1.z.string().optional(),
        type: zod_1.z.nativeEnum(client_1.ShopType).optional(),
        subscription_plan: zod_1.z.nativeEnum(client_1.SubscriptionPlan).optional(),
        subscription_end: zod_1.z.string().datetime().optional(),
        is_active: zod_1.z.boolean().optional(),
    }),
});
const UpdateSubscriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        subscription_plan: zod_1.z.nativeEnum(client_1.SubscriptionPlan),
        subscription_end: zod_1.z.string().datetime('Invalid subscription end date'),
    }),
});
const ShopValidation = {
    CreateShopSchema,
    UpdateShopSchema,
    UpdateSubscriptionSchema,
};
exports.default = ShopValidation;
