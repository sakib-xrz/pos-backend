"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const category_validation_1 = __importDefault(require("./category.validation"));
const category_controller_1 = __importDefault(require("./category.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const handelFile_1 = require("../../utils/handelFile");
const router = express_1.default.Router();
// GET /api/categories - Get categories with search and pagination
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.STAFF), category_controller_1.default.GetCategories);
// POST /api/categories - Create new category with image upload (Admin only)
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN), handelFile_1.upload.single('image'), // Handle single image upload
(0, validateRequest_1.default)(category_validation_1.default.CreateCategorySchema), category_controller_1.default.CreateCategory);
// PATCH /api/categories/:id - Update category with optional image upload (Admin only)
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN), handelFile_1.upload.single('image'), // Handle optional image upload
(0, validateRequest_1.default)(category_validation_1.default.UpdateCategorySchema), category_controller_1.default.UpdateCategory);
// PATCH /api/categories/:id/image - Update category image only (Admin only)
router.patch('/:id/image', (0, auth_1.default)(client_1.Role.ADMIN), handelFile_1.upload.single('image'), // Handle image upload
category_controller_1.default.UpdateCategoryImage);
// DELETE /api/categories/:id/image - Delete category image only (Admin only)
router.delete('/:id/image', (0, auth_1.default)(client_1.Role.ADMIN), category_controller_1.default.DeleteCategoryImage);
// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN), category_controller_1.default.DeleteCategory);
exports.CategoryRoutes = router;
