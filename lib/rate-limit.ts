import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

// Create cache for rate limiting
// max: Maximum number of items in cache
// ttl: Time to live in milliseconds (60 seconds)
const rateLimitCache = new LRUCache<string, number[]>({
    max: 500,
    ttl: 60000, // 1 minute
});

/**
 * Rate limiter using token bucket algorithm
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum number of requests allowed in the time window
 * @returns RateLimitResult with success status and remaining quota
 */
export function rateLimit(identifier: string, limit = 60): RateLimitResult {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get existing timestamps for this identifier
    const timestamps = rateLimitCache.get(identifier) || [];

    // Filter out timestamps outside the current window
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (validTimestamps.length >= limit) {
        const oldestTimestamp = validTimestamps[0];
        const resetTime = oldestTimestamp + 60000;

        return {
            success: false,
            limit,
            remaining: 0,
            reset: resetTime,
        };
    }

    // Add current timestamp and update cache
    validTimestamps.push(now);
    rateLimitCache.set(identifier, validTimestamps);

    return {
        success: true,
        limit,
        remaining: limit - validTimestamps.length,
        reset: now + 60000,
    };
}

/**
 * Middleware helper to apply rate limiting to API routes
 * @param request - Next.js request object
 * @param limit - Maximum requests per minute (Increased default to 120)
 * @returns Response if rate limited, null otherwise
 */
export function applyRateLimit(
    request: NextRequest,
    limit = 120
): NextResponse | null {
    // Get IP address from various headers (proxy-aware)
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';

    const result = rateLimit(ip, limit);

    if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

        return NextResponse.json(
            {
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
            },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': result.limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.reset.toString(),
                    'Retry-After': retryAfter.toString(),
                },
            }
        );
    }

    return null;
}

/**
 * Rate limit by user ID (for authenticated requests)
 */
export function rateLimitByUser(userId: string, limit = 240): RateLimitResult {
    return rateLimit(`user:${userId}`, limit);
}

/**
 * Strict rate limit for sensitive operations (e.g., password reset)
 */
export function strictRateLimit(identifier: string): RateLimitResult {
    return rateLimit(`strict:${identifier}`, 5); // Only 5 requests per minute
}
