import httpStatus from 'http-status';
import { Prisma, ShopType, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcrypt';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import config from '../../config';

export interface GetShopsQuery extends IPaginationOptions {
  search?: string;
  type?: ShopType;
  subscription_plan?: SubscriptionPlan;
  is_active?: boolean;
  subscription_status?: 'active' | 'expired' | 'expiring_soon';
}

export interface CreateShopPayload {
  name: string;
  branch_name?: string;
  type: ShopType;
  subscription_plan: SubscriptionPlan;
  subscription_end: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface UpdateShopPayload {
  name?: string;
  branch_name?: string;
  type?: ShopType;
  subscription_plan?: SubscriptionPlan;
  subscription_end?: string;
  is_active?: boolean;
}

const GetShops = async (query: GetShopsQuery) => {
  const {
    search,
    type,
    subscription_plan,
    is_active,
    subscription_status,
    ...paginationOptions
  } = query;

  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  const whereClause: Prisma.ShopWhereInput = {};

  // Search filter
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { branch_name: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Type filter
  if (type) {
    whereClause.type = type;
  }

  // Subscription plan filter
  if (subscription_plan) {
    whereClause.subscription_plan = subscription_plan;
  }

  // Active status filter
  if (is_active !== undefined) {
    whereClause.is_active = is_active;
  }

  // Subscription status filter
  if (subscription_status) {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    switch (subscription_status) {
      case 'active':
        whereClause.subscription_end = { gt: now };
        break;
      case 'expired':
        whereClause.subscription_end = { lte: now };
        break;
      case 'expiring_soon':
        whereClause.subscription_end = {
          gt: now,
          lte: sevenDaysFromNow,
        };
        break;
    }
  }

  const orderBy: Prisma.ShopOrderByWithRelationInput[] = [];
  const sortField = sort_by as keyof Prisma.ShopOrderByWithRelationInput;

  if (
    [
      'name',
      'type',
      'subscription_plan',
      'subscription_end',
      'created_at',
    ].includes(sort_by)
  ) {
    orderBy.push({ [sortField]: sort_order as 'asc' | 'desc' });
  } else {
    orderBy.push({ created_at: 'desc' });
  }

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
            categories: true,
          },
        },
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true },
          take: 1,
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.shop.count({ where: whereClause }),
  ]);

  // Add subscription status to each shop
  const shopsWithStatus = shops.map((shop) => {
    const now = new Date();
    const subscriptionEnd = new Date(shop.subscription_end);
    const isExpired = subscriptionEnd <= now;
    const isExpiringSoon =
      !isExpired &&
      subscriptionEnd <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      ...shop,
      subscription_status: isExpired
        ? 'expired'
        : isExpiringSoon
          ? 'expiring_soon'
          : 'active',
      admin: shop.users[0] || null,
      users: undefined,
    };
  });

  const meta = {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  };

  return { shops: shopsWithStatus, meta };
};

const GetShopById = async (id: string) => {
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          created_at: true,
        },
      },
      settings: true,
      _count: {
        select: {
          users: true,
          products: true,
          orders: true,
          categories: true,
        },
      },
    },
  });

  if (!shop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  const now = new Date();
  const subscriptionEnd = new Date(shop.subscription_end);
  const isExpired = subscriptionEnd <= now;
  const isExpiringSoon =
    !isExpired &&
    subscriptionEnd <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    ...shop,
    subscription_status: isExpired
      ? 'expired'
      : isExpiringSoon
        ? 'expiring_soon'
        : 'active',
  };
};

const CreateShop = async (payload: CreateShopPayload) => {
  // Check if admin email already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email: { equals: payload.admin_email, mode: 'insensitive' },
      is_deleted: false,
    },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'Admin email already exists');
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create shop
    const shop = await tx.shop.create({
      data: {
        name: payload.name,
        branch_name: payload.branch_name,
        type: payload.type,
        subscription_plan: payload.subscription_plan,
        subscription_end: new Date(payload.subscription_end),
      },
    });

    // Hash admin password
    const hashedPassword = await bcrypt.hash(
      payload.admin_password,
      Number(config.bcrypt_salt_rounds),
    );

    // Create admin user
    const admin = await tx.user.create({
      data: {
        name: payload.admin_name,
        email: payload.admin_email,
        password: hashedPassword,
        role: 'ADMIN',
        shop_id: shop.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    // Create default settings
    await tx.setting.create({
      data: {
        shop_id: shop.id,
        display_name: payload.name,
        address: '',
        phone_number: '',
        email: payload.admin_email,
        logo_url: '',
        receipt_header_text: `Welcome to ${payload.name}`,
        receipt_footer_text: 'Thank you for your business!',
      },
    });

    return { shop, admin };
  });

  return result;
};

const UpdateShop = async (id: string, payload: UpdateShopPayload) => {
  const existingShop = await prisma.shop.findUnique({
    where: { id },
  });

  if (!existingShop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  const updateData: Prisma.ShopUpdateInput = {};

  if (payload.name) updateData.name = payload.name;
  if (payload.branch_name !== undefined)
    updateData.branch_name = payload.branch_name;
  if (payload.type) updateData.type = payload.type;
  if (payload.subscription_plan)
    updateData.subscription_plan = payload.subscription_plan;
  if (payload.subscription_end)
    updateData.subscription_end = new Date(payload.subscription_end);
  if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

  const updatedShop = await prisma.shop.update({
    where: { id },
    data: updateData,
    include: {
      users: {
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true },
        take: 1,
      },
    },
  });

  return updatedShop;
};

const UpdateSubscription = async (
  id: string,
  payload: { subscription_plan: SubscriptionPlan; subscription_end: string },
) => {
  const existingShop = await prisma.shop.findUnique({
    where: { id },
  });

  if (!existingShop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  const updatedShop = await prisma.shop.update({
    where: { id },
    data: {
      subscription_plan: payload.subscription_plan,
      subscription_end: new Date(payload.subscription_end),
      is_active: true, // Reactivate shop when subscription is updated
    },
  });

  return updatedShop;
};

const DeleteShop = async (id: string) => {
  const existingShop = await prisma.shop.findUnique({
    where: { id },
  });

  if (!existingShop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  // Soft delete by deactivating
  await prisma.shop.update({
    where: { id },
    data: { is_active: false },
  });
};

const ShopService = {
  GetShops,
  GetShopById,
  CreateShop,
  UpdateShop,
  UpdateSubscription,
  DeleteShop,
};

export default ShopService;
