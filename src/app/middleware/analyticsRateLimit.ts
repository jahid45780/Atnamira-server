import rateLimit from "express-rate-limit";

export const analyticsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute

  // One IP can send maximum 60 analytics events/minute
  limit: 60,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many analytics events. Please try again later.",
  },
});