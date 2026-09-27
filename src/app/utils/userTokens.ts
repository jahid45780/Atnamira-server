import { JwtPayload } from "jsonwebtoken";
import { envVers } from "../config/env";
import AppError from "../errorHerplrs/appError";
import { verifyToken, generateToken } from "./jwt";
import { isActive } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";

interface ITokenUser {
  _id?: string;
  email: string;
  role: string;
}

export const createUserToken = (user: ITokenUser) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVers.JWT_ACCESS_SECRET,
    envVers.JWT_ACCESS_EXPIRES!
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVers.JWT_ACCESS_REFRESH_SECRET,
    envVers.JWT_ACCESS_REFRESH_EXPIRES
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string
) => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    envVers.JWT_ACCESS_REFRESH_SECRET
  ) as JwtPayload;

  const isUserExist = await User.findOne({
    email: verifiedRefreshToken.email,
  });

  if (!isUserExist) {
    throw new AppError(400, "user does not exist");
  }

  if (
    isUserExist.IsActive === isActive.BLOCKED ||
    isUserExist.IsActive === isActive.INACTIVE
  ) {
    throw new AppError(400, `user is ${isUserExist.IsActive}`);
  }

  if (isUserExist.IsDeleted) {
    throw new AppError(400, "user is deleted");
  }

  // Role অবশ্যই থাকতে হবে
  if (!isUserExist.role) {
    throw new AppError(400, "user role is missing");
  }

  const userTokens = createUserToken({
    _id: isUserExist._id.toString(),
    email: isUserExist.email,
    role: isUserExist.role,
  });

  return userTokens.accessToken;
};