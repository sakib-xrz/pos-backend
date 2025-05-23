import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import UserValidation from './user.validation';
import UserController from './user.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// GET /api/users - Get users with search, role filter, and pagination (Admin only)
router.get('/', auth(Role.ADMIN), UserController.GetUsers);

// POST /api/users - Create new user (Admin only)
router.post(
  '/',
  auth(Role.ADMIN),
  validateRequest(UserValidation.CreateUserSchema),
  UserController.CreateUser,
);

// PATCH /api/users/:id - Update user details (Admin only)
router.patch(
  '/:id',
  auth(Role.ADMIN),
  validateRequest(UserValidation.UpdateUserSchema),
  UserController.UpdateUser,
);

// PATCH /api/users/:id/password - Reset user password (Admin only)
router.patch(
  '/:id/password',
  auth(Role.ADMIN),
  validateRequest(UserValidation.ResetPasswordSchema),
  UserController.ResetPassword,
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', auth(Role.ADMIN), UserController.DeleteUser);

export const UserRoutes = router;
