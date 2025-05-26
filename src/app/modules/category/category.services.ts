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
interface GetCategoriesQuery extends IPaginationOptions {
  search?: string;
}

interface CreateCategoryPayload {
  name: string;
}

interface UpdateCategoryPayload {
  name?: string;
}

const GetCategories = async (query: GetCategoriesQuery) => {
  const { search, ...paginationOptions } = query;

  // Calculate pagination with your utility
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  // Build where clause for optimized filtering
  const whereClause: Prisma.CategoryWhereInput = {
    is_deleted: false,
  };

  // Add search filter (searches in category name)
  if (search) {
    whereClause.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Build dynamic order by clause
  const orderBy: Prisma.CategoryOrderByWithRelationInput[] = [];

  // Map sort_by to proper Prisma field
  const sortField = sort_by as keyof Prisma.CategoryOrderByWithRelationInput;

  if (['name', 'created_at', 'updated_at'].includes(sort_by)) {
    orderBy.push({ [sortField]: sort_order as 'asc' | 'desc' });
  } else {
    // Default sorting: alphabetical by name
    orderBy.push({ name: 'asc' });
  }

  // Execute optimized queries in parallel
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
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
    prisma.category.count({
      where: whereClause,
    }),
  ]);

  // Transform the response to include product count
  const categoriesWithCount = categories.map((category) => ({
    ...category,
    product_count: category._count.products,
    _count: undefined, // Remove the _count object from response
  }));

  const meta = {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  };

  return { categories: categoriesWithCount, meta };
};

const CreateCategory = async (
  payload: CreateCategoryPayload,
  user: JwtPayload,
  file?: Express.Multer.File,
) => {
  // Check if category with same name already exists
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: payload.name,
        mode: 'insensitive',
      },
      is_deleted: false,
    },
  });

  if (existingCategory) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Category with this name already exists',
    );
  }

  let imageUrl: string | undefined;

  // Upload image to Cloudinary if file is provided
  if (file) {
    try {
      const uploadResult = await uploadToCloudinary(file, {
        folder: 'categories',
        public_id: `category_${Date.now()}`,
      });
      imageUrl = uploadResult?.secure_url;
    } catch (error) {
      console.log(
        'Error from cloudinary while uploading category image',
        error,
      );
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to upload category image',
      );
    }
  }

  const category = await prisma.category.create({
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

  return {
    ...category,
    product_count: category._count.products,
    _count: undefined,
  };
};

const UpdateCategory = async (
  id: string,
  payload: UpdateCategoryPayload,
  file?: Express.Multer.File,
) => {
  // Check if category exists and is not deleted
  const existingCategory = await prisma.category.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingCategory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Category not found or has been deleted',
    );
  }

  // Check if another category with same name exists (if name is being updated)
  if (payload.name) {
    const categoryWithSameName = await prisma.category.findFirst({
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
      throw new AppError(
        httpStatus.CONFLICT,
        'Category with this name already exists',
      );
    }
  }

  let imageUrl: string | undefined = existingCategory.image || undefined;

  // Upload new image if file is provided
  if (file) {
    try {
      // Delete old image if exists
      if (existingCategory.image) {
        const publicId = extractPublicIdFromUrl(existingCategory.image);
        if (publicId) {
          await deleteFromCloudinary([publicId]);
        }
      }

      // Upload new image
      const uploadResult = await uploadToCloudinary(file, {
        folder: 'categories',
        public_id: `category_${id}_${Date.now()}`,
      });
      imageUrl = uploadResult?.secure_url;
    } catch (error) {
      console.log('Error from cloudinary while updating category image', error);
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to upload category image',
      );
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      ...payload,
      image: imageUrl,
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

  return {
    ...updatedCategory,
    product_count: updatedCategory._count.products,
    _count: undefined,
  };
};

const UpdateCategoryImage = async (id: string, file: Express.Multer.File) => {
  // Check if category exists and is not deleted
  const existingCategory = await prisma.category.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingCategory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Category not found or has been deleted',
    );
  }

  try {
    // Delete old image if exists
    if (existingCategory.image) {
      const publicId = extractPublicIdFromUrl(existingCategory.image);
      if (publicId) {
        await deleteFromCloudinary([publicId]);
      }
    }

    // Upload new image
    const uploadResult = await uploadToCloudinary(file, {
      folder: 'categories',
      public_id: `category_${id}_${Date.now()}`,
    });

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        image: uploadResult?.secure_url,
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

    return {
      ...updatedCategory,
      product_count: updatedCategory._count.products,
      _count: undefined,
    };
  } catch (error) {
    console.log('Error from cloudinary while updating category image', error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to update category image',
    );
  }
};

const DeleteCategoryImage = async (id: string) => {
  // Check if category exists and is not deleted
  const existingCategory = await prisma.category.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingCategory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Category not found or has been deleted',
    );
  }

  if (!existingCategory.image) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Category does not have an image to delete',
    );
  }

  try {
    // Delete image from Cloudinary
    const publicId = extractPublicIdFromUrl(existingCategory.image);
    if (publicId) {
      await deleteFromCloudinary([publicId]);
    }

    // Update category to remove image URL
    const updatedCategory = await prisma.category.update({
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

    return {
      ...updatedCategory,
      product_count: updatedCategory._count.products,
      _count: undefined,
    };
  } catch (error) {
    console.log('Error from cloudinary while deleting category image', error);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to delete category image',
    );
  }
};

const DeleteCategory = async (id: string) => {
  // Check if category exists and is not already deleted
  const existingCategory = await prisma.category.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingCategory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Category not found or already deleted',
    );
  }

  // Check if category has products (prevent deletion if referenced)
  const productCount = await prisma.product.count({
    where: {
      category_id: id,
      is_deleted: false,
    },
  });

  if (productCount > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot delete category that has ${productCount} product(s). Please delete or reassign products first.`,
    );
  }

  try {
    // Delete image from Cloudinary if exists
    if (existingCategory.image) {
      const publicId = extractPublicIdFromUrl(existingCategory.image);
      if (publicId) {
        await deleteFromCloudinary([publicId]);
      }
    }

    // Soft delete the category
    await prisma.category.update({
      where: { id },
      data: {
        is_deleted: true,
        image: null, // Remove image reference
      },
    });
  } catch (error) {
    console.log('Error from cloudinary while deleting category', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to delete category',
    );
  }
};

const CategoryService = {
  GetCategories,
  CreateCategory,
  UpdateCategory,
  UpdateCategoryImage,
  DeleteCategoryImage,
  DeleteCategory,
};

export default CategoryService;
