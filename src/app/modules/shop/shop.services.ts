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
  is_active?: boolean | string; // Allow string for query params
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
  settings: {
    display_name: string;
    address?: string;
    phone_number?: string;
    email: string;
    logo_url?: string;
    receipt_header_text: string;
    receipt_footer_text: string;
    show_logo_on_receipt: boolean;
  };
}

export interface UpdateShopPayload {
  name?: string;
  branch_name?: string;
  type?: ShopType;
}

const GetShops = async (query: GetShopsQuery) => {
  const { search, type, subscription_plan, is_active, ...paginationOptions } =
    query;

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
    whereClause.is_active = is_active === 'true' ? true : false;
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
    // set subscription_end based on subscription_plan
    const subscriptionEnd = new Date();
    if (payload.subscription_plan === SubscriptionPlan.ONE_MONTH) {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    } else if (payload.subscription_plan === SubscriptionPlan.SIX_MONTHS) {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6);
    } else if (payload.subscription_plan === SubscriptionPlan.ONE_YEAR) {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    }

    // Create shop
    const shop = await tx.shop.create({
      data: {
        name: payload.name,
        branch_name: payload.branch_name,
        type: payload.type,
        subscription_plan: payload.subscription_plan,
        subscription_end: subscriptionEnd,
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
        email: payload.admin_email,
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
  payload: { subscription_plan: SubscriptionPlan; is_active: boolean },
) => {
  const existingShop = await prisma.shop.findUnique({
    where: { id },
  });

  if (!existingShop) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  // set subscription_end based on subscription_plan
  const subscriptionEnd = new Date();
  if (payload.subscription_plan === SubscriptionPlan.ONE_MONTH) {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
  } else if (payload.subscription_plan === SubscriptionPlan.SIX_MONTHS) {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6);
  } else if (payload.subscription_plan === SubscriptionPlan.ONE_YEAR) {
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
  }

  const updatedShop = await prisma.shop.update({
    where: { id },
    data: {
      subscription_plan: payload.subscription_plan,
      subscription_end: subscriptionEnd,
      is_active: payload.is_active,
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

  await prisma.$transaction(async (tx) => {
    // Delete related users
    await tx.user.deleteMany({
      where: { shop_id: id },
    });

    // Delete related settings
    await tx.setting.delete({
      where: { shop_id: id },
    });

    // Delete related products
    await tx.product.deleteMany({
      where: { shop_id: id },
    });

    // Delete related orders
    await tx.order.deleteMany({
      where: { shop_id: id },
    });

    await tx.orderItem.deleteMany({
      where: { order: { shop_id: id } },
    });

    // Delete related categories
    await tx.category.deleteMany({
      where: { shop_id: id },
    });

    // Delete the shop
    await tx.shop.delete({
      where: { id },
    });
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
