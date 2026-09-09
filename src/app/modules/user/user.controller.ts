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


 const getSingleUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const result = await userService.getSingleUser(id);
   sentResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Retrieved Successfully",
        data: result.data
    })
})


  export const userController = {
    createUser,
    getSingleUser
  }