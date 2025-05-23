import { z } from 'zod';

const UpdateSettingSchema = z.object({
  body: z
    .object({
      restaurant_name: z
        .string({
          invalid_type_error: 'Restaurant name must be a string',
        })
        .min(1, 'Restaurant name cannot be empty')
        .max(100, 'Restaurant name cannot exceed 100 characters')
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
        .regex(/^[+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
        .optional(),
      email: z
        .string({
          invalid_type_error: 'Email must be a string',
        })
        .email('Invalid email format')
        .optional(),
      logo_url: z
        .string({
          invalid_type_error: 'Logo URL must be a string',
        })
        .url('Invalid URL format')
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
      show_logo_on_receipt: z
        .boolean({
          invalid_type_error: 'Show logo on receipt must be a boolean',
        })
        .optional(),
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
