"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const product_validation_1 = __importDefault(require("./product.validation"));
const product_controller_1 = __importDefault(require("./product.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const handelFile_1 = require("../../utils/handelFile");
const router = express_1.default.Router();
// GET /api/products - Get products with filters, search, and pagination
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.STAFF), product_controller_1.default.GetProducts);
// POST /api/products - Create new product with image upload (Admin only)
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN), handelFile_1.upload.single('image'), // Handle single image upload
(0, validateRequest_1.default)(product_validation_1.default.CreateProductSchema), product_controller_1.default.CreateProduct);
// PATCH /api/products/:id - Update product with optional image upload (Admin only)
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN), handelFile_1.upload.single('image'), // Handle optional image upload
(0, validateRequest_1.default)(product_validation_1.default.UpdateProductSchema), product_controller_1.default.UpdateProduct);
// PATCH /api/products/:id/image - Update product image only (Admin only)
router.patch('/:id/image', (0, auth_1.default)(client_1.Role.ADMIN), handelFile_1.upload.single('image'), // Handle image upload
product_controller_1.default.UpdateProductImage);
// DELETE /api/products/:id/image - Delete product image only (Admin only)
router.delete('/:id/image', (0, auth_1.default)(client_1.Role.ADMIN), product_controller_1.default.DeleteProductImage);
// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN), product_controller_1.default.DeleteProduct);
// PATCH /api/products/:id/availability - Toggle availability (Admin only)
router.patch('/:id/availability', (0, auth_1.default)(client_1.Role.ADMIN), (0, validateRequest_1.default)(product_validation_1.default.ToggleAvailabilitySchema), product_controller_1.default.ToggleAvailability);
exports.ProductRoutes = router;
