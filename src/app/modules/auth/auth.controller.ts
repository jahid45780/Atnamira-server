import passport from "passport";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHerplrs/appError";
import { NextFunction, Request, Response } from "express";
import { createUserToken } from "../../utils/userTokens";
import { setAuthCookie } from "../../utils/setCookie";
import { sentResponse } from "../../utils/sendResponse";
import  httpStatus  from 'http-status-codes';
import { envVers } from "../../config/env";



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


const logout = catchAsync(async(req:Request, res:Response, next:NextFunction)=>{
  
  res.clearCookie("accessToken",{
     httpOnly:true,
     secure:false,
     sameSite:"lax"
  })

  res.clearCookie("refreshToken",{
    httpOnly:true,
    secure:false,
    sameSite:"lax"
  })

    sentResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"successfully  logged out user",
    data:null
   
  })

})


  const googleCallbackController = catchAsync(async (req:Request, res:Response, next:NextFunction)=>{
  

  let redirectTo = req.query.state ? req.query.state as string : ""

  if(redirectTo.startsWith('/')){
   redirectTo = redirectTo.slice(1)
  }

  const user = req.user;
  if(!user){
    throw new AppError(httpStatus.NOT_FOUND,"user not found")
  }

  const TokenInfo = createUserToken(user)

  setAuthCookie(res, TokenInfo)

 res.redirect(`${envVers.FRONTEND_URL}/${redirectTo}`)
  
 
})






 export const authController = {
     credentialsLogin,
     googleCallbackController,
     logout
 }