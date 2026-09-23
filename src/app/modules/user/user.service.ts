import { JwtPayload } from "jsonwebtoken";
import { envVers } from "../../config/env";
import AppError from "../../errorHerplrs/appError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import bcrypt from "bcrypt";
import  httpStatus  from 'http-status-codes';

const createUser = async (payload:Partial<IUser>)=>{

    const {email, password, ...rest} = payload;

     const isUserExist = await User.findOne({email});

      if(isUserExist){
          throw new AppError(400, "User already exist")
      }

     const hashedPassword = await bcrypt.hash(password as string, Number(envVers.BCRYPT_SALT_ROUND))

     const authProvider:IAuthProvider ={provider:"credentials", providerID: email as string }
    
      const user = await User.create({
                 email ,
                 password:hashedPassword,
                 auths:[authProvider],
                ...rest
            })

        return user;    

    
}

 const updateUser  = async (userId:string, payload:Partial<IUser>, decodedToken:JwtPayload)=>{
    
    if(decodedToken.role === Role.USER || decodedToken.role === Role.ADMIN){
        if(userId !== decodedToken.userId){
            throw new AppError(401,"your not authorized")
        }
    }

    const isUserExist = await User.findById(userId)

    if(!isUserExist){
        throw new AppError(httpStatus.NOT_FOUND,"User Not found")
    }

    if(decodedToken.role === Role.ADMIN && isUserExist.role === Role.ADMIN){
        throw new AppError(401, "your not authorized")
    }
    
    if(payload.role){
            if(decodedToken.role === Role.USER || decodedToken.role === Role.ADMIN){
                throw new AppError(httpStatus.FORBIDDEN,"you are not authorized")
            }
        }


        if(payload.IsActive, payload.IsDeleted, payload.IsVerified){
             if(decodedToken.role === Role.USER || decodedToken.role === Role.ADMIN){
                throw new AppError(httpStatus.FORBIDDEN,"you are not authorized")
            }
        }

        const newUpdateUser = await User.findByIdAndUpdate(userId, payload ,{new:true, runValidators:true} )

        return newUpdateUser
}

const getAllUsers = async ()=>{
    const users = (await User.find({})
    .select("-password")
    .sort({ createdAt: -1 }))

    const totalUsers = await User.countDocuments()
     

    return{
        data:users,
        meta:{
            total:totalUsers
        }

    }
}

const getSingleUser = async (id: string) => {
    const user = await User.findById(id).select("-password");
    return {
        data: user
    }
};




const getMe = async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    return {
        data: user
    }
};


/**
 * Make USER → ADMIN
 */
const makeAdmin = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found",
    );
  }

  if (user.role === Role.ADMIN) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User is already an admin",
    );
  }

  user.role = Role.ADMIN;

  await user.save();

  return User.findById(userId).select("-password");
};

/**
 * Make ADMIN → USER
 */
const makeUser = async (
  userId: string,
  adminId?: string,
) => {
  // Admin cannot demote himself
  if (userId === adminId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot demote yourself",
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found",
    );
  }

  if (user.role === Role.USER) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User is already a USER",
    );
  }

  user.role = Role.USER;

  await user.save();

  return User.findById(userId).select("-password");
};

/**
 * Delete user
 */
const deleteUser = async (
  userId: string,
  adminId?: string,
) => {
  // Admin cannot delete himself
  if (userId === adminId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot delete your own account",
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found",
    );
  }

  await User.findByIdAndDelete(userId);

  return null;
};


  export const userService = {
     createUser,
     updateUser,
     getSingleUser,
     getMe,
     getAllUsers,
     makeAdmin,
     makeUser,
     deleteUser,

 }