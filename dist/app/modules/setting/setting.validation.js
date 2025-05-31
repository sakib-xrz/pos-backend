"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const UpdateSettingSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        display_name: zod_1.z
            .string({
            invalid_type_error: 'Display name must be a string',
        })
            .min(1, 'Display name cannot be empty')
            .max(100, 'Display name cannot exceed 100 characters')
            .optional(),
        shop_id: zod_1.z
            .string({
            invalid_type_error: 'Shop ID must be a string',
        })
            .optional(),
        address: zod_1.z
            .string({
            invalid_type_error: 'Address must be a string',
        })
            .min(1, 'Address cannot be empty')
            .max(500, 'Address cannot exceed 500 characters')
            .optional(),
        phone_number: zod_1.z
            .string({
            invalid_type_error: 'Phone number must be a string',
        })
            .min(1, 'Phone number cannot be empty')
            .max(15, 'Phone number cannot exceed 15 characters')
            .optional(),
        email: zod_1.z
            .string({
            invalid_type_error: 'Email must be a string',
        })
            .email('Invalid email format')
            .optional(),
        receipt_header_text: zod_1.z
            .string({
            invalid_type_error: 'Receipt header text must be a string',
        })
            .max(200, 'Receipt header text cannot exceed 200 characters')
            .optional(),
        receipt_footer_text: zod_1.z
            .string({
            invalid_type_error: 'Receipt footer text must be a string',
        })
            .max(200, 'Receipt footer text cannot exceed 200 characters')
            .optional(),
        show_logo_on_receipt: zod_1.z.string().optional(),
    })
        .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update'),
});
const SettingValidation = {
    UpdateSettingSchema,
};
exports.default = SettingValidation;
