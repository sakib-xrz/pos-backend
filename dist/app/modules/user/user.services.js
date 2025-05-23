"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const pagination_1 = __importDefault(require("../../utils/pagination"));
const config_1 = __importDefault(require("../../config"));
const GetUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, role } = query, paginationOptions = __rest(query, ["search", "role"]);
    // Calculate pagination with your utility
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    // Build where clause for optimized filtering
    const whereClause = {
        is_deleted: false,
    };
    // Add search filter (searches in name and email)
    if (search) {
        whereClause.OR = [
            {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
            {
                email: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
        ];
    }
    // Add role filter
    if (role) {
        whereClause.role = role;
    }
    // Build dynamic order by clause
    const orderBy = [];
    // Map sort_by to proper Prisma field
    const sortField = sort_by;
    if (['name', 'email', 'role', 'created_at', 'updated_at'].includes(sort_by)) {
        orderBy.push({ [sortField]: sort_order });
    }
    else {
        // Default sorting: by creation date (newest first)
        orderBy.push({ created_at: 'desc' });
    }
    // Execute optimized queries in parallel
    const [users, total] = yield Promise.all([
        prisma_1.default.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true,
                _count: {
                    select: {
                        orders: true,
                        receipts: true,
                    },
                },
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma_1.default.user.count({
            where: whereClause,
        }),
    ]);
    // Transform the response to include counts
    const usersWithCounts = users.map((user) => (Object.assign(Object.assign({}, user), { total_orders: user._count.orders, total_receipts: user._count.receipts, _count: undefined })));
    const meta = {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
    };
    return { users: usersWithCounts, meta };
});
const CreateUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user with same email already exists
    const existingUser = yield prisma_1.default.user.findFirst({
        where: {
            email: {
                equals: payload.email,
                mode: 'insensitive',
            },
            is_deleted: false,
        },
    });
    if (existingUser) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'User with this email already exists');
    }
    // Hash password
    const hashedPassword = yield bcrypt_1.default.hash(payload.password, Number(config_1.default.bcrypt_salt_rounds));
    const user = yield prisma_1.default.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            role: payload.role,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            created_at: true,
            updated_at: true,
        },
    });
    return user;
});
const UpdateUser = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists and is not deleted
    const existingUser = yield prisma_1.default.user.findFirst({
        where: {
            id,
            is_deleted: false,
        },
    });
    if (!existingUser) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found or has been deleted');
    }
    // Check if another user with same email exists (if email is being updated)
    if (payload.email) {
        const userWithSameEmail = yield prisma_1.default.user.findFirst({
            where: {
                email: {
                    equals: payload.email,
                    mode: 'insensitive',
                },
                id: {
                    not: id, // Exclude current user
                },
                is_deleted: false,
            },
        });
        if (userWithSameEmail) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, 'User with this email already exists');
        }
    }
    const updatedUser = yield prisma_1.default.user.update({
        where: { id },
        data: payload,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            created_at: true,
            updated_at: true,
        },
    });
    return updatedUser;
});
const ResetPassword = (id, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists and is not deleted
    const existingUser = yield prisma_1.default.user.findFirst({
        where: {
            id,
            is_deleted: false,
        },
    });
    if (!existingUser) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found or has been deleted');
    }
    // Hash new password
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    yield prisma_1.default.user.update({
        where: { id },
        data: {
            password: hashedPassword,
        },
    });
});
const DeleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists and is not already deleted
    const existingUser = yield prisma_1.default.user.findFirst({
        where: {
            id,
            is_deleted: false,
        },
    });
    if (!existingUser) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found or already deleted');
    }
    // Check if user has any orders (prevent deletion if referenced)
    const orderCount = yield prisma_1.default.order.count({
        where: {
            created_by: id,
        },
    });
    if (orderCount > 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot delete user who has created ${orderCount} order(s). Consider deactivating instead.`);
    }
    // Soft delete the user
    yield prisma_1.default.user.update({
        where: { id },
        data: {
            is_deleted: true,
        },
    });
});
const UserService = {
    GetUsers,
    CreateUser,
    UpdateUser,
    ResetPassword,
    DeleteUser,
};
exports.default = UserService;
