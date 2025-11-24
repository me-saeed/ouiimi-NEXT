import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 minutes default
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);

export function rateLimit(req: NextRequest): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const identifier = getIdentifier(req);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Clean up old entries
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });

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
        return NextResponse.json(
          {
            error: "Too many requests. Please try again later.",
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.limit.toString(),
              "X-RateLimit-Remaining": limit.remaining.toString(),
              "X-RateLimit-Reset": limit.reset.toString(),
              "Retry-After": Math.ceil((limit.reset - Date.now()) / 1000).toString(),
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
      console.error("Rate limit wrapper error:", error);
      return NextResponse.json(
        { error: "Internal server error", details: error.message },
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
        return NextResponse.json(
          {
            error: "Too many requests. Please try again later.",
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.limit.toString(),
              "X-RateLimit-Remaining": limit.remaining.toString(),
              "X-RateLimit-Reset": limit.reset.toString(),
              "Retry-After": Math.ceil((limit.reset - Date.now()) / 1000).toString(),
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
      console.error("Rate limit wrapper error:", error);
      return NextResponse.json(
        { error: "Internal server error", details: error.message },
        { status: 500 }
      );
    }
  };
}

