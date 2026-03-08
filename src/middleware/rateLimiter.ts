import { redis } from "@/db/redis/redis.js";
import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";

// --- Helper to safely create Redis limiters ---
function createLimiter(options: {
  points: number;
  duration: number;
  blockDuration?: number;
  keyPrefix?: string;
}) {
  return new RateLimiterRedis({
    storeClient: redis,
    ...options,
    // fallback if Redis not ready
    insuranceLimiter: new RateLimiterMemory({
      points: options.points,
      duration: options.duration,
    }),
    execEvenly: false,
  });
}

// --- Middleware factory ---
export const createRateLimiterMiddleware = (limiter: RateLimiterRedis) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await limiter.consume(req.ip ?? "unknown-ip");
      next();
    } catch (err: any) {
      // rate-limiter-flexible throws a RateLimiterRes object (not an Error) when limit is exceeded
      if (err?.msBeforeNext !== undefined) {
        const retryAfterSec = Math.ceil(err.msBeforeNext / 1000);
        res.set("Retry-After", String(retryAfterSec));
        res.status(429).json({ message: `Too Many Requests - try again in ${retryAfterSec}s` });
      } else {
        console.error("Rate limiter unexpected error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  };
};

// --- POST Limiters ---
export const postBigRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 5,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "post-big",
  })
);
export const postSmallRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 10,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "post-small",
  })
);
export const postVideoRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 10,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "post-video",
  })
);

// --- UPDATE Limiters ---
export const updateBigRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 5,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "update-big",
  })
);
export const updateSmallRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 10,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "update-small",
  })
);
export const updateVideoRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 2,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "update-video",
  })
);

// --- DELETE Limiters ---
export const deleteBigRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 10,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "delete-big",
  })
);
export const deleteSmallRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 10,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "delete-small",
  })
);
export const deleteVideoRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 5,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "delete-video",
  })
);

// --- GET Limiters ---
export const getSmallContentRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 30,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "get-small-content",
  })
);
export const getBigContentRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 50,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "get-big-content",
  })
);
export const getVideoRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 20,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "get-video",
  })
);

// --- AI Middleware ---
export const aiRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 20,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "ai",
  })
);

// --- Admin Middlewares ---
export const adminBigPostRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 20,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-big-post",
  })
);
export const adminSmallPostRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 40,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-small-post",
  })
);
export const adminVideoPostRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 10,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-video-post",
  })
);

export const adminBigUpdateRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 20,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-big-update",
  })
);
export const adminSmallUpdateRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 40,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-small-update",
  })
);
export const adminVideoUpdateRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 10,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-video-update",
  })
);

export const adminBigDeleteRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 40,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-big-delete",
  })
);
export const adminSmallDeleteRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 40,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-small-delete",
  })
);
export const adminVideoDeleteRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 20,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-video-delete",
  })
);

export const adminGetSmallContentRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 120,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-get-small-content",
  })
);
export const adminGetBigContentRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 80,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-get-big-content",
  })
);
export const adminGetVideoRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 60,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-get-video",
  })
);
export const adminAiRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 80,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "admin-ai",
  })
);

// --- Auth Limiters ---
export const userLoginRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 5,
    duration: 300,
    blockDuration: 900,
    keyPrefix: "user-login",
  })
);
export const userSignupRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 3,
    duration: 600,
    blockDuration: 1800,
    keyPrefix: "user-signup",
  })
);
export const userResetPasswordRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 3,
    duration: 300,
    blockDuration: 900,
    keyPrefix: "user-reset-password",
  })
);

export const userSendOtpRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 3,
    duration: 300,
    blockDuration: 900,
    keyPrefix: "user-send-otp",
  })
);

export const userVerifyOtpRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 3,       // 3 attempts
    duration: 90,    // within the OTP validity window (1.5 min)
    blockDuration: 900, // ban for 15 minutes on exceeded
    keyPrefix: "user-verify-otp",
  })
);


export const adminLoginRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 5,
    duration: 300,
    blockDuration: 900,
    keyPrefix: "admin-login",
  })
);
export const adminSignupRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 10,
    duration: 300,
    blockDuration: 900,
    keyPrefix: "admin-signup",
  })
);

// --- Global Limiter ---
export const globalRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 3000,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "global",
  })
);

export const searchRateLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 60,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "search",
  })
);

export const followLimiter = createRateLimiterMiddleware(
  createLimiter({
    points: 50,
    duration: 60,
    blockDuration: 60,
    keyPrefix: "follow",
  })
);