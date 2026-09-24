
import { z } from "zod";

export const createUserZodSchema = z.object({
  body: z.object({
    name: z
      .string("Name must be string")
      .min(1, { message: "Name must be at least 1 character long" })
      .max(50, { message: "Name cannot exceed 50 characters" }),

    email: z
      .string("Email must be string")
      .email({ message: "Invalid email address format" })
      .min(5, { message: "Email must be at least 5 characters long" })
      .max(100, { message: "Email cannot exceed 100 characters" }),

    password: z
      .string("Password must be string"),

  }),
});

