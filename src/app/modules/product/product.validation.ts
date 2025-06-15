import { z } from 'zod';

const PharmacyProductDetailsSchema = z.object({
  dosage: z
    .string({
      invalid_type_error: 'Dosage must be a string',
    })
    .optional(),
  form: z
    .string({
      invalid_type_error: 'Form must be a string',
    })
    .optional(),
  pack_size: z
    .string({
      invalid_type_error: 'Pack size must be a string',
    })
    .optional(),
  manufacturer: z.string({
    required_error: 'Manufacturer is required',
    invalid_type_error: 'Manufacturer must be a string',
  }),
  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .optional(),
  discount: z
    .string({
      invalid_type_error: 'Discount must be a string',
    })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val), 'Discount must be a valid number')
    .refine((val) => val >= 0, 'Discount cannot be negative')
    .optional(),
  discount_type: z
    .enum(['PERCENTAGE', 'FIXED'], {
      invalid_type_error: 'Discount type must be either PERCENTAGE or FIXED',
    })
    .optional(),
  stock: z
    .string({
      invalid_type_error: 'Stock must be a string',
    })
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val), 'Stock must be a valid integer')
    .refine((val) => val >= 0, 'Stock cannot be negative')
    .optional(),
  in_stock: z
    .string({
      invalid_type_error: 'In stock must be a string',
    })
    .transform((val) => val === 'true')
    .optional(),
  expiry_date: z
    .string({
      invalid_type_error: 'Expiry date must be a string',
    })
    .transform((val) => new Date(val))
    .refine((val) => !isNaN(val.getTime()), 'Expiry date must be a valid date')
    .optional(),
});

const RestaurantProductDetailsSchema = z.object({
  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .optional(),
  preparation_time: z
    .string({
      invalid_type_error: 'Preparation time must be a string',
    })
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val), 'Preparation time must be a valid integer')
    .refine((val) => val >= 0, 'Preparation time cannot be negative')
    .optional(),
  is_vegetarian: z
    .string({
      invalid_type_error: 'Is vegetarian must be a string',
    })
    .transform((val) => val === 'true')
    .default('false'),
  is_vegan: z
    .string({
      invalid_type_error: 'Is vegan must be a string',
    })
    .transform((val) => val === 'true')
    .default('false'),
  is_spicy: z
    .string({
      invalid_type_error: 'Is spicy must be a string',
    })
    .transform((val) => val === 'true')
    .default('false'),
});

const CreateProductSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    }),
    price: z
      .string({
        required_error: 'Price is required',
        invalid_type_error: 'Price must be a string',
      })
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val), 'Price must be a valid number')
      .refine((val) => val > 0, 'Price must be positive'),
    category_id: z
      .string({
        required_error: 'Category ID is required',
        invalid_type_error: 'Category ID must be a string',
      })
      .uuid('Category ID must be a valid UUID'),
    barcode: z
      .string({
        invalid_type_error: 'Barcode must be a string',
      })
      .optional(),
    is_available: z
      .string({
        invalid_type_error: 'Is available must be a string',
      })
      .transform((val) => val === 'true')
      .default('true'),
    pharmacy_product_details: PharmacyProductDetailsSchema.optional(),
    restaurant_product_details: RestaurantProductDetailsSchema.optional(),
  }),
});

const UpdateProductSchema = z.object({
  body: z.object({
    name: z
      .string({
        invalid_type_error: 'Name must be a string',
      })
      .optional(),
    price: z
      .string({
        invalid_type_error: 'Price must be a string',
      })
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val), 'Price must be a valid number')
      .refine((val) => val > 0, 'Price must be positive')
      .optional(),
    category_id: z
      .string({
        invalid_type_error: 'Category ID must be a string',
      })
      .uuid('Category ID must be a valid UUID')
      .optional(),
    barcode: z
      .string({
        invalid_type_error: 'Barcode must be a string',
      })
      .optional(),
    is_available: z
      .string({
        invalid_type_error: 'Is available must be a string',
      })
      .transform((val) => val === 'true')
      .optional(),
    pharmacy_product_details: PharmacyProductDetailsSchema.optional(),
    restaurant_product_details: RestaurantProductDetailsSchema.optional(),
  }),
});

const ToggleAvailabilitySchema = z.object({
  body: z.object({
    is_available: z
      .string({
        required_error: 'Availability status is required',
        invalid_type_error: 'Availability must be a string',
      })
      .transform((val) => val === 'true'),
  }),
});

const ProductValidation = {
  CreateProductSchema,
  UpdateProductSchema,
  ToggleAvailabilitySchema,
};

export default ProductValidation;
