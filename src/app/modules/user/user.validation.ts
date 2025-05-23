import { z } from 'zod';
import { Role } from '@prisma/client';

const CreateUserSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string',
      })
      .min(1, 'Name cannot be empty')
      .max(255, 'Name cannot exceed 255 characters'),
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format'),
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string',
      })
      .min(6, 'Password must be at least 6 characters long'),
    role: z.enum([Role.ADMIN, Role.STAFF], {
      required_error: 'Role is required',
      invalid_type_error: 'Role must be either ADMIN or STAFF',
    }),
  }),
});

const UpdateUserSchema = z.object({
  body: z.object({
    name: z
      .string({
        invalid_type_error: 'Name must be a string',
      })
      .min(1, 'Name cannot be empty')
      .max(255, 'Name cannot exceed 255 characters')
      .optional(),
    email: z
      .string({
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format')
      .optional(),
    role: z
      .enum([Role.ADMIN, Role.STAFF], {
        invalid_type_error: 'Role must be either ADMIN or STAFF',
      })
      .optional(),
  }),
});

const ResetPasswordSchema = z.object({
  body: z.object({
    new_password: z
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

export default UserValidation;
