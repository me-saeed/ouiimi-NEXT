/**
 * =============================================================================
 * SESSION CHECK API - /api/auth/session
 * =============================================================================
 * 
 * Returns current session information for the authenticated user.
 * Used by frontend to check authentication status.
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/session
 * Returns current user session if authenticated, null otherwise
 */
async function getSessionHandler(req: NextRequest) {
    const session = await getSession();

    if (!session) {
        return successResponse({
            user: null,
            authenticated: false
        });
    }

    return successResponse({
        user: {
            id: session.userId,
            email: session.email,
            fname: session.fname,
            lname: session.lname,
            role: session.role,
        },
        authenticated: true,
    });
}

export const GET = asyncHandler(getSessionHandler);
