
import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: number;
  DB_URL: string;
  NODE_ENV: "development" | "production";

  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES?: string;
  JWT_ACCESS_REFRESH_SECRET: string;
  JWT_ACCESS_REFRESH_EXPIRES: string;

  BCRYPT_SALT_ROUND: string;
  FRONTEND_URL: string;

  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;

  GOOGLE_SEARCH_CONSOLE_CLIENT_ID: string;
  GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET: string;
  GOOGLE_SEARCH_CONSOLE_REDIRECT_URI: string;
  GOOGLE_TOKEN_ENCRYPTION_KEY: string;

  GOOGLE_TAG_MANAGER_CLIENT_ID: string;
  GOOGLE_TAG_MANAGER_CLIENT_SECRET: string;
  GOOGLE_TAG_MANAGER_REDIRECT_URI: string;

  EXPRESS_SESSION_SECRET: string;

  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };

  STRIPE: {
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  };
}

const loadEnvVars = (): EnvConfig => {
  const requiredEnvVars = [
    "DB_URL",
    "NODE_ENV",

    "JWT_ACCESS_SECRET",
    "JWT_ACCESS_EXPIRES",
    "JWT_ACCESS_REFRESH_SECRET",
    "JWT_ACCESS_REFRESH_EXPIRES",

    "BCRYPT_SALT_ROUND",
    "FRONTEND_URL",

    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",

    "GOOGLE_SEARCH_CONSOLE_CLIENT_ID",
    "GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET",
    "GOOGLE_SEARCH_CONSOLE_REDIRECT_URI",
    "GOOGLE_TOKEN_ENCRYPTION_KEY",

    "GOOGLE_TAG_MANAGER_CLIENT_ID",
    "GOOGLE_TAG_MANAGER_CLIENT_SECRET",
    "GOOGLE_TAG_MANAGER_REDIRECT_URI",

    "EXPRESS_SESSION_SECRET",

    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",

    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing env vars: ${key}`);
    }
  });

  return {
    // Render automatically provides PORT
    PORT: Number(process.env.PORT) || 5000,

    DB_URL: process.env.DB_URL as string,

    NODE_ENV: process.env.NODE_ENV as "development" | "production",

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,

    JWT_ACCESS_EXPIRES:
      process.env.JWT_ACCESS_EXPIRES as string,

    JWT_ACCESS_REFRESH_SECRET:
      process.env.JWT_ACCESS_REFRESH_SECRET as string,

    JWT_ACCESS_REFRESH_EXPIRES:
      process.env.JWT_ACCESS_REFRESH_EXPIRES as string,

    BCRYPT_SALT_ROUND:
      process.env.BCRYPT_SALT_ROUND as string,

    FRONTEND_URL:
      process.env.FRONTEND_URL as string,

    GOOGLE_CLIENT_ID:
      process.env.GOOGLE_CLIENT_ID as string,

    GOOGLE_CLIENT_SECRET:
      process.env.GOOGLE_CLIENT_SECRET as string,

    GOOGLE_CALLBACK_URL:
      process.env.GOOGLE_CALLBACK_URL as string,


   GOOGLE_SEARCH_CONSOLE_CLIENT_ID:
   process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID as string,

   GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET:
   process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET as string,

   GOOGLE_SEARCH_CONSOLE_REDIRECT_URI:
   process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI as string,

   GOOGLE_TOKEN_ENCRYPTION_KEY:
   process.env.GOOGLE_TOKEN_ENCRYPTION_KEY as string,

   GOOGLE_TAG_MANAGER_CLIENT_ID:
   process.env.GOOGLE_TAG_MANAGER_CLIENT_ID as string,

   GOOGLE_TAG_MANAGER_CLIENT_SECRET:
   process.env.GOOGLE_TAG_MANAGER_CLIENT_SECRET as string,

   GOOGLE_TAG_MANAGER_REDIRECT_URI:
   process.env.GOOGLE_TAG_MANAGER_REDIRECT_URI as string,

    EXPRESS_SESSION_SECRET:
      process.env.EXPRESS_SESSION_SECRET as string,

    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME:
        process.env.CLOUDINARY_CLOUD_NAME as string,

      CLOUDINARY_API_KEY:
        process.env.CLOUDINARY_API_KEY as string,

      CLOUDINARY_API_SECRET:
        process.env.CLOUDINARY_API_SECRET as string,
    },

    STRIPE: {
      STRIPE_SECRET_KEY:
        process.env.STRIPE_SECRET_KEY as string,

      STRIPE_WEBHOOK_SECRET:
        process.env.STRIPE_WEBHOOK_SECRET as string,
    },
  };
};

export const envVers: EnvConfig = loadEnvVars();