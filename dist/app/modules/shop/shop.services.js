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
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const pagination_1 = __importDefault(require("../../utils/pagination"));
const config_1 = __importDefault(require("../../config"));
const GetShops = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, type, subscription_plan, is_active } = query, paginationOptions = __rest(query, ["search", "type", "subscription_plan", "is_active"]);
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const whereClause = {};
    // Search filter
    if (search) {
        whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { branch_name: { contains: search, mode: 'insensitive' } },
        ];
    }
    // Type filter
    if (type) {
        whereClause.type = type;
    }
    // Subscription plan filter
    if (subscription_plan) {
        whereClause.subscription_plan = subscription_plan;
    }
    // Active status filter
    if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true' ? true : false;
    }
    const orderBy = [];
    const sortField = sort_by;
    if ([
        'name',
        'type',
        'subscription_plan',
        'subscription_end',
        'created_at',
    ].includes(sort_by)) {
        orderBy.push({ [sortField]: sort_order });
    }
    else {
        orderBy.push({ created_at: 'desc' });
    }
    const [shops, total] = yield Promise.all([
        prisma_1.default.shop.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: {
                        users: true,
                        products: true,
                        orders: true,
                        categories: true,
                    },
                },
                users: {
                    where: { role: 'ADMIN' },
                    select: { id: true, name: true, email: true },
                    take: 1,
                },
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma_1.default.shop.count({ where: whereClause }),
    ]);
    // Add subscription status to each shop
    const shopsWithStatus = shops.map((shop) => {
        const now = new Date();
        const subscriptionEnd = new Date(shop.subscription_end);
        const isExpired = subscriptionEnd <= now;
        const isExpiringSoon = !isExpired &&
            subscriptionEnd <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return Object.assign(Object.assign({}, shop), { subscription_status: isExpired
                ? 'expired'
                : isExpiringSoon
                    ? 'expiring_soon'
                    : 'active', admin: shop.users[0] || null, users: undefined });
    });
    const meta = {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
    };
    return { shops: shopsWithStatus, meta };
});
const GetShopById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const shop = yield prisma_1.default.shop.findUnique({
        where: { id },
        include: {
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    created_at: true,
                },
            },
            settings: true,
            _count: {
                select: {
                    users: true,
                    products: true,
                    orders: true,
                    categories: true,
                },
            },
        },
    });
    if (!shop) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shop not found');
    }
    const now = new Date();
    const subscriptionEnd = new Date(shop.subscription_end);
    const isExpired = subscriptionEnd <= now;
    const isExpiringSoon = !isExpired &&
        subscriptionEnd <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return Object.assign(Object.assign({}, shop), { subscription_status: isExpired
            ? 'expired'
            : isExpiringSoon
                ? 'expiring_soon'
                : 'active' });
});
const CreateShop = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if admin email already exists
    const existingUser = yield prisma_1.default.user.findFirst({
        where: {
            email: { equals: payload.admin_email, mode: 'insensitive' },
            is_deleted: false,
        },
    });
    if (existingUser) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'Admin email already exists');
    }
    // Start transaction
    const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // set subscription_end based on subscription_plan
        const subscriptionEnd = new Date();
        if (payload.subscription_plan === client_1.SubscriptionPlan.ONE_MONTH) {
            subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
        }
        else if (payload.subscription_plan === client_1.SubscriptionPlan.SIX_MONTHS) {
            subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6);
        }
        else if (payload.subscription_plan === client_1.SubscriptionPlan.ONE_YEAR) {
            subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
        }
        // Create shop
        const shop = yield tx.shop.create({
            data: {
                name: payload.name,
                branch_name: payload.branch_name,
                type: payload.type,
                subscription_plan: payload.subscription_plan,
                subscription_end: subscriptionEnd,
            },
        });
        // Hash admin password
        const hashedPassword = yield bcrypt_1.default.hash(payload.admin_password, Number(config_1.default.bcrypt_salt_rounds));
        // Create admin user
        const admin = yield tx.user.create({
            data: {
                name: payload.admin_name,
                email: payload.admin_email,
                password: hashedPassword,
                role: 'ADMIN',
                shop_id: shop.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
            },
        });
        // Create default settings
        yield tx.setting.create({
            data: {
                shop_id: shop.id,
                display_name: payload.name,
                email: payload.admin_email,
                receipt_header_text: `Welcome to ${payload.name}`,
                receipt_footer_text: 'Thank you for your business!',
            },
        });
        return { shop, admin };
    }));
    return result;
});
const UpdateShop = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingShop = yield prisma_1.default.shop.findUnique({
        where: { id },
    });
    if (!existingShop) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shop not found');
    }
    const updateData = {};
    if (payload.name)
        updateData.name = payload.name;
    if (payload.branch_name !== undefined)
        updateData.branch_name = payload.branch_name;
    if (payload.type)
        updateData.type = payload.type;
    const updatedShop = yield prisma_1.default.shop.update({
        where: { id },
        data: updateData,
        include: {
            users: {
                where: { role: 'ADMIN' },
                select: { id: true, name: true, email: true },
                take: 1,
            },
        },
    });
    return updatedShop;
});
const UpdateSubscription = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingShop = yield prisma_1.default.shop.findUnique({
        where: { id },
    });
    if (!existingShop) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shop not found');
    }
    // set subscription_end based on subscription_plan
    const subscriptionEnd = new Date();
    if (payload.subscription_plan === client_1.SubscriptionPlan.ONE_MONTH) {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    }
    else if (payload.subscription_plan === client_1.SubscriptionPlan.SIX_MONTHS) {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6);
    }
    else if (payload.subscription_plan === client_1.SubscriptionPlan.ONE_YEAR) {
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    }
    const updatedShop = yield prisma_1.default.shop.update({
        where: { id },
        data: {
            subscription_plan: payload.subscription_plan,
            subscription_end: subscriptionEnd,
            is_active: payload.is_active,
        },
    });
    return updatedShop;
});
const DeleteShop = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existingShop = yield prisma_1.default.shop.findUnique({
        where: { id },
    });
    if (!existingShop) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shop not found');
    }
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Delete related users
        yield tx.user.deleteMany({
            where: { shop_id: id },
        });
        // Delete related settings
        yield tx.setting.delete({
            where: { shop_id: id },
        });
        // Delete related products
        yield tx.product.deleteMany({
            where: { shop_id: id },
        });
        // Delete related orders
        yield tx.order.deleteMany({
            where: { shop_id: id },
        });
        yield tx.orderItem.deleteMany({
            where: { order: { shop_id: id } },
        });
        // Delete related categories
        yield tx.category.deleteMany({
            where: { shop_id: id },
        });
        // Delete the shop
        yield tx.shop.delete({
            where: { id },
        });
    }));
});
const ShopService = {
    GetShops,
    GetShopById,
    CreateShop,
    UpdateShop,
    UpdateSubscription,
    DeleteShop,
};
exports.default = ShopService;
