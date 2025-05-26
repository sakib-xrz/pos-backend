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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_utils_1 = __importDefault(require("./auth.utils"));
const config_1 = __importDefault(require("../../config"));
const Login = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findFirst({
        where: { email: payload.email },
        include: {
            shop: true,
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No user found with this email');
    }
    // Check subscription for non-super-admin users
    if (user.role !== 'SUPER_ADMIN') {
        if (!user.shop) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is not associated with any shop');
        }
        if (!user.shop.is_active) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Shop is deactivated');
        }
        const now = new Date();
        const subscriptionEnd = new Date(user.shop.subscription_end);
        if (subscriptionEnd <= now) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Shop subscription has expired. Please contact support.');
        }
    }
    const isPasswordMatched = yield bcrypt_1.default.compare(payload.password, user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid email or password');
    }
    const jwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        shop_id: user.shop_id,
    };
    const access_token = auth_utils_1.default.CreateToken(jwtPayload, config_1.default.jwt_access_token_secret, config_1.default.jwt_access_token_expires_in);
    const refresh_token = auth_utils_1.default.CreateToken(jwtPayload, config_1.default.jwt_refresh_token_secret, config_1.default.jwt_refresh_token_expires_in);
    return { access_token, refresh_token, user: Object.assign(Object.assign({}, user), { shop: undefined }) };
});
const ChangePassword = (payload, user) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserValid = yield prisma_1.default.user.findFirst({
        where: { id: user.id },
    });
    if (!isUserValid) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No user found');
    }
    const isPasswordMatched = yield bcrypt_1.default.compare(payload.old_password, isUserValid.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid password');
    }
    const hashedPassword = yield bcrypt_1.default.hash(payload.new_password, Number(config_1.default.bcrypt_salt_rounds));
    yield prisma_1.default.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
    });
});
const GetMyProfile = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userProfile = yield prisma_1.default.user.findUnique({
        where: { id: user.id, email: user.email },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            created_at: true,
            shop: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    subscription_plan: true,
                    subscription_end: true,
                    is_active: true,
                },
            },
        },
    });
    if (!userProfile) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    // Add subscription status
    let subscriptionStatus = 'active';
    if (userProfile.shop) {
        const now = new Date();
        const subscriptionEnd = new Date(userProfile.shop.subscription_end);
        const isExpired = subscriptionEnd <= now;
        const isExpiringSoon = !isExpired &&
            subscriptionEnd <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        subscriptionStatus = isExpired
            ? 'expired'
            : isExpiringSoon
                ? 'expiring_soon'
                : 'active';
    }
    return Object.assign(Object.assign({}, userProfile), { subscription_status: subscriptionStatus });
});
const AuthService = {
    Login,
    ChangePassword,
    GetMyProfile,
};
exports.default = AuthService;
