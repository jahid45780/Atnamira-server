import mongoose from "mongoose";
import os from "os";
import { performance } from "perf_hooks";

import { cloudinaryUpload } from "../../config/cloudinary.config";

const getDatabaseHealth = async () => {
  const start = performance.now();

  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        status: "down",
        responseTime: null,
        message: "MongoDB is not connected",
      };
    }

    await mongoose.connection.db?.admin().ping();

    const responseTime = Math.round(
      performance.now() - start
    );

    return {
      status: "healthy",
      responseTime: `${responseTime}ms`,
      message: "MongoDB is connected",
    };
  } catch (error) {
    return {
      status: "down",
      responseTime: null,
      message: "MongoDB health check failed",
    };
  }
};

const getCloudinaryHealth = async () => {
  const start = performance.now();

  try {
    await cloudinaryUpload.api.ping();

    const responseTime = Math.round(
      performance.now() - start
    );

    return {
      status: "healthy",
      responseTime: `${responseTime}ms`,
      message: "Cloudinary is connected",
    };
  } catch (error) {
    return {
      status: "down",
      responseTime: null,
      message: "Cloudinary health check failed",
    };
  }
};

const getMemoryHealth = () => {
  const memory = process.memoryUsage();

  const totalMemory = os.totalmem();

  const freeMemory = os.freemem();

  const usedMemory = totalMemory - freeMemory;

  const usedPercentage = (
    (usedMemory / totalMemory) *
    100
  ).toFixed(2);

  const heapUsed = (
    memory.heapUsed /
    1024 /
    1024
  ).toFixed(2);

  const heapTotal = (
    memory.heapTotal /
    1024 /
    1024
  ).toFixed(2);

  return {
    status:
      Number(usedPercentage) < 90
        ? "healthy"
        : "warning",

    system: {
      total: `${(
        totalMemory /
        1024 /
        1024 /
        1024
      ).toFixed(2)} GB`,

      free: `${(
        freeMemory /
        1024 /
        1024 /
        1024
      ).toFixed(2)} GB`,

      used: `${(
        usedMemory /
        1024 /
        1024 /
        1024
      ).toFixed(2)} GB`,

      usedPercentage: `${usedPercentage}%`,
    },

    process: {
      heapUsed: `${heapUsed} MB`,
      heapTotal: `${heapTotal} MB`,
    },
  };
};

const getSystemHealth = async () => {
  const start = performance.now();

  const database = await getDatabaseHealth();

  const cloudinary = await getCloudinaryHealth();

  const memory = getMemoryHealth();

  const apiResponseTime = Math.round(
    performance.now() - start
  );

  const overallHealthy =
    database.status === "healthy" &&
    cloudinary.status === "healthy";

  return {
    status: overallHealthy
      ? "healthy"
      : "warning",

    checkedAt: new Date().toISOString(),

    server: {
      status: "healthy",

      environment:
        process.env.NODE_ENV || "development",

      nodeVersion: process.version,

      platform: process.platform,

      architecture: process.arch,

      uptime: process.uptime(),

      hostname: os.hostname(),

      cpuCount: os.cpus().length,

      apiResponseTime: `${apiResponseTime}ms`,
    },

    database,

    cloudinary,

    memory,
  };
};

export const systemHealthService = {
  getSystemHealth,
};