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
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const handelFile_1 = require("../../utils/handelFile");
const pagination_1 = __importDefault(require("../../utils/pagination"));
const GetProducts = (query, userShopId) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, category_id, availability } = query, paginationOptions = __rest(query, ["search", "category_id", "availability"]);
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const whereClause = {
        is_deleted: false,
    };
    // Add shop scoping for non-super-admin users
    if (userShopId) {
        whereClause.shop_id = userShopId;
    }
    // Add search filter (searches in product name)
    if (search) {
        whereClause.name = {
            contains: search,
            mode: 'insensitive',
        };
    }
    // Add category filter
    if (category_id) {
        whereClause.category_id = category_id;
    }
    // Add availability filter
    if (availability !== undefined) {
        whereClause.is_available = availability;
    }
    // Build dynamic order by clause
    const orderBy = [];
    // Map sort_by to proper Prisma field
    const sortField = sort_by;
    if (['name', 'price', 'created_at', 'updated_at', 'is_available'].includes(sort_by)) {
        orderBy.push({ [sortField]: sort_order });
    }
    else {
        // Default sorting: available products first, then by name
        orderBy.push({ is_available: 'desc' }, { name: 'asc' });
    }
    // Execute optimized queries in parallel
    const [products, total] = yield Promise.all([
        prisma_1.default.product.findMany({
            where: whereClause,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma_1.default.product.count({
            where: whereClause,
        }),
    ]);
    const meta = {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
    };
    return { products, meta };
});
const CreateProduct = (payload, shopId, file) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Verify category exists, is not deleted, and belongs to the same shop
    const category = yield prisma_1.default.category.findFirst({
        where: {
            id: payload.category_id,
            shop_id: shopId,
            is_deleted: false,
        },
    });
    if (!category) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Category not found or does not belong to your shop');
    }
    let imageUrl;
    // Upload image to Cloudinary if file is provided
    if (file) {
        try {
            const uploadResult = yield (0, handelFile_1.uploadToCloudinary)(file, {
                folder: 'products',
                public_id: `product_${Date.now()}`,
            });
            imageUrl = uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url;
        }
        catch (error) {
            console.log('Error from cloudinary while uploading product image', error);
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to upload product image');
        }
    }
    const product = yield prisma_1.default.product.create({
        data: {
            name: payload.name,
            price: payload.price,
            image: imageUrl,
            category_id: payload.category_id,
            shop_id: shopId,
            is_available: (_a = payload.is_available) !== null && _a !== void 0 ? _a : true,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            shop: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
    });
    return product;
});
const UpdateProduct = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if product exists and is not deleted
    const existingProduct = yield prisma_1.default.product.findFirst({
        where: {
            id,
            is_deleted: false,
        },
    });
    if (!existingProduct) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product not found or has been deleted');
    }
    // If category_id is being updated, verify the new category exists
    if (payload.category_id) {
        const category = yield prisma_1.default.category.findFirst({
            where: {
                id: payload.category_id,
                is_deleted: false,
            },
        });
        if (!category) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Category not found or has been deleted');
        }
    }
    const updatedProduct = yield prisma_1.default.product.update({
        where: { id },
        data: Object.assign({}, payload),
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });
    return updatedProduct;
});
const UpdateProductImage = (id, file) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if product exists and is not deleted
    const existingProduct = yield prisma_1.default.product.findFirst({
        where: {
            id,
            is_deleted: false,
        },
    });
    if (!existingProduct) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product not found or has been deleted');
    }
    try {
        // Delete old image if exists
        if (existingProduct.image) {
            const publicId = (0, handelFile_1.extractPublicIdFromUrl)(existingProduct.image);
            if (publicId) {
                yield (0, handelFile_1.deleteFromCloudinary)([publicId]);
            }
        }
        // Upload new image
        const uploadResult = yield (0, handelFile_1.uploadToCloudinary)(file, {
            folder: 'products',
            public_id: `product_${id}_${Date.now()}`,
        });
        const updatedProduct = yield prisma_1.default.product.update({
            where: { id },
            data: {
                image: uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });
        return updatedProduct;
    }
    catch (error) {
        console.log('Error from cloudinary while updating product image', error);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to update product image');
    }
});
const DeleteProductImage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if product exists and is not deleted
    const existingProduct = yield prisma_1.default.product.findFirst({
        where: {
            id,
            is_deleted: false,
        },
    });
    if (!existingProduct) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product not found or has been deleted');
    }
    if (!existingProduct.image) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Product does not have an image to delete');
    }
    try {
        // Delete image from Cloudinary
        const publicId = (0, handelFile_1.extractPublicIdFromUrl)(existingProduct.image);
        if (publicId) {
            yield (0, handelFile_1.deleteFromCloudinary)([publicId]);
        }
        // Update product to remove image URL
        const updatedProduct = yield prisma_1.default.product.update({
            where: { id },
            data: {
                image: null,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });
        return updatedProduct;
    }
    catch (error) {
        console.log('Error from cloudinary while deleting product image', error);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to delete product image');
    }
});
const DeleteProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if product exists and is not already deleted
    const existingProduct = yield prisma_1.default.product.findFirst({
        where: {
            id,
            is_deleted: false,
        },
    });
    if (!existingProduct) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product not found or already deleted');
    }
    // Check if product is used in any orders (prevent deletion if referenced)
    const orderItemCount = yield prisma_1.default.orderItem.count({
        where: {
            product_id: id,
        },
    });
    if (orderItemCount > 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot delete product that has been used in orders. Consider marking it as unavailable instead.');
    }
    try {
        // Delete image from Cloudinary if exists
        if (existingProduct.image) {
            const publicId = (0, handelFile_1.extractPublicIdFromUrl)(existingProduct.image);
            if (publicId) {
                yield (0, handelFile_1.deleteFromCloudinary)([publicId]);
            }
        }
        // Soft delete the product
        yield prisma_1.default.product.update({
            where: { id },
            data: {
                is_deleted: true,
                is_available: false, // Also mark as unavailable
                image: null, // Remove image reference
            },
        });
    }
    catch (error) {
        console.log('Error from cloudinary while deleting product', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to delete product');
    }
});
const ToggleAvailability = (id, is_available) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if product exists and is not deleted
    const existingProduct = yield prisma_1.default.product.findFirst({
        where: {
            id,
            is_deleted: false,
        },
    });
    if (!existingProduct) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product not found or has been deleted');
    }
    const updatedProduct = yield prisma_1.default.product.update({
        where: { id },
        data: { is_available },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });
    return updatedProduct;
});
const ProductService = {
    GetProducts,
    CreateProduct,
    UpdateProduct,
    UpdateProductImage,
    DeleteProductImage,
    DeleteProduct,
    ToggleAvailability,
};
exports.default = ProductService;
