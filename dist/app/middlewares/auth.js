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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth = (...roles) => {
    return (0, catchAsync_1.default)((req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const bearerToken = req.headers.authorization;
        if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid or missing authorization header');
        }
        const token = bearerToken.split(' ')[1];
        if (!token) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You're not authorized to access this route");
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_token_secret);
        const { email } = decoded;
        const user = yield prisma_1.default.user.findUnique({
            where: { email, is_deleted: false },
            include: {
                shop: true,
            },
        });
        if (!user) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You're not authorized to access this route");
        }
        // Check subscription status for non-super-admin users
        if (user.role !== 'SUPER_ADMIN') {
            if (!user.shop) {
                throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User is not associated with any shop');
            }
            // Check if shop is active
            if (!user.shop.is_active) {
                throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Shop is deactivated. Please contact support.');
            }
            // Check subscription expiry
            const now = new Date();
            const subscriptionEnd = new Date(user.shop.subscription_end);
            if (subscriptionEnd <= now) {
                throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Shop subscription has expired. Please contact support to renew.');
            }
        }
        if (roles.length && !roles.includes(user.role)) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You don't have permission to access this route");
        }
        req.user = user;
        next();
    }));
};
exports.default = auth;
