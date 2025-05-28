import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from '../../utils/handelFile';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import { JwtPayload } from 'jsonwebtoken';

export interface GetProductsQuery extends IPaginationOptions {
  search?: string;
  category_id?: string;
  is_available?: boolean | string;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  category_id: string;
  image?: Express.Multer.File;
  is_available?: boolean | string;
}

export interface UpdateProductPayload {
  name?: string;
  price?: number;
  category_id?: string;
  is_available?: boolean | string;
}

const GetProducts = async (query: GetProductsQuery, userShopId?: string) => {
  const { search, category_id, is_available, ...paginationOptions } = query;

  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  const whereClause: Prisma.ProductWhereInput = {
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
  if (is_available !== undefined) {
    whereClause.is_available =
      is_available === 'true'
        ? true
        : is_available === 'false'
          ? false
          : undefined;
  }

  // Build dynamic order by clause
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];

  // Map sort_by to proper Prisma field
  const sortField = sort_by as keyof Prisma.ProductOrderByWithRelationInput;

  if (
    ['name', 'price', 'created_at', 'updated_at', 'is_available'].includes(
      sort_by,
    )
  ) {
    orderBy.push({ [sortField]: sort_order as 'asc' | 'desc' });
  } else {
    // Default sorting: available products first, then by name
    orderBy.push({ is_available: 'desc' }, { name: 'asc' });
  }

  // Execute optimized queries in parallel
  const [products, total] = await Promise.all([
    prisma.product.findMany({
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
    prisma.product.count({
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
};

const CreateProduct = async (
  payload: CreateProductPayload,
  shopId: string,
  file?: Express.Multer.File,
) => {
  // Verify category exists, is not deleted, and belongs to the same shop
  const category = await prisma.category.findFirst({
    where: {
      id: payload.category_id,
      shop_id: shopId,
      is_deleted: false,
    },
  });

  if (!category) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Category not found or does not belong to your shop',
    );
  }

  let imageUrl: string | undefined;

  // Upload image to Cloudinary if file is provided
  if (file) {
    try {
      const uploadResult = await uploadToCloudinary(file, {
        folder: 'products',
        public_id: `product_${Date.now()}`,
      });
      imageUrl = uploadResult?.secure_url;
    } catch (error) {
      console.log('Error from cloudinary while uploading product image', error);
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to upload product image',
      );
    }
  }

  const product = await prisma.product.create({
    data: {
      name: payload.name,
      price: payload.price,
      image: imageUrl,
      category_id: payload.category_id,
      shop_id: shopId,
      is_available: payload.is_available === 'true' ? true : false,
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
};

const UpdateProduct = async (
  id: string,
  payload: UpdateProductPayload,
  file?: Express.Multer.File,
  user?: JwtPayload,
) => {
  // Check if product exists and is not deleted
  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      is_deleted: false,
      shop_id: user?.shop_id,
    },
  });

  if (!existingProduct) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Product not found or has been deleted',
    );
  }

  // Check if another product with same name exists (if name is being updated)
  if (payload.name) {
    const productWithSameName = await prisma.product.findFirst({
      where: {
        name: {
          equals: payload.name,
          mode: 'insensitive',
        },
        id: {
          not: id, // Exclude current product
        },
        is_deleted: false,
        shop_id: user?.shop_id,
      },
    });

    if (productWithSameName) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Product with this name already exists',
      );
    }
  }

  // If category_id is being updated, verify the new category exists
  if (payload.category_id) {
    const category = await prisma.category.findFirst({
      where: {
        id: payload.category_id,
        is_deleted: false,
        shop_id: user?.shop_id,
      },
    });

    if (!category) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Category not found or has been deleted',
      );
    }
  }

  let imageUrl: string | undefined = existingProduct.image || undefined;

  // Handle image upload if file is provided
  if (file) {
    try {
      // Delete old image if exists
      if (existingProduct.image) {
        const publicId = extractPublicIdFromUrl(existingProduct.image);
        if (publicId) {
          await deleteFromCloudinary([publicId]);
        }
      }

      // Upload new image
      const uploadResult = await uploadToCloudinary(file, {
        folder: 'products',
        public_id: `product_${id}_${Date.now()}`,
      });
      imageUrl = uploadResult?.secure_url;
    } catch (error) {
      console.log('Error from cloudinary while updating product image', error);
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to upload product image',
      );
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...payload,
      image: imageUrl,
      is_available: payload.is_available === 'true',
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
};

const DeleteProduct = async (id: string) => {
  // Check if product exists and is not already deleted
  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingProduct) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Product not found or already deleted',
    );
  }

  // Check if product is used in any orders (prevent deletion if referenced)
  const orderItemCount = await prisma.orderItem.count({
    where: {
      product_id: id,
    },
  });

  if (orderItemCount > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot delete product that has been used in orders. Consider marking it as unavailable instead.',
    );
  }

  try {
    // Delete image from Cloudinary if exists
    if (existingProduct.image) {
      const publicId = extractPublicIdFromUrl(existingProduct.image);
      if (publicId) {
        await deleteFromCloudinary([publicId]);
      }
    }

    // Soft delete the product
    await prisma.product.update({
      where: { id },
      data: {
        is_deleted: true,
        is_available: false, // Also mark as unavailable
        image: null, // Remove image reference
      },
    });
  } catch (error) {
    console.log('Error from cloudinary while deleting product', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to delete product',
    );
  }
};

const ToggleAvailability = async (id: string, is_available: boolean) => {
  // Check if product exists and is not deleted
  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingProduct) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Product not found or has been deleted',
    );
  }

  const updatedProduct = await prisma.product.update({
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
};

const ProductService = {
  GetProducts,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  ToggleAvailability,
};

export default ProductService;
