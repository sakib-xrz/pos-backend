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
const handelFile_1 = require("../../utils/handelFile");
const GetSetting = (shop_id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if any setting exists
    const setting = yield prisma_1.default.setting.findFirst({
        where: {
            shop_id,
        },
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
const UpdateSetting = (shop_id, payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if any setting exists
    const existingSetting = yield prisma_1.default.setting.findFirst({
        where: {
            shop_id,
        },
    });
    let logoUrl = (existingSetting === null || existingSetting === void 0 ? void 0 : existingSetting.logo_url) || undefined;
    // Handle logo upload if file is provided
    if (file) {
        try {
            // Delete old logo if exists and we're updating
            if (existingSetting === null || existingSetting === void 0 ? void 0 : existingSetting.logo_url) {
                const publicId = (0, handelFile_1.extractPublicIdFromUrl)(existingSetting.logo_url);
                if (publicId) {
                    yield (0, handelFile_1.deleteFromCloudinary)([publicId]);
                }
            }
            // Upload new logo
            const uploadResult = yield (0, handelFile_1.uploadToCloudinary)(file, {
                folder: 'restaurant-logos',
                public_id: `restaurant_logo_${Date.now()}`,
            });
            logoUrl = uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url;
        }
        catch (error) {
            console.log('Error from cloudinary while uploading restaurant logo', error);
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to upload restaurant logo');
        }
    }
    if (!existingSetting) {
        // If no setting exists, create a new one with required fields
        const defaultSetting = {
            display_name: payload.display_name || 'My Restaurant',
            address: payload.address || 'Address not set',
            phone_number: payload.phone_number || '000-000-0000',
            email: payload.email || 'contact@restaurant.com',
            logo_url: logoUrl || '',
            receipt_header_text: payload.receipt_header_text || 'Welcome to our restaurant!',
            receipt_footer_text: payload.receipt_footer_text || 'Thank you for your visit!',
            show_logo_on_receipt: payload.show_logo_on_receipt === 'true' ? true : false,
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
        data: Object.assign(Object.assign({}, payload), { logo_url: logoUrl, show_logo_on_receipt: payload.show_logo_on_receipt === 'true' ? true : false, updated_at: new Date() }),
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
