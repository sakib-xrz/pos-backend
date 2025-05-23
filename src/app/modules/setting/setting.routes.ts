import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import SettingValidation from './setting.validation';
import SettingController from './setting.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// GET /api/setting - Get current restaurant settings
router.get('/', auth(Role.ADMIN, Role.STAFF), SettingController.GetSetting);

// PUT /api/setting - Update restaurant settings (Admin only)
router.put(
  '/',
  auth(Role.ADMIN),
  validateRequest(SettingValidation.UpdateSettingSchema),
  SettingController.UpdateSetting,
);

export const SettingRoutes = router;
