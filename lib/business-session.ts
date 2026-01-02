/**
 * =============================================================================
 * BUSINESS SESSION MANAGEMENT
 * =============================================================================
 * 
 * Separate session for business dashboard access.
 * Requires re-authentication even when already logged in as shopper.
 * Session is cleared when leaving business routes.
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
    process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production'
);

// Business session expires after 15 minutes of inactivity (sliding window)
const BUSINESS_SESSION_DURATION = 15 * 60; // 15 minutes in seconds

export interface BusinessSessionData {
    userId: string;
    email: string;
    businessId?: string;
    authenticatedAt: number; // Timestamp when business session was created
}

/**
 * Create a business session after re-authentication
 */
export async function createBusinessSession(data: Omit<BusinessSessionData, 'authenticatedAt'>): Promise<string> {
    const sessionData: BusinessSessionData = {
        ...data,
        authenticatedAt: Date.now(),
    };

    const token = await new SignJWT(sessionData as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(SECRET);

    // Set cookie
    try {
        const cookieStore = cookies();
        cookieStore.set('business-session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: BUSINESS_SESSION_DURATION,
            path: '/',
        });
    } catch (e) {
        // If cookies() fails (in API routes), return token to set manually
    }

    return token;
}

/**
 * Get current business session data
 */
export async function getBusinessSession(): Promise<BusinessSessionData | null> {
    try {
        const sessionCookie = cookies().get('business-session');

        if (!sessionCookie?.value) {
            return null;
        }

        const { payload } = await jwtVerify(sessionCookie.value, SECRET);
        return payload as unknown as BusinessSessionData;
    } catch (error) {
        // Invalid or expired token
        return null;
    }
}

/**
 * Check if business session exists
 */
export async function hasBusinessSession(): Promise<boolean> {
    const session = await getBusinessSession();
    return session !== null;
}

/**
 * Require business session (throws if not authenticated for business)
 */
export async function requireBusinessSession(): Promise<BusinessSessionData> {
    const session = await getBusinessSession();

    if (!session) {
        throw new Error('Business authentication required');
    }

    return session;
}

/**
 * Destroy business session (called when leaving business routes)
 */
export function destroyBusinessSession(): void {
    try {
        cookies().delete('business-session');
    } catch (e) {
        // Ignore if cookies() fails
    }
}

/**
 * Check if user recently authenticated for business (within last 15 mins)
 * For additional security checks if needed
 */
export async function isBusinessSessionFresh(maxAgeMs: number = 15 * 60 * 1000): Promise<boolean> {
    const session = await getBusinessSession();
    if (!session) return false;

    const age = Date.now() - session.authenticatedAt;
    return age < maxAgeMs;
}
