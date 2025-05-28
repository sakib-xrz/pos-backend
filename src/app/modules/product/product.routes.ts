import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import ProductValidation from './product.validation';
import ProductController from './product.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { upload } from '../../utils/handelFile';

const router = express.Router();

// GET /api/products - Get products with filters, search, and pagination
router.get('/', auth(Role.ADMIN, Role.STAFF), ProductController.GetProducts);

// POST /api/products - Create new product with image upload (Admin only)
router.post(
  '/',
  auth(Role.ADMIN),
  upload.single('image'), // Handle single image upload
  validateRequest(ProductValidation.CreateProductSchema),
  ProductController.CreateProduct,
);

// PATCH /api/products/:id - Update product with optional image upload (Admin only)
router.patch(
  '/:id',
  auth(Role.ADMIN),
  upload.single('image'), // Handle optional image upload
  validateRequest(ProductValidation.UpdateProductSchema),
  ProductController.UpdateProduct,
);

// PATCH /api/products/:id/image - Update product image only (Admin only)
router.patch(
  '/:id/image',
  auth(Role.ADMIN),
  upload.single('image'), // Handle image upload
  ProductController.UpdateProductImage,
);

// DELETE /api/products/:id/image - Delete product image only (Admin only)
router.delete(
  '/:id/image',
  auth(Role.ADMIN),
  ProductController.DeleteProductImage,
);

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', auth(Role.ADMIN), ProductController.DeleteProduct);

// PATCH /api/products/:id/availability - Toggle availability (Admin only)
router.patch(
  '/:id/availability',
  auth(Role.ADMIN),
  validateRequest(ProductValidation.ToggleAvailabilitySchema),
  ProductController.ToggleAvailability,
);

export const ProductRoutes = router;
