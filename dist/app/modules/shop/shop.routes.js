"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const shop_validation_1 = __importDefault(require("./shop.validation"));
const shop_controller_1 = __importDefault(require("./shop.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// Super admin only routes
router.get('/', (0, auth_1.default)(client_1.Role.SUPER_ADMIN), shop_controller_1.default.GetShops);
router.get('/:id', (0, auth_1.default)(client_1.Role.SUPER_ADMIN), shop_controller_1.default.GetShopById);
router.post('/', (0, auth_1.default)(client_1.Role.SUPER_ADMIN), (0, validateRequest_1.default)(shop_validation_1.default.CreateShopSchema), shop_controller_1.default.CreateShop);
router.patch('/:id', (0, auth_1.default)(client_1.Role.SUPER_ADMIN), (0, validateRequest_1.default)(shop_validation_1.default.UpdateShopSchema), shop_controller_1.default.UpdateShop);
router.patch('/:id/subscription', (0, auth_1.default)(client_1.Role.SUPER_ADMIN), (0, validateRequest_1.default)(shop_validation_1.default.UpdateSubscriptionSchema), shop_controller_1.default.UpdateSubscription);
router.delete('/:id', (0, auth_1.default)(client_1.Role.SUPER_ADMIN), shop_controller_1.default.DeleteShop);
exports.ShopRoutes = router;
