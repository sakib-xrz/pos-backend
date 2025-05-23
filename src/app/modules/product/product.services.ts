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

export interface GetProductsQuery extends IPaginationOptions {
  search?: string;
  category_id?: string;
  availability?: boolean;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  category_id: string;
  image?: Express.Multer.File;
  is_available?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  price?: number;
  category_id?: string;
  is_available?: boolean;
}

const GetProducts = async (query: GetProductsQuery) => {
  const { search, category_id, availability, ...paginationOptions } = query;

  // Calculate pagination with your utility
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  // Build where clause for optimized filtering
  const whereClause: Prisma.ProductWhereInput = {
    is_deleted: false,
  };

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
  file?: Express.Multer.File,
) => {
  // Verify category exists and is not deleted
  const category = await prisma.category.findFirst({
    where: {
      id: payload.category_id,
      is_deleted: false,
    },
  });

  if (!category) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Category not found or has been deleted',
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
      is_available: payload.is_available ?? true,
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

  return product;
};

const UpdateProduct = async (id: string, payload: UpdateProductPayload) => {
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

  // If category_id is being updated, verify the new category exists
  if (payload.category_id) {
    const category = await prisma.category.findFirst({
      where: {
        id: payload.category_id,
        is_deleted: false,
      },
    });

    if (!category) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Category not found or has been deleted',
      );
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...payload,
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

const UpdateProductImage = async (id: string, file: Express.Multer.File) => {
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

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        image: uploadResult?.secure_url,
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
  } catch (error) {
    console.log('Error from cloudinary while updating product image', error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to update product image',
    );
  }
};

const DeleteProductImage = async (id: string) => {
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

  if (!existingProduct.image) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Product does not have an image to delete',
    );
  }

  try {
    // Delete image from Cloudinary
    const publicId = extractPublicIdFromUrl(existingProduct.image);
    if (publicId) {
      await deleteFromCloudinary([publicId]);
    }

    // Update product to remove image URL
    const updatedProduct = await prisma.product.update({
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
  } catch (error) {
    console.log('Error from cloudinary while deleting product image', error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to delete product image',
    );
  }
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
  UpdateProductImage,
  DeleteProductImage,
  DeleteProduct,
  ToggleAvailability,
};

export default ProductService;
