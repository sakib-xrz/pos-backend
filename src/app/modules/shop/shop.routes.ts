import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import ShopValidation from './shop.validation';
import ShopController from './shop.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// Super admin only routes
router.get('/', auth(Role.SUPER_ADMIN), ShopController.GetShops);
router.get('/:id', auth(Role.SUPER_ADMIN), ShopController.GetShopById);
router.post(
  '/',
  auth(Role.SUPER_ADMIN),
  validateRequest(ShopValidation.CreateShopSchema),
  ShopController.CreateShop,
);
router.patch(
  '/:id',
  auth(Role.SUPER_ADMIN),
  validateRequest(ShopValidation.UpdateShopSchema),
  ShopController.UpdateShop,
);
router.patch(
  '/:id/subscription',
  auth(Role.SUPER_ADMIN),
  validateRequest(ShopValidation.UpdateSubscriptionSchema),
  ShopController.UpdateSubscription,
);
router.delete('/:id', auth(Role.SUPER_ADMIN), ShopController.DeleteShop);

export const ShopRoutes = router;
