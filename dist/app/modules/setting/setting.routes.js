"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const setting_validation_1 = __importDefault(require("./setting.validation"));
const setting_controller_1 = __importDefault(require("./setting.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// GET /api/setting - Get current restaurant settings
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.STAFF), setting_controller_1.default.GetSetting);
// PUT /api/setting - Update restaurant settings (Admin only)
router.put('/', (0, auth_1.default)(client_1.Role.ADMIN), (0, validateRequest_1.default)(setting_validation_1.default.UpdateSettingSchema), setting_controller_1.default.UpdateSetting);
exports.SettingRoutes = router;
