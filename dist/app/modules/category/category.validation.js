"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const CreateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            required_error: 'Category name is required',
            invalid_type_error: 'Category name must be a string',
        })
            .min(1, 'Category name cannot be empty')
            .max(255, 'Category name cannot exceed 255 characters'),
    }),
});
const UpdateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            invalid_type_error: 'Category name must be a string',
        })
            .min(1, 'Category name cannot be empty')
            .max(255, 'Category name cannot exceed 255 characters')
            .optional(),
    }),
});
const CategoryValidation = {
    CreateCategorySchema,
    UpdateCategorySchema,
};
exports.default = CategoryValidation;
