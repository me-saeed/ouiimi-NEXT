import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
    process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production'
);

const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionData {
    userId: string;
    email: string;
    role: string;
    fname?: string;
    lname?: string;
}

/**
 * Create a new session with HttpOnly cookie
 */
export async function createSession(data: SessionData): Promise<void> {
    const token = await new SignJWT(data as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(SECRET);

    cookies().set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    });
}

/**
 * Get current session data
 */
export async function getSession(): Promise<SessionData | null> {
    const sessionCookie = cookies().get('session');

    if (!sessionCookie?.value) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(sessionCookie.value, SECRET);
        return payload as unknown as SessionData;
    } catch (error) {
        // Invalid or expired token
        return null;
    }
}

/**
 * Verify session and return user data (for API routes)
 */
export async function requireSession(): Promise<SessionData> {
    const session = await getSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    return session;
}

/**
 * Verify admin role
 */
export async function requireAdmin(): Promise<SessionData> {
    const session = await requireSession();

    if (session.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }

    return session;
}

/**
 * Destroy current session
 */
export function destroySession(): void {
    cookies().delete('session');
}

/**
 * Update session data (refresh token)
 */
export async function updateSession(data: Partial<SessionData>): Promise<void> {
    const currentSession = await getSession();

    if (!currentSession) {
        throw new Error('No active session');
    }

    await createSession({
        ...currentSession,
        ...data,
    });
}
