import { z } from 'zod';

const UpdateSettingSchema = z.object({
  body: z
    .object({
      display_name: z
        .string({
          invalid_type_error: 'Display name must be a string',
        })
        .min(1, 'Display name cannot be empty')
        .max(100, 'Display name cannot exceed 100 characters')
        .optional(),
      shop_id: z
        .string({
          invalid_type_error: 'Shop ID must be a string',
        })
        .optional(),
      address: z
        .string({
          invalid_type_error: 'Address must be a string',
        })
        .min(1, 'Address cannot be empty')
        .max(500, 'Address cannot exceed 500 characters')
        .optional(),
      phone_number: z
        .string({
          invalid_type_error: 'Phone number must be a string',
        })
        .min(1, 'Phone number cannot be empty')
        .max(15, 'Phone number cannot exceed 15 characters')
        .optional(),
      email: z
        .string({
          invalid_type_error: 'Email must be a string',
        })
        .email('Invalid email format')
        .optional(),
      receipt_header_text: z
        .string({
          invalid_type_error: 'Receipt header text must be a string',
        })
        .max(200, 'Receipt header text cannot exceed 200 characters')
        .optional(),
      receipt_footer_text: z
        .string({
          invalid_type_error: 'Receipt footer text must be a string',
        })
        .max(200, 'Receipt footer text cannot exceed 200 characters')
        .optional(),
      show_logo_on_receipt: z.string().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      'At least one field must be provided for update',
    ),
});

const SettingValidation = {
  UpdateSettingSchema,
};

export default SettingValidation;
