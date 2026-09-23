import { NextFunction, Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync"
import { IUser } from "./user.interface"
import { userService } from "./user.service"
import { sentResponse } from "../../utils/sendResponse"
import httpStatus from "http-status-codes"
import { JwtPayload } from "jsonwebtoken"
import AppError from "../../errorHerplrs/appError"


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


const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  if (!req.user) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User is not authenticated"
    );
  }

  const payload = req.body;

  const result = await userService.updateUser(
    userId,
    payload,
    req.user
  );

  sentResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});


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


  const getAllUsers = catchAsync(async(req:Request, res:Response, next:NextFunction)=>{
  const result = await userService.getAllUsers()

  sentResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"successfully get all-users",
    data:result.data,
   
  })

})


 const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload
    const result = await userService.getMe(decodedToken.userId);

    sentResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Your profile Retrieved Successfully",
        data: result.data
    })
})


/**
 * USER → ADMIN
 */
const makeAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const userId = String(req.params.id);

    const result = await userService.makeAdmin(userId);

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User promoted to admin successfully",
      data: result,
    });
  },
);

/**
 * ADMIN → USER
 */
const makeUser = catchAsync(
  async (req: Request, res: Response) => {
    const userId = String(req.params.id);

    const adminId = req.user?.userId;

    const result = await userService.makeUser(
      userId,
      adminId,
    );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin demoted to user successfully",
      data: result,
    });
  },
);

/**
 * Delete user
 */
const deleteUser = catchAsync(
  async (req: Request, res: Response) => {
    const userId = String(req.params.id);

    const adminId = req.user?.userId;

    const result = await userService.deleteUser(
      userId,
      adminId,
    );

    sentResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User deleted successfully",
      data: result,
    });
  },
);


  export const userController = {
    createUser,
    updateUser,
    getSingleUser,
    getAllUsers,
    getMe,
    makeAdmin,
    makeUser,
    deleteUser,
  }
   