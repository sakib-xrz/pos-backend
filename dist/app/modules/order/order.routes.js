"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const order_validation_1 = __importDefault(require("./order.validation"));
const order_controller_1 = __importDefault(require("./order.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// GET /api/orders - Get orders with filters and pagination (Admin/Staff)
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.STAFF), order_controller_1.default.GetOrders);
// GET /api/orders/:id - Get order details (Admin/Staff)
router.get('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.STAFF), order_controller_1.default.GetOrderById);
// POST /api/orders - Create new order (Admin/Staff)
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.STAFF), (0, validateRequest_1.default)(order_validation_1.default.CreateOrderSchema), order_controller_1.default.CreateOrder);
// PATCH /api/orders/:id/status - Update order status (Admin/Staff)
router.patch('/:id/status', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.STAFF), (0, validateRequest_1.default)(order_validation_1.default.UpdateOrderStatusSchema), order_controller_1.default.UpdateOrderStatus);
exports.OrderRoutes = router;
