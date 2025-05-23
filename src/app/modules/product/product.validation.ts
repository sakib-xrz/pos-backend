import { z } from 'zod';

const CreateProductSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Product name is required',
        invalid_type_error: 'Product name must be a string',
      })
      .min(1, 'Product name cannot be empty')
      .max(255, 'Product name cannot exceed 255 characters'),
    price: z
      .string({
        required_error: 'Price is required',
        invalid_type_error: 'Price must be a string',
      })
      .transform((val) => parseFloat(val))
      .refine((val) => val > 0, 'Price must be positive'),
    category_id: z
      .string({
        required_error: 'Category ID is required',
        invalid_type_error: 'Category ID must be a string',
      })
      .uuid('Category ID must be a valid UUID'),
    is_available: z
      .string({
        invalid_type_error: 'Availability must be a string',
      })
      .transform((val) => val === 'true')
      .optional()
      .default('true'),
  }),
});

const UpdateProductSchema = z.object({
  body: z.object({
    name: z
      .string({
        invalid_type_error: 'Product name must be a string',
      })
      .min(1, 'Product name cannot be empty')
      .max(255, 'Product name cannot exceed 255 characters')
      .optional(),
    price: z
      .string({
        invalid_type_error: 'Price must be a string',
      })
      .transform((val) => parseFloat(val))
      .refine((val) => val > 0, 'Price must be positive')
      .optional(),
    category_id: z
      .string({
        invalid_type_error: 'Category ID must be a string',
      })
      .uuid('Category ID must be a valid UUID')
      .optional(),
    is_available: z
      .string({
        invalid_type_error: 'Availability must be a string',
      })
      .transform((val) => val === 'true')
      .optional(),
  }),
});

const ToggleAvailabilitySchema = z.object({
  body: z.object({
    is_available: z.boolean({
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

export default ProductValidation;
