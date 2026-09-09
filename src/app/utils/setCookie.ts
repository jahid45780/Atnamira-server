
import { Response } from "express";
// import { envVers } from "../config/env";

export interface authTokens {
    accessToken?:string;
    refreshToken?:string
}

 export const setAuthCookie = async (res:Response, tokenInfo:authTokens)=>{
   


if(tokenInfo.accessToken){
       res.cookie("AccessToken", tokenInfo.accessToken,{
       httpOnly:true,
       secure:true,
   //  secure:envVers.NODE_ENV === "production",
    sameSite:"none"

   })
}

if(tokenInfo.refreshToken){

      res.cookie("RefreshToken", tokenInfo.refreshToken,{
       httpOnly:true,
       secure:true,
   //  secure:envVers.NODE_ENV === "production",
    sameSite:"none"
   })

}

}