/**
 * Get the base URL for the application
 * Works in both server and client components
 * 
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL (production deployment)
 * 2. NEXTAUTH_URL (fallback)
 * 3. Production domain if NODE_ENV === 'production'
 * 4. localhost:3000 (development)
 */
export function getBaseUrl(): string {
    // 1. Check NEXT_PUBLIC_SITE_URL (Always priority)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }

    // 2. Check NEXTAUTH_URL
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    // 3. Development fallback - ONLY if explicitly in development AND no site url is set
    // But we prefer ouiimi.com.au if we are unsure, to be safe for emails
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3000';
    }

    // 4. Default to production domain
    return 'https://ouiimi.com.au';
}

/**
 * Get API base URL
 */
export function getApiUrl(): string {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    return getBaseUrl();
}
