


import dotenv from "dotenv"

dotenv.config()

interface envConfig{
     PORT: string,
     DB_URL: string,
    NODE_ENV: "development" | "production",
    JWT_ACCESS_SECRET?: string,
    JWT_ACCESS_EXPIRES?: string,
    JWT_ACCESS_REFRESH_SECRET?: string,
    JWT_ACCESS_REFRESH_EXPIRES?: string,
    BCRYPT_SALT_ROUND?: string,
    FRONTEND_URL?: string,
    GOOGLE_CLIENT_ID?: string,
    GOOGLE_CLIENT_SECRET?: string,
    GOOGLE_CALLBACK_URL?: string

}

const loadEnvVars = ():envConfig =>{
    const reqEnvVars : string[] =[
        "PORT","DB_URL","NODE_ENV","JWT_ACCESS_SECRET","JWT_ACCESS_EXPIRES","JWT_ACCESS_REFRESH_SECRET","JWT_ACCESS_REFRESH_EXPIRES","BCRYPT_SALT_ROUND","FRONTEND_URL","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","GOOGLE_CALLBACK_URL"
    ]  
    
    
      reqEnvVars.forEach(key=>{
        if(!process.env[key]){
            throw new Error(`missing  env vars ${key}`)
        }
    })


    return{
    PORT:process.env.PORT as string,    
    DB_URL: process.env.DB_URL as string,
    NODE_ENV:process.env.NODE_ENV as "development" | "production",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
    JWT_ACCESS_REFRESH_SECRET: process.env.JWT_ACCESS_REFRESH_SECRET as string,
    JWT_ACCESS_REFRESH_EXPIRES: process.env.JWT_ACCESS_REFRESH_EXPIRES as string,
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string

    }

}

export const envVers:envConfig = loadEnvVars()





