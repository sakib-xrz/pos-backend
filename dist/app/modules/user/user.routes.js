"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_validation_1 = __importDefault(require("./user.validation"));
const user_controller_1 = __importDefault(require("./user.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// GET /api/users - Get users with search, role filter, and pagination (Admin only)
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN), user_controller_1.default.GetUsers);
// POST /api/users - Create new user (Admin only)
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN), (0, validateRequest_1.default)(user_validation_1.default.CreateUserSchema), user_controller_1.default.CreateUser);
// PATCH /api/users/:id - Update user details (Admin only)
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN), (0, validateRequest_1.default)(user_validation_1.default.UpdateUserSchema), user_controller_1.default.UpdateUser);
// PATCH /api/users/:id/password - Reset user password (Admin only)
router.patch('/:id/password', (0, auth_1.default)(client_1.Role.ADMIN), (0, validateRequest_1.default)(user_validation_1.default.ResetPasswordSchema), user_controller_1.default.ResetPassword);
// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN), user_controller_1.default.DeleteUser);
exports.UserRoutes = router;
