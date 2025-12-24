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
    // Check environment variables
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }

    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    // Production fallback - use your actual production domain
    if (process.env.NODE_ENV === 'production') {
        return 'https://ouiimi.com.au';
    }

    // Development fallback
    return 'http://localhost:3000';
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
