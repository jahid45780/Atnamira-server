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

  export const userService = {
     createUser
 }