import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import SettingValidation from './setting.validation';
import SettingController from './setting.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { upload } from '../../utils/handelFile';

const router = express.Router();

// GET /api/setting - Get current restaurant settings
router.get('/', auth(Role.ADMIN, Role.STAFF), SettingController.GetSetting);

// PUT /api/setting - Update restaurant settings with optional logo upload (Admin only)
router.put(
  '/',
  auth(Role.ADMIN),
  upload.single('logo'), // Changed from 'image' to 'logo'
  validateRequest(SettingValidation.UpdateSettingSchema),
  SettingController.UpdateSetting,
);

export const SettingRoutes = router;
