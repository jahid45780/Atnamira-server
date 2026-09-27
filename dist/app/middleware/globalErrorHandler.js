"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const env_1 = require("../config/env");
const appError_1 = __importDefault(require("../errorHerplrs/appError"));
const cloudinary_config_1 = require("../config/cloudinary.config");
// import { deleteImageFromCLoudinary } from "../config/cloudinary.config";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler = (err, req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let statusCode = 500;
    let message = 'something went wrong';
    console.log({ file: req.files });
    if (req.file) {
        yield (0, cloudinary_config_1.deleteImageFromCLoudinary)(req.file.path);
    }
    if (req.files && Array.isArray(req.files) && req.files.length) {
        const imageUrls = req.files.map(file => file.path);
        yield Promise.all(imageUrls.map(url => (0, cloudinary_config_1.deleteImageFromCLoudinary)(url)));
    }
    const errorSources = [];
    //    if(err.code === 11000){
    //       const matchedArray = err.message.match(/"([^"]*)"/);
    //       statusCode = 400;
    //       message =`${matchedArray[1]} already existed!! `
    //    }
    if (err.name === "ZodError") {
        statusCode = 400;
        message = "Zod Error";
        err.issues.forEach((issue) => {
            errorSources.push({
                path: issue.path[issue.path.length - 1],
                message: issue.message,
            });
        });
    }
    else if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid  mongoDB objectID  please provided valid id";
    }
    else if (err instanceof appError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err instanceof Error) {
        statusCode = 500;
        message = err.message;
    }
    res.status(statusCode).json({
        success: false,
        message,
        err,
        stack: env_1.envVers.NODE_ENV === "development" ? err.stack : null
    });
});
exports.globalErrorHandler = globalErrorHandler;
