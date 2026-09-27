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
exports.systemHealthService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const os_1 = __importDefault(require("os"));
const perf_hooks_1 = require("perf_hooks");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const getDatabaseHealth = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const start = perf_hooks_1.performance.now();
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            return {
                status: "down",
                responseTime: null,
                message: "MongoDB is not connected",
            };
        }
        yield (_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.admin().ping();
        const responseTime = Math.round(perf_hooks_1.performance.now() - start);
        return {
            status: "healthy",
            responseTime: `${responseTime}ms`,
            message: "MongoDB is connected",
        };
    }
    catch (error) {
        return {
            status: "down",
            responseTime: null,
            message: "MongoDB health check failed",
        };
    }
});
const getCloudinaryHealth = () => __awaiter(void 0, void 0, void 0, function* () {
    const start = perf_hooks_1.performance.now();
    try {
        yield cloudinary_config_1.cloudinaryUpload.api.ping();
        const responseTime = Math.round(perf_hooks_1.performance.now() - start);
        return {
            status: "healthy",
            responseTime: `${responseTime}ms`,
            message: "Cloudinary is connected",
        };
    }
    catch (error) {
        return {
            status: "down",
            responseTime: null,
            message: "Cloudinary health check failed",
        };
    }
});
const getMemoryHealth = () => {
    const memory = process.memoryUsage();
    const totalMemory = os_1.default.totalmem();
    const freeMemory = os_1.default.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usedPercentage = ((usedMemory / totalMemory) *
        100).toFixed(2);
    const heapUsed = (memory.heapUsed /
        1024 /
        1024).toFixed(2);
    const heapTotal = (memory.heapTotal /
        1024 /
        1024).toFixed(2);
    return {
        status: Number(usedPercentage) < 90
            ? "healthy"
            : "warning",
        system: {
            total: `${(totalMemory /
                1024 /
                1024 /
                1024).toFixed(2)} GB`,
            free: `${(freeMemory /
                1024 /
                1024 /
                1024).toFixed(2)} GB`,
            used: `${(usedMemory /
                1024 /
                1024 /
                1024).toFixed(2)} GB`,
            usedPercentage: `${usedPercentage}%`,
        },
        process: {
            heapUsed: `${heapUsed} MB`,
            heapTotal: `${heapTotal} MB`,
        },
    };
};
const getSystemHealth = () => __awaiter(void 0, void 0, void 0, function* () {
    const start = perf_hooks_1.performance.now();
    const database = yield getDatabaseHealth();
    const cloudinary = yield getCloudinaryHealth();
    const memory = getMemoryHealth();
    const apiResponseTime = Math.round(perf_hooks_1.performance.now() - start);
    const overallHealthy = database.status === "healthy" &&
        cloudinary.status === "healthy";
    return {
        status: overallHealthy
            ? "healthy"
            : "warning",
        checkedAt: new Date().toISOString(),
        server: {
            status: "healthy",
            environment: process.env.NODE_ENV || "development",
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            uptime: process.uptime(),
            hostname: os_1.default.hostname(),
            cpuCount: os_1.default.cpus().length,
            apiResponseTime: `${apiResponseTime}ms`,
        },
        database,
        cloudinary,
        memory,
    };
});
exports.systemHealthService = {
    getSystemHealth,
};
