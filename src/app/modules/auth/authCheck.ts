import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

import { envVers } from "../../config/env";
import AppError from "../../errorHerplrs/appError";
import { verifyToken } from "../../utils/jwt";
import { isActive } from "../user/user.interface";
import { User } from "../user/user.model";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken =
        req.cookies.AccessToken ||
        req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        throw new AppError(401, "Token not received");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVers.JWT_ACCESS_SECRET
      ) as JwtPayload;

      if (
        !verifiedToken.email ||
        !verifiedToken.userId ||
        !verifiedToken.role
      ) {
        throw new AppError(401, "Invalid token");
      }

      const isUserExist = await User.findOne({
        email: verifiedToken.email,
      });

      if (!isUserExist) {
        throw new AppError(400, "User does not exist");
      }

      if (
        isUserExist.IsActive === isActive.BLOCKED ||
        isUserExist.IsActive === isActive.INACTIVE
      ) {
        throw new AppError(
          400,
          `User is ${isUserExist.IsActive}`
        );
      }

      if (isUserExist.IsDeleted) {
        throw new AppError(400, "User is deleted");
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(
          403,
          "You are not permitted to view this route"
        );
      }

      req.user = {
        userId: verifiedToken.userId,
        email: verifiedToken.email,
        role: verifiedToken.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };