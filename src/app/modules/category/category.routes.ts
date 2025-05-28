import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import CategoryValidation from './category.validation';
import CategoryController from './category.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { upload } from '../../utils/handelFile';

const router = express.Router();

// GET /api/categories - Get categories with search and pagination
router.get('/', auth(Role.ADMIN, Role.STAFF), CategoryController.GetCategories);

// POST /api/categories - Create new category with image upload (Admin only)
router.post(
  '/',
  auth(Role.ADMIN),
  upload.single('image'), // Handle single image upload
  validateRequest(CategoryValidation.CreateCategorySchema),
  CategoryController.CreateCategory,
);

// PATCH /api/categories/:id - Update category with optional image upload (Admin only)
router.patch(
  '/:id',
  auth(Role.ADMIN),
  upload.single('image'), // Handle optional image upload
  validateRequest(CategoryValidation.UpdateCategorySchema),
  CategoryController.UpdateCategory,
);

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', auth(Role.ADMIN), CategoryController.DeleteCategory);

export const CategoryRoutes = router;
