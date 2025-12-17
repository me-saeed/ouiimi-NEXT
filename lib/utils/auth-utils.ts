/**
 * Authentication Utilities
 * Centralized authentication and authorization logic
 */

import { verifyToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User, { IUser } from '@/lib/models/User';

export interface AuthUser {
    id: string;
    fname: string;
    lname: string;
    email: string;
    username?: string;
    roles: string[];
}

/**
 * Get user from JWT token
 */
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
    try {
        const decoded = verifyToken(token);

        await dbConnect();
        const user = await User.findById(decoded.userId);

        if (!user) {
            return null;
        }

        return {
            id: String(user._id),
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            username: user.username,
            roles: user.Roles || ['user'],
        };
    } catch (error) {
        console.error('[Auth Utils] Error getting user from token:', error);
        return null;
    }
}

/**
 * Verify if user has required role
 */
export async function verifyUserRole(
    userId: string,
    requiredRole: string
): Promise<boolean> {
    try {
        await dbConnect();
        const user: IUser | null = await User.findById(userId);

        if (!user) {
            return false;
        }

        return user.Roles?.includes(requiredRole) || false;
    } catch (error) {
        console.error('[Auth Utils] Error verifying user role:', error);
        return false;
    }
}

/**
 * Check if user has role from token
 */
export function hasRoleFromToken(token: string, requiredRole: string): boolean {
    try {
        const decoded = verifyToken(token);
        return decoded.roles?.includes(requiredRole) || false;
    } catch (error) {
        return false;
    }
}

/**
 * Get redirect URL based on user roles and requested path
 */
export function getPostSigninRedirect(
    user: { roles?: string[] },
    requestedPath?: string | null
): string {
    // If there's a requested path that's not signin/signup/auth pages, go there
    if (
        requestedPath &&
        requestedPath !== '/' &&
        !requestedPath.startsWith('/signin') &&
        !requestedPath.startsWith('/signup') &&
        !requestedPath.startsWith('/api')
    ) {
        return requestedPath;
    }

    // Admin users go to admin dashboard
    if (user.roles?.includes('admin')) {
        return '/admin/dashboard';
    }

    // For business users, suggest dashboard (will redirect to register if needed)
    // This is checked on the dashboard page itself
    if (user.roles?.includes('business')) {
        return '/business/dashboard';
    }

    // Regular users go to home
    return '/';
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader?: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.replace('Bearer ', '');
}

/**
 * Require authentication - throws error if not authenticated
 * Use in API routes
 */
export async function requireAuth(
    authHeader?: string | null,
    requiredRole?: string
): Promise<AuthUser> {
    const token = extractBearerToken(authHeader);

    if (!token) {
        throw new Error('UNAUTHORIZED');
    }

    const user = await getUserFromToken(token);

    if (!user) {
        throw new Error('UNAUTHORIZED');
    }

    if (requiredRole && !user.roles.includes(requiredRole)) {
        throw new Error('FORBIDDEN');
    }

    return user;
}
