
import { JwtPayload } from "jsonwebtoken";
import { envVers } from "../config/env";
import AppError from "../errorHerplrs/appError";
import { generateToken, verifyToken } from "./jwt";
import { isActive, IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";

 export const createUserToken = (user: Partial<IUser>)=>{
    const jwtPayload = {
          userId:user._id,
          email:user.email,
          role:user.role
       }
    
       const accessToken = generateToken(jwtPayload, envVers.JWT_ACCESS_SECRET!, envVers.JWT_ACCESS_EXPIRES!)
    
       const refreshToken = generateToken(jwtPayload,envVers.JWT_ACCESS_REFRESH_SECRET!, envVers.JWT_ACCESS_REFRESH_EXPIRES!)

       return{
        accessToken,
        refreshToken
       }
}


 export const createNewAccessTokenWithRefreshToken = async (refreshToke:string)=>{
        const verifiedrefreshToken =  verifyToken(refreshToke,envVers.JWT_ACCESS_REFRESH_SECRET!) as JwtPayload


     const isUserExist = await User.findOne({email:verifiedrefreshToken.email})
     
         if(!isUserExist){
             throw new AppError(400, "user dose not  exist")
         }

         if(isUserExist.IsActive === isActive.BLOCKED || isUserExist.IsActive === isActive.INACTIVE ){
             throw new AppError(400, `user is ${isUserExist.IsActive}`)
         }

          if(isUserExist.IsDeleted){
             throw new AppError(400, "user is deleted")
         }
   const userTokens = createUserToken(isUserExist)

   return userTokens.accessToken
}