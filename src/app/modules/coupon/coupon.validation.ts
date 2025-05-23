import { z } from 'zod';
import { CouponType } from '@prisma/client';

const CreateCouponSchema = z.object({
  body: z.object({
    code: z
      .string({
        required_error: 'Coupon code is required',
        invalid_type_error: 'Coupon code must be a string',
      })
      .min(3, 'Coupon code must be at least 3 characters long')
      .max(20, 'Coupon code cannot exceed 20 characters')
      .regex(
        /^[A-Z0-9-_]+$/,
        'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores',
      ),
    type: z.enum([CouponType.PERCENTAGE, CouponType.FIXED], {
      required_error: 'Coupon type is required',
      invalid_type_error: 'Coupon type must be either PERCENTAGE or FIXED',
    }),
    value: z
      .number({
        required_error: 'Coupon value is required',
        invalid_type_error: 'Coupon value must be a number',
      })
      .positive('Coupon value must be positive')
      .refine((value, ctx) => {
        if (ctx.parent.type === 'PERCENTAGE' && value > 100) {
          return false;
        }
        return true;
      }, 'Percentage value cannot exceed 100'),
    expires_at: z
      .string({
        invalid_type_error: 'Expiry date must be a string',
      })
      .datetime('Invalid date format')
      .transform((dateString) => new Date(dateString))
      .refine((date) => date > new Date(), 'Expiry date must be in the future')
      .optional(),
    is_active: z
      .boolean({
        invalid_type_error: 'Active status must be a boolean',
      })
      .optional()
      .default(true),
  }),
});

const UpdateCouponSchema = z.object({
  body: z.object({
    code: z
      .string({
        invalid_type_error: 'Coupon code must be a string',
      })
      .min(3, 'Coupon code must be at least 3 characters long')
      .max(20, 'Coupon code cannot exceed 20 characters')
      .regex(
        /^[A-Z0-9-_]+$/,
        'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores',
      )
      .optional(),
    type: z
      .enum([CouponType.PERCENTAGE, CouponType.FIXED], {
        invalid_type_error: 'Coupon type must be either PERCENTAGE or FIXED',
      })
      .optional(),
    value: z
      .number({
        invalid_type_error: 'Coupon value must be a number',
      })
      .positive('Coupon value must be positive')
      .refine((value, ctx) => {
        if (ctx.parent.type === 'PERCENTAGE' && value > 100) {
          return false;
        }
        return true;
      }, 'Percentage value cannot exceed 100')
      .optional(),
    expires_at: z
      .string({
        invalid_type_error: 'Expiry date must be a string',
      })
      .datetime('Invalid date format')
      .transform((dateString) => new Date(dateString))
      .refine((date) => date > new Date(), 'Expiry date must be in the future')
      .optional(),
    is_active: z
      .boolean({
        invalid_type_error: 'Active status must be a boolean',
      })
      .optional(),
  }),
});

const ToggleCouponStatusSchema = z.object({
  body: z.object({
    is_active: z.boolean({
      required_error: 'Active status is required',
      invalid_type_error: 'Active status must be a boolean',
    }),
  }),
});

const ValidateCouponSchema = z.object({
  body: z.object({
    code: z
      .string({
        required_error: 'Coupon code is required',
        invalid_type_error: 'Coupon code must be a string',
      })
      .min(1, 'Coupon code cannot be empty'),
  }),
});

const CouponValidation = {
  CreateCouponSchema,
  UpdateCouponSchema,
  ToggleCouponStatusSchema,
  ValidateCouponSchema,
};

export default CouponValidation;
