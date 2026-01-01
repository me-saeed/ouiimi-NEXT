/**
 * =============================================================================
 * BUSINESS SESSION CHECK API - /api/auth/business-session/check
 * =============================================================================
 * 
 * Returns whether user has an active business session.
 */

import { NextRequest } from "next/server";
import { getBusinessSession } from "@/lib/business-session";
import { asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function checkBusinessSessionHandler(req: NextRequest) {
    const session = await getBusinessSession();

    return successResponse({
        hasSession: !!session,
        userId: session?.userId || null,
        businessId: session?.businessId || null,
    });
}

export const GET = asyncHandler(checkBusinessSessionHandler);
