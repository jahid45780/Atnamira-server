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
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./app/config/env");
const app_1 = __importDefault(require("./app"));
let server;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(env_1.envVers.NODE_ENV);
        yield mongoose_1.default.connect(env_1.envVers.DB_URL);
        console.log("contend to DB!!");
        server = app_1.default.listen(env_1.envVers.PORT, () => {
            console.log(`app is listen on the port ${env_1.envVers.PORT}`);
        });
    }
    catch (error) {
        console.log(error);
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield startServer();
}))();
process.on("SIGINT", () => {
    console.log("SIGINT detected ... server shutting down");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
        process.exit(1);
    }
});
process.on("unhandledRejection", (err) => {
    console.log("UnhandledRejection detected ... server shutting down", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
        process.exit(1);
    }
});
process.on("uncaughtException", (err) => {
    console.log("UncaughtException detected ... server shutting down", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
        process.exit(1);
    }
});
