import { envVers } from "../../config/env";
import AppError from "../../errorHerplrs/appError";
import { IAuthProvider, IUser } from "./user.interface";
import { User } from "./user.model";
import bcrypt from "bcrypt";

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

//  const updateUser  = async (userId:string, payload:Partial<IUser>, decodedToken:JwtPayload)=>{
    
//     if(decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE){
//         if(userId !== decodedToken.userId){
//             throw new AppError(401,"your not authorized")
//         }
//     }

//     const isUserExist = await User.findById(userId)

//     if(!isUserExist){
//         throw new AppError(httpStatue.NOT_FOUND,"User Not found")
//     }

//     if(decodedToken.role === Role.ADMIN && isUserExist.role === Role.SUPER_ADMIN){
//         throw new AppError(401, "your not authorized")
//     }
    
//     if(payload.role){
//             if(decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE){
//                 throw new AppError(httpStatue.FORBIDDEN,"you are not authorized")
//             }
//         }


//         if(payload.IsActive, payload.IsDeleted, payload.IsVerified){
//              if(decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE){
//                 throw new AppError(httpStatue.FORBIDDEN,"you are not authorized")
//             }
//         }

//         const newUpdateUser = await User.findByIdAndUpdate(userId, payload ,{new:true, runValidators:true} )

//         return newUpdateUser
// }

const getAllUsers = async ()=>{
    const users = await User.find({})

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


  export const userService = {
     createUser,
     getSingleUser,
     getMe,
     getAllUsers

 }