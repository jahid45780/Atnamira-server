
import { model, Schema } from "mongoose";
import { IAuthProvider, isActive, IUser, Role } from "./user.interface";


const authProviderSchema = new Schema<IAuthProvider>({
     provider:{type:String, required:true},
     providerID:{type:String, required:true}
},{
    versionKey:false,
    id:false
})

 export const userSchema = new Schema<IUser>({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String},
    phone:{type:String},
    role:{
        type:String,
        enum:Object.values(Role),
        default:Role.USER
    },
    picture:{type:String},
    address:{type:String},
    IsActive:{
        type:String,
        enum:Object.values(isActive),
        default:isActive.ACTIVE
    },
    IsVerified:{type:Boolean, default:false},
    IsDeleted:{type:Boolean, default:false},
    auths:[authProviderSchema]



},{
    timestamps:true,
    versionKey:false
})

 export const User = model<IUser>("User", userSchema)