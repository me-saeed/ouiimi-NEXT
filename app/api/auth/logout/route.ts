/**
 * =============================================================================
 * LOGOUT API ROUTE - /api/auth/logout (Production-Ready)
 * =============================================================================
 * 
 * Handles user logout by destroying server-side session.
 * 
 * REQUEST: POST /api/auth/logout
 * Headers: Cookie (session)
 * 
 * RESPONSE: { message: "Logged out successfully" }
 */

import { NextRequest } from "next/server";
import { destroySession, getSession } from "@/lib/session";
import { destroyBusinessSession } from "@/lib/business-session";
import { successResponse, asyncHandler } from "@/lib/api-response";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function logoutHandler(req: NextRequest) {
    // Get current session
    const session = await getSession();

    // Destroy session (removes HttpOnly cookie)
    destroySession();

    // Also destroy business session if it exists
    destroyBusinessSession();

    return successResponse({
        message: "Logged out successfully",
        userId: session?.userId || null,
    });
}

// =============================================================================
// EXPORT
// =============================================================================
export const POST = asyncHandler(logoutHandler);
