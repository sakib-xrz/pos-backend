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
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const product_services_1 = __importDefault(require("./product.services"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const GetProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userShopId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.shop_id;
    const result = yield product_services_1.default.GetProducts(req.query, userShopId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Products retrieved successfully',
        meta: result.meta,
        data: result.products,
    });
}));
const CreateProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.user.role === 'SUPER_ADMIN') {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Super admin cannot create products');
    }
    const result = yield product_services_1.default.CreateProduct(req.body, req.user.shop_id, req.file);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Product created successfully',
        data: result,
    });
}));
const UpdateProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Check if super admin is trying to update product
    if (req.user.role === 'SUPER_ADMIN') {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Super admin cannot update products');
    }
    const result = yield product_services_1.default.UpdateProduct(id, req.body, req.file, req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Product updated successfully',
        data: result,
    });
}));
const DeleteProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield product_services_1.default.DeleteProduct(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Product deleted successfully',
    });
}));
const ToggleAvailability = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { is_available } = req.body;
    const result = yield product_services_1.default.ToggleAvailability(id, is_available);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: `Product ${is_available ? 'marked as available' : 'marked as unavailable'} successfully`,
        data: result,
    });
}));
const ProductController = {
    GetProducts,
    CreateProduct,
    UpdateProduct,
    DeleteProduct,
    ToggleAvailability,
};
exports.default = ProductController;
