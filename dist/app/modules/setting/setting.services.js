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
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const GetSetting = () => __awaiter(void 0, void 0, void 0, function* () {
    // Check if any setting exists
    const setting = yield prisma_1.default.setting.findFirst({
        select: {
            id: true,
            display_name: true,
            address: true,
            phone_number: true,
            email: true,
            logo_url: true,
            receipt_header_text: true,
            receipt_footer_text: true,
            show_logo_on_receipt: true,
            created_at: true,
            updated_at: true,
        },
    });
    if (!setting) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Restaurant settings not found. Please create initial settings.');
    }
    return setting;
});
const UpdateSetting = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Check if any setting exists
    const existingSetting = yield prisma_1.default.setting.findFirst();
    if (!existingSetting) {
        // If no setting exists, create a new one with required fields
        const defaultSetting = {
            display_name: payload.display_name || 'My Restaurant',
            address: payload.address || 'Address not set',
            phone_number: payload.phone_number || '000-000-0000',
            email: payload.email || 'contact@restaurant.com',
            logo_url: payload.logo_url || '',
            receipt_header_text: payload.receipt_header_text || 'Welcome to our restaurant!',
            receipt_footer_text: payload.receipt_footer_text || 'Thank you for your visit!',
            show_logo_on_receipt: (_a = payload.show_logo_on_receipt) !== null && _a !== void 0 ? _a : true,
            shop_id: payload.shop_id,
        };
        const newSetting = yield prisma_1.default.setting.create({
            data: defaultSetting,
            select: {
                id: true,
                display_name: true,
                address: true,
                phone_number: true,
                email: true,
                logo_url: true,
                receipt_header_text: true,
                receipt_footer_text: true,
                show_logo_on_receipt: true,
                created_at: true,
                updated_at: true,
            },
        });
        return newSetting;
    }
    // Update existing setting
    const updatedSetting = yield prisma_1.default.setting.update({
        where: { id: existingSetting.id },
        data: Object.assign(Object.assign({}, payload), { updated_at: new Date() }),
        select: {
            id: true,
            display_name: true,
            address: true,
            phone_number: true,
            email: true,
            logo_url: true,
            receipt_header_text: true,
            receipt_footer_text: true,
            show_logo_on_receipt: true,
            created_at: true,
            updated_at: true,
        },
    });
    return updatedSetting;
});
const SettingService = {
    GetSetting,
    UpdateSetting,
};
exports.default = SettingService;
