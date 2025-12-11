import { NextRequest, NextResponse } from "next/server";
import { logger } from "../logger";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 minutes default
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10000", 10); // 10000 for development, set lower in production

// Cleanup interval to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

/**
 * Rate Limiting Function
 * Features:
 * - IP-based rate limiting
 * - Configurable windows and limits
 * - Memory-efficient with automatic cleanup
 * - Ready for Redis integration for distributed systems
 * 
 * TODO: For production at scale, integrate Redis:
 * - Install: npm install ioredis
 * - Use Redis for distributed rate limiting across multiple servers
 */
export function rateLimit(req: NextRequest): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const identifier = getIdentifier(req);
  const now = Date.now();

  if (!store[identifier] || store[identifier].resetTime < now) {
    store[identifier] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      reset: store[identifier].resetTime,
    };
  }

  if (store[identifier].count >= MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', {
      ip: identifier,
      count: store[identifier].count,
      limit: MAX_REQUESTS,
    });

    return {
      success: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      reset: store[identifier].resetTime,
    };
  }

  store[identifier].count++;
  return {
    success: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - store[identifier].count,
    reset: store[identifier].resetTime,
  };
}

function getIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
  return ip;
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const limit = rateLimit(req);

      if (!limit.success) {
        const retryAfter = Math.ceil((limit.reset - Date.now()) / 1000);

        return NextResponse.json(
          {
            error: "Too many requests. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: retryAfter,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.limit.toString(),
              "X-RateLimit-Remaining": limit.remaining.toString(),
              "X-RateLimit-Reset": limit.reset.toString(),
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }

      const response = await handler(req);
      response.headers.set("X-RateLimit-Limit", limit.limit.toString());
      response.headers.set("X-RateLimit-Remaining", limit.remaining.toString());
      response.headers.set("X-RateLimit-Reset", limit.reset.toString());

      return response;
    } catch (error: any) {
      logger.error("Rate limit wrapper error", error);
      return NextResponse.json(
        {
          error: "Internal server error",
          code: "INTERNAL_ERROR"
        },
        { status: 500 }
      );
    }
  };
}

export function withRateLimitDynamic<T extends { params: { [key: string]: string } }>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: T) => {
    try {
      const limit = rateLimit(req);

      if (!limit.success) {
        const retryAfter = Math.ceil((limit.reset - Date.now()) / 1000);

        return NextResponse.json(
          {
            error: "Too many requests. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: retryAfter,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.limit.toString(),
              "X-RateLimit-Remaining": limit.remaining.toString(),
              "X-RateLimit-Reset": limit.reset.toString(),
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }

      const response = await handler(req, context);
      response.headers.set("X-RateLimit-Limit", limit.limit.toString());
      response.headers.set("X-RateLimit-Remaining", limit.remaining.toString());
      response.headers.set("X-RateLimit-Reset", limit.reset.toString());

      return response;
    } catch (error: any) {
      logger.error("Rate limit wrapper error", error);
      return NextResponse.json(
        {
          error: "Internal server error",
          code: "INTERNAL_ERROR"
        },
        { status: 500 }
      );
    }
  };
}

