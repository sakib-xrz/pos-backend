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
const GetCategories = (query, user) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = query, paginationOptions = __rest(query, ["search"]);
    // Calculate pagination with your utility
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    // Build where clause for optimized filtering
    const whereClause = {
        is_deleted: false,
        shop_id: user.shop_id,
    };
    // Add search filter (searches in category name)
    if (search) {
        whereClause.name = {
            contains: search,
            mode: 'insensitive',
        };
    }
    // Build dynamic order by clause
    const orderBy = [];
    // Map sort_by to proper Prisma field
    const sortField = sort_by;
    if (['name', 'created_at', 'updated_at'].includes(sort_by)) {
        orderBy.push({ [sortField]: sort_order });
    }
    else {
        // Default sorting: alphabetical by name
        orderBy.push({ name: 'asc' });
    }
    // Execute optimized queries in parallel
    const [categories, total] = yield Promise.all([
        prisma_1.default.category.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: {
                        products: {
                            where: {
                                is_deleted: false,
                            },
                        },
                    },
                },
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma_1.default.category.count({
            where: whereClause,
        }),
    ]);
    // Transform the response to include product count
    const categoriesWithCount = categories.map((category) => (Object.assign(Object.assign({}, category), { product_count: category._count.products, _count: undefined })));
    const meta = {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
    };
    return { categories: categoriesWithCount, meta };
});
const CreateCategory = (payload, user, file) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category with same name already exists
    const existingCategory = yield prisma_1.default.category.findFirst({
        where: {
            name: {
                equals: payload.name,
                mode: 'insensitive',
            },
            is_deleted: false,
        },
    });
    if (existingCategory) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, 'Category with this name already exists');
    }
    let imageUrl;
    // Upload image to Cloudinary if file is provided
    if (file) {
        try {
            const uploadResult = yield (0, handelFile_1.uploadToCloudinary)(file, {
                folder: 'categories',
                public_id: `category_${Date.now()}`,
            });
            imageUrl = uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url;
        }
        catch (error) {
            console.log('Error from cloudinary while uploading category image', error);
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to upload category image');
        }
    }
    const category = yield prisma_1.default.category.create({
        data: {
            name: payload.name,
            image: imageUrl,
            shop_id: user.shop_id,
        },
        include: {
            _count: {
                select: {
                    products: {
                        where: {
                            is_deleted: false,
                        },
                    },
                },
            },
        },
    });
    return Object.assign(Object.assign({}, category), { product_count: category._count.products, _count: undefined });
});
const UpdateCategory = (id, payload, file, user) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category exists and is not deleted
    const existingCategory = yield prisma_1.default.category.findFirst({
        where: {
            id,
            is_deleted: false,
            shop_id: user === null || user === void 0 ? void 0 : user.shop_id,
        },
    });
    if (!existingCategory) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Category not found or has been deleted');
    }
    // Check if another category with same name exists (if name is being updated)
    if (payload.name) {
        const categoryWithSameName = yield prisma_1.default.category.findFirst({
            where: {
                name: {
                    equals: payload.name,
                    mode: 'insensitive',
                },
                id: {
                    not: id, // Exclude current category
                },
                is_deleted: false,
            },
        });
        if (categoryWithSameName) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, 'Category with this name already exists');
        }
    }
    let imageUrl = existingCategory.image || undefined;
    // Upload new image if file is provided
    if (file) {
        try {
            // Delete old image if exists
            if (existingCategory.image) {
                const publicId = (0, handelFile_1.extractPublicIdFromUrl)(existingCategory.image);
                if (publicId) {
                    yield (0, handelFile_1.deleteFromCloudinary)([publicId]);
                }
            }
            // Upload new image
            const uploadResult = yield (0, handelFile_1.uploadToCloudinary)(file, {
                folder: 'categories',
                public_id: `category_${id}_${Date.now()}`,
            });
            imageUrl = uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url;
        }
        catch (error) {
            console.log('Error from cloudinary while updating category image', error);
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to upload category image');
        }
    }
    const updatedCategory = yield prisma_1.default.category.update({
        where: { id },
        data: Object.assign(Object.assign({}, payload), { image: imageUrl }),
        include: {
            _count: {
                select: {
                    products: {
                        where: {
                            is_deleted: false,
                        },
                    },
                },
            },
        },
    });
    return Object.assign(Object.assign({}, updatedCategory), { product_count: updatedCategory._count.products, _count: undefined });
});
const UpdateCategoryImage = (id, file, user) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category exists and is not deleted
    const existingCategory = yield prisma_1.default.category.findFirst({
        where: {
            id,
            is_deleted: false,
            shop_id: user === null || user === void 0 ? void 0 : user.shop_id,
        },
    });
    if (!existingCategory) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Category not found or has been deleted');
    }
    try {
        // Delete old image if exists
        if (existingCategory.image) {
            const publicId = (0, handelFile_1.extractPublicIdFromUrl)(existingCategory.image);
            if (publicId) {
                yield (0, handelFile_1.deleteFromCloudinary)([publicId]);
            }
        }
        // Upload new image
        const uploadResult = yield (0, handelFile_1.uploadToCloudinary)(file, {
            folder: 'categories',
            public_id: `category_${id}_${Date.now()}`,
        });
        const updatedCategory = yield prisma_1.default.category.update({
            where: { id },
            data: {
                image: uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url,
            },
            include: {
                _count: {
                    select: {
                        products: {
                            where: {
                                is_deleted: false,
                            },
                        },
                    },
                },
            },
        });
        return Object.assign(Object.assign({}, updatedCategory), { product_count: updatedCategory._count.products, _count: undefined });
    }
    catch (error) {
        console.log('Error from cloudinary while updating category image', error);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to update category image');
    }
});
const DeleteCategoryImage = (id, user) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category exists and is not deleted
    const existingCategory = yield prisma_1.default.category.findFirst({
        where: {
            id,
            is_deleted: false,
            shop_id: user === null || user === void 0 ? void 0 : user.shop_id,
        },
    });
    if (!existingCategory) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Category not found or has been deleted');
    }
    if (!existingCategory.image) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Category does not have an image to delete');
    }
    try {
        // Delete image from Cloudinary
        const publicId = (0, handelFile_1.extractPublicIdFromUrl)(existingCategory.image);
        if (publicId) {
            yield (0, handelFile_1.deleteFromCloudinary)([publicId]);
        }
        // Update category to remove image URL
        const updatedCategory = yield prisma_1.default.category.update({
            where: { id },
            data: {
                image: null,
            },
            include: {
                _count: {
                    select: {
                        products: {
                            where: {
                                is_deleted: false,
                            },
                        },
                    },
                },
            },
        });
        return Object.assign(Object.assign({}, updatedCategory), { product_count: updatedCategory._count.products, _count: undefined });
    }
    catch (error) {
        console.log('Error from cloudinary while deleting category image', error);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to delete category image');
    }
});
const DeleteCategory = (id, user) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category exists and is not already deleted
    const existingCategory = yield prisma_1.default.category.findFirst({
        where: {
            id,
            is_deleted: false,
            shop_id: user === null || user === void 0 ? void 0 : user.shop_id,
        },
    });
    if (!existingCategory) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Category not found or already deleted');
    }
    // Check if category has products (prevent deletion if referenced)
    const productCount = yield prisma_1.default.product.count({
        where: {
            category_id: id,
            is_deleted: false,
        },
    });
    if (productCount > 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot delete category that has ${productCount} product(s). Please delete or reassign products first.`);
    }
    try {
        // Delete image from Cloudinary if exists
        if (existingCategory.image) {
            const publicId = (0, handelFile_1.extractPublicIdFromUrl)(existingCategory.image);
            if (publicId) {
                yield (0, handelFile_1.deleteFromCloudinary)([publicId]);
            }
        }
        // Soft delete the category
        yield prisma_1.default.category.update({
            where: { id },
            data: {
                is_deleted: true,
                image: null, // Remove image reference
            },
        });
    }
    catch (error) {
        console.log('Error from cloudinary while deleting category', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to delete category');
    }
});
const CategoryService = {
    GetCategories,
    CreateCategory,
    UpdateCategory,
    UpdateCategoryImage,
    DeleteCategoryImage,
    DeleteCategory,
};
exports.default = CategoryService;
