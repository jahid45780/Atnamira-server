"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserZodSchema = void 0;
const zod_1 = require("zod");
exports.createUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string("Name must be string")
            .min(1, { message: "Name must be at least 1 character long" })
            .max(50, { message: "Name cannot exceed 50 characters" }),
        email: zod_1.z
            .string("Email must be string")
            .email({ message: "Invalid email address format" })
            .min(5, { message: "Email must be at least 5 characters long" })
            .max(100, { message: "Email cannot exceed 100 characters" }),
        password: zod_1.z
            .string("Password must be string"),
    }),
});
