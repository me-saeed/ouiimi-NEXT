/**
 * =============================================================================
 * ADMIN BUSINESS REJECT - /api/admin/businesses/[id]/reject
 * =============================================================================
 * 
 * Admin-only endpoint to reject business registrations.
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function rejectBusinessHandler(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Rate limiting (strict for admin actions)
    const rateLimitResponse = applyRateLimit(req, 10);
    if (rateLimitResponse) return rateLimitResponse;

    // Admin authentication
    const adminSession = await authenticateAdmin(req);

    await dbConnect();

    const business = await Business.findById(params.id);
    if (!business) {
        throw new APIError(404, "Business not found", "NOT_FOUND");
    }

    // Capture reason if provided
    let reason = "Business registration rejected by admin";
    try {
        const body = await req.json();
        if (body.reason) reason = body.reason;
    } catch (e) {
        // Body is optional
    }

    business.status = "rejected";
    business.adminNotes = reason; // Store rejection reason
    await business.save();

    console.log(`[ADMIN] Business ${params.id} REJECTED by ${adminSession.email}. Reason: ${reason}`);

    return successResponse({
        message: "Business rejected successfully",
        business: {
            id: String(business._id),
            businessName: business.businessName,
            status: business.status,
        },
    });
}

export const POST = asyncHandler(rejectBusinessHandler);
