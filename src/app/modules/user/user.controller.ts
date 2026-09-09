import { NextFunction, Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync"
import { IUser } from "./user.interface"
import { userService } from "./user.service"
import { sentResponse } from "../../utils/sendResponse"
import httpStatus from "http-status-codes"


const createUser = catchAsync (async  (req:Request, res:Response, next:NextFunction)=>{

     const payload :IUser={
          ...req.body,
        //   picture:req.file?.path
      }
  
  const user  = await userService.createUser(payload)

    sentResponse(res,{
      success:true,
      statusCode:httpStatus.CREATED,
      message:"successfully create user",
      data:user

    })
  

})


  export const userController = {
    createUser,
  }