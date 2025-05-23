import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import httpStatus from 'http-status';
import config from '../config';
import AppError from '../errors/AppError';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

const auth = (...roles: Role[]) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const bearerToken = req.headers.authorization;

      if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Invalid or missing authorization header',
        );
      }

      const token = bearerToken.split(' ')[1];

      if (!token) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "You're not authorized to access this route",
        );
      }

      const decoded = jwt.verify(
        token,
        config.jwt_access_token_secret as string,
      ) as JwtPayload;

      const { email } = decoded;

      const user = await prisma.user.findUnique({
        where: { email, is_deleted: false },
      });

      if (!user) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "You're not authorized to access this route",
        );
      }

      if (roles.length && !roles.includes(user.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You don't have permission to access this route",
        );
      }

      req.user = user;

      next();
    },
  );
};

export default auth;
