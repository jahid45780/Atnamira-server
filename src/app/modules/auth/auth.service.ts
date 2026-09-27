import AppError from "../../errorHerplrs/appError";
import { createUserToken } from "../../utils/userTokens";
import { IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import bcrypt  from 'bcrypt';


const credentialsLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;

  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(400, "email does not exist");
  }

  // VERIFY CHECK
  // if (!isUserExist.IsVerified) {
  //   throw new AppError(401, "User is not verified");
  // }

  const isPasswordMatched = await bcrypt.compare(
    password as string,
    isUserExist.password as string
  );

  if (!isPasswordMatched) {
    throw new AppError(400, "incorrect password");
  }

  const { password: pass, ...res } = isUserExist.toObject();

  const userTokens = createUserToken({
    _id: isUserExist._id.toString(),
    email: isUserExist.email,
    role: isUserExist.role as string,
  });

  return {
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    user: res,
  };
};

export const authService ={
   credentialsLogin

}