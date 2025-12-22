import { NextRequest } from 'next/server';
import { requireSession, requireAdmin, SessionData } from './session';
import { APIError, APIErrors } from './api-response';

/**
 * Verify session and return session data for API routes
 * Throws APIError if unauthorized
 */
export async function authenticateRequest(
    request: NextRequest
): Promise<SessionData> {
    try {
        return await requireSession();
    } catch (error) {
        throw APIErrors.Unauthorized;
    }
}

/**
 * Verify admin session for admin-only API routes
 * Throws APIError if unauthorized or not admin
 */
export async function authenticateAdmin(
    request: NextRequest
): Promise<SessionData> {
    try {
        return await requireAdmin();
    } catch (error) {
        if (error instanceof Error && error.message.includes('Forbidden')) {
            throw APIErrors.Forbidden;
        }
        throw APIErrors.Unauthorized;
    }
}

/**
 * Optional authentication - returns session if exists, null if not
 * Does not throw errors
 */
export async function optionalAuth(
    request: NextRequest
): Promise<SessionData | null> {
    try {
        const { getSession } = await import('./session');
        return await getSession();
    } catch {
        return null;
    }
}
