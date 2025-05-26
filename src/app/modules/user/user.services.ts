import httpStatus from 'http-status';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import config from '../../config';

interface GetUsersQuery extends IPaginationOptions {
  search?: string;
  role?: Role;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: Role;
}

const GetUsers = async (query: GetUsersQuery, userShopId?: string) => {
  const { search, role, ...paginationOptions } = query;

  // Calculate pagination with your utility
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  // Build where clause for optimized filtering
  const whereClause: Prisma.UserWhereInput = {
    is_deleted: false,
  };

  // Add shop scoping for non-super-admin users
  if (userShopId) {
    whereClause.shop_id = userShopId;
  }

  // Exclude super admin users from shop admin view
  if (userShopId) {
    whereClause.role = { not: 'SUPER_ADMIN' };
  }

  // Add search filter (searches in name and email)
  if (search) {
    whereClause.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Add role filter
  if (role) {
    whereClause.role = role;
  }

  // Build dynamic order by clause
  const orderBy: Prisma.UserOrderByWithRelationInput[] = [];

  // Map sort_by to proper Prisma field
  const sortField = sort_by as keyof Prisma.UserOrderByWithRelationInput;

  if (['name', 'email', 'role', 'created_at', 'updated_at'].includes(sort_by)) {
    orderBy.push({ [sortField]: sort_order as 'asc' | 'desc' });
  } else {
    // Default sorting: by creation date (newest first)
    orderBy.push({ created_at: 'desc' });
  }

  // Execute optimized queries in parallel
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            orders: true,
            receipts: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: whereClause,
    }),
  ]);

  // Transform the response to include counts
  const usersWithCounts = users.map((user) => ({
    ...user,
    total_orders: user._count.orders,
    total_receipts: user._count.receipts,
    _count: undefined, // Remove the _count object from response
  }));

  const meta = {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  };

  return { users: usersWithCounts, meta };
};

const CreateUser = async (
  payload: CreateUserPayload & { shop_id?: string },
) => {
  // Prevent creation of SUPER_ADMIN by non-super-admin users
  if (payload.role === 'SUPER_ADMIN' && payload.shop_id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Cannot create super admin user in shop context',
    );
  }

  // Check if user with same email already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: payload.email,
        mode: 'insensitive',
      },
      is_deleted: false,
    },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'User with this email already exists',
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds),
  );

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: payload.role,
      shop_id: payload.shop_id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true,
      shop: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  return user;
};

const UpdateUser = async (id: string, payload: UpdateUserPayload) => {
  // Check if user exists and is not deleted
  const existingUser = await prisma.user.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingUser) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'User not found or has been deleted',
    );
  }

  // Check if another user with same email exists (if email is being updated)
  if (payload.email) {
    const userWithSameEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: payload.email,
          mode: 'insensitive',
        },
        id: {
          not: id, // Exclude current user
        },
        is_deleted: false,
      },
    });

    if (userWithSameEmail) {
      throw new AppError(
        httpStatus.CONFLICT,
        'User with this email already exists',
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });

  return updatedUser;
};

const ResetPassword = async (id: string, newPassword: string) => {
  // Check if user exists and is not deleted
  const existingUser = await prisma.user.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingUser) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'User not found or has been deleted',
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
    },
  });
};

const DeleteUser = async (id: string) => {
  // Check if user exists and is not already deleted
  const existingUser = await prisma.user.findFirst({
    where: {
      id,
      is_deleted: false,
    },
  });

  if (!existingUser) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'User not found or already deleted',
    );
  }

  // Check if user has any orders (prevent deletion if referenced)
  const orderCount = await prisma.order.count({
    where: {
      created_by: id,
    },
  });

  if (orderCount > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot delete user who has created ${orderCount} order(s). Consider deactivating instead.`,
    );
  }

  // Soft delete the user
  await prisma.user.update({
    where: { id },
    data: {
      is_deleted: true,
    },
  });
};

const UserService = {
  GetUsers,
  CreateUser,
  UpdateUser,
  ResetPassword,
  DeleteUser,
};

export default UserService;
