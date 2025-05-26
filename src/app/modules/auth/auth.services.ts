import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import bcrypt from 'bcrypt';
import AuthUtils from './auth.utils';
import config from '../../config';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '@prisma/client';

const Login = async (payload: User) => {
  const user = await prisma.user.findFirst({
    where: { email: payload.email },
    include: {
      shop: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email');
  }

  // Check subscription for non-super-admin users
  if (user.role !== 'SUPER_ADMIN') {
    if (!user.shop) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'User is not associated with any shop',
      );
    }

    if (!user.shop.is_active) {
      throw new AppError(httpStatus.FORBIDDEN, 'Shop is deactivated');
    }

    const now = new Date();
    const subscriptionEnd = new Date(user.shop.subscription_end);

    if (subscriptionEnd <= now) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Shop subscription has expired. Please contact support.',
      );
    }
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    shop_id: user.shop_id,
  };

  const access_token = AuthUtils.CreateToken(
    jwtPayload,
    config.jwt_access_token_secret as string,
    config.jwt_access_token_expires_in as string,
  );

  const refresh_token = AuthUtils.CreateToken(
    jwtPayload,
    config.jwt_refresh_token_secret as string,
    config.jwt_refresh_token_expires_in as string,
  );

  return { access_token, refresh_token, user: { ...user, shop: undefined } };
};

const ChangePassword = async (
  payload: {
    old_password: string;
    new_password: string;
  },
  user: JwtPayload,
) => {
  const isUserValid = await prisma.user.findFirst({
    where: { id: user.id },
  });

  if (!isUserValid) {
    throw new AppError(httpStatus.NOT_FOUND, 'No user found');
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.old_password,
    isUserValid.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid password');
  }

  const hashedPassword = await bcrypt.hash(
    payload.new_password,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
};

const GetMyProfile = async (user: JwtPayload) => {
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id, email: user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      created_at: true,
      shop: {
        select: {
          id: true,
          name: true,
          type: true,
          subscription_plan: true,
          subscription_end: true,
          is_active: true,
        },
      },
    },
  });

  if (!userProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Add subscription status
  let subscriptionStatus = 'active';
  if (userProfile.shop) {
    const now = new Date();
    const subscriptionEnd = new Date(userProfile.shop.subscription_end);
    const isExpired = subscriptionEnd <= now;
    const isExpiringSoon =
      !isExpired &&
      subscriptionEnd <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    subscriptionStatus = isExpired
      ? 'expired'
      : isExpiringSoon
        ? 'expiring_soon'
        : 'active';
  }

  return {
    ...userProfile,
    subscription_status: subscriptionStatus,
  };
};

const AuthService = {
  Login,
  ChangePassword,
  GetMyProfile,
};

export default AuthService;
