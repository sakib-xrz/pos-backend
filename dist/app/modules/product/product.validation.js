"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const CreateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            required_error: 'Product name is required',
            invalid_type_error: 'Product name must be a string',
        })
            .min(1, 'Product name cannot be empty')
            .max(255, 'Product name cannot exceed 255 characters'),
        price: zod_1.z
            .string({
            required_error: 'Price is required',
            invalid_type_error: 'Price must be a string',
        })
            .transform((val) => parseFloat(val))
            .refine((val) => val > 0, 'Price must be positive'),
        category_id: zod_1.z
            .string({
            required_error: 'Category ID is required',
            invalid_type_error: 'Category ID must be a string',
        })
            .uuid('Category ID must be a valid UUID'),
        is_available: zod_1.z
            .string({
            invalid_type_error: 'Availability must be a string',
        })
            .transform((val) => val === 'true')
            .optional()
            .default('true'),
    }),
});
const UpdateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            invalid_type_error: 'Product name must be a string',
        })
            .min(1, 'Product name cannot be empty')
            .max(255, 'Product name cannot exceed 255 characters')
            .optional(),
        price: zod_1.z
            .string({
            invalid_type_error: 'Price must be a string',
        })
            .transform((val) => parseFloat(val))
            .refine((val) => val > 0, 'Price must be positive')
            .optional(),
        category_id: zod_1.z
            .string({
            invalid_type_error: 'Category ID must be a string',
        })
            .uuid('Category ID must be a valid UUID')
            .optional(),
        is_available: zod_1.z
            .string({
            invalid_type_error: 'Availability must be a string',
        })
            .transform((val) => val === 'true')
            .optional(),
    }),
});
const ToggleAvailabilitySchema = zod_1.z.object({
    body: zod_1.z.object({
        is_available: zod_1.z.boolean({
            required_error: 'Availability status is required',
            invalid_type_error: 'Availability must be a boolean',
        }),
    }),
});
const ProductValidation = {
    CreateProductSchema,
    UpdateProductSchema,
    ToggleAvailabilitySchema,
};
exports.default = ProductValidation;
