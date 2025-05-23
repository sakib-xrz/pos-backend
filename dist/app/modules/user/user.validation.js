"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const CreateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be a string',
        })
            .min(1, 'Name cannot be empty')
            .max(255, 'Name cannot exceed 255 characters'),
        email: zod_1.z
            .string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be a string',
        })
            .email('Invalid email format'),
        password: zod_1.z
            .string({
            required_error: 'Password is required',
            invalid_type_error: 'Password must be a string',
        })
            .min(6, 'Password must be at least 6 characters long'),
        role: zod_1.z.enum([client_1.Role.ADMIN, client_1.Role.STAFF], {
            required_error: 'Role is required',
            invalid_type_error: 'Role must be either ADMIN or STAFF',
        }),
    }),
});
const UpdateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            invalid_type_error: 'Name must be a string',
        })
            .min(1, 'Name cannot be empty')
            .max(255, 'Name cannot exceed 255 characters')
            .optional(),
        email: zod_1.z
            .string({
            invalid_type_error: 'Email must be a string',
        })
            .email('Invalid email format')
            .optional(),
        role: zod_1.z
            .enum([client_1.Role.ADMIN, client_1.Role.STAFF], {
            invalid_type_error: 'Role must be either ADMIN or STAFF',
        })
            .optional(),
    }),
});
const ResetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        new_password: zod_1.z
            .string({
            required_error: 'New password is required',
            invalid_type_error: 'New password must be a string',
        })
            .min(6, 'Password must be at least 6 characters long'),
    }),
});
const UserValidation = {
    CreateUserSchema,
    UpdateUserSchema,
    ResetPasswordSchema,
};
exports.default = UserValidation;
