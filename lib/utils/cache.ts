/**
 * Simple In-Memory Cache Utility
 * 
 * Provides basic caching with TTL support. Can be extended to use Redis later.
 * Use for frequently accessed, relatively static data (service listings, business profiles).
 */

interface CacheEntry {
    data: any;
    expiresAt: number;
}

class SimpleCache {
    private cache: Map<string, CacheEntry> = new Map();
    private defaultTTL: number;

    constructor(defaultTTLSeconds: number = 300) {
        this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
    }

    /**
     * Get cached value
     * @param key Cache key
     * @returns Cached value or null if expired/not found
     */
    get<T = any>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cache value
     * @param key Cache key
     * @param data Data to cache
     * @param ttlSeconds TTL in seconds (optional, uses default if not provided)
     */
    set(key: string, data: any, ttlSeconds?: number): void {
        const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;

        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttl,
        });
    }

    /**
     * Delete cache entry
     * @param key Cache key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        let expired = 0;
        let active = 0;
        const now = Date.now();

        this.cache.forEach((entry) => {
            if (now > entry.expiresAt) {
                expired++;
            } else {
                active++;
            }
        });

        return {
            total: this.cache.size,
            active,
            expired,
        };
    }

    /**
     * Clean up expired entries
     */
    cleanup(): void {
        const now = Date.now();
        const expired: string[] = [];

        this.cache.forEach((entry, key) => {
            if (now > entry.expiresAt) {
                expired.push(key);
            }
        });

        expired.forEach((key) => this.cache.delete(key));
    }
}

// Singleton instance
const cache = new SimpleCache(300); // 5 minutes default TTL

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}

/**
 * Helper function to wrap database queries with caching
 * 
 * @example
 * const services = await withCache(
 *   `services:${category}`,
 *   () => Service.find({ category }).lean(),
 *   300 // 5 minutes
 * );
 */
export async function withCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number
): Promise<T> {
    // Check cache first
    const cached = cache.get<T>(key);
    if (cached !== null) {
        console.log(`[Cache] HIT: ${key}`);
        return cached;
    }

    // Cache miss - fetch data
    console.log(`[Cache] MISS: ${key}`);
    const data = await fetchFn();

    // Store in cache
    cache.set(key, data, ttlSeconds);

    return data;
}

/**
 * Invalidate cache entries by pattern
 * @param pattern Cache key pattern (supports wildcards *)
 */
export function invalidateCache(pattern: string): void {
    if (pattern.includes('*')) {
        // Pattern-based invalidation
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const keys = Array.from(cache['cache'].keys());

        keys.forEach((key) => {
            if (regex.test(key)) {
                cache.delete(key);
                console.log(`[Cache] INVALIDATE: ${key}`);
            }
        });
    } else {
        // Exact key invalidation
        cache.delete(pattern);
        console.log(`[Cache] INVALIDATE: ${pattern}`);
    }
}

/**
 * Get cache instance (for direct access if needed)
 */
export function getCache() {
    return cache;
}

export default cache;
