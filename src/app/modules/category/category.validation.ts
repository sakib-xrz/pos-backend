import { z } from 'zod';

const CreateCategorySchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Category name is required',
        invalid_type_error: 'Category name must be a string',
      })
      .min(1, 'Category name cannot be empty')
      .max(255, 'Category name cannot exceed 255 characters'),
  }),
});

const UpdateCategorySchema = z.object({
  body: z.object({
    name: z
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

export default CategoryValidation;
