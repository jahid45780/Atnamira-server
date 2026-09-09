import passport from "passport";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHerplrs/appError";
import { NextFunction, Request, Response } from "express";
import { createUserToken } from "../../utils/userTokens";
import { setAuthCookie } from "../../utils/setCookie";
import { sentResponse } from "../../utils/sendResponse";
import  httpStatus  from 'http-status-codes';



const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      { session: false },
      async (err: any, user: any, info: any) => {
        if (err) {
          return next(new AppError(401, err));
        }

        if (!user) {
          return next(
            new AppError(401, info?.message || "Invalid credentials")
          );
        }

        const userTokens = await createUserToken(user);

        const { password, ...userData } = user.toObject();

        await setAuthCookie(res, userTokens);

        sentResponse(res, {
          success: true,
          statusCode: httpStatus.OK,
          message: "Successfully logged in user",
          data: {
            accessTokens: userTokens.accessToken,
            refreshTokens: userTokens.refreshToken,
            user: userData,
          },
        });
      }
    )(req, res, next);
  }
);



 export const authController = {
     credentialsLogin
 }