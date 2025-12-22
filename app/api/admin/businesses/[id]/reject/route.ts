/**
 * =============================================================================
 * ADMIN BUSINESS REJECT - /api/admin/businesses/[id]/reject
 * =============================================================================
 * 
 * Admin-only endpoint to reject pending businesses.
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
    // Rate limiting
    const rateLimitResponse = applyRateLimit(req, 10);
    if (rateLimitResponse) return rateLimitResponse;

    // Admin authentication
    const adminSession = await authenticateAdmin(req);

    const body = await req.json();
    const reason = body.reason || "No reason provided";

    await dbConnect();

    const business = await Business.findById(params.id);
    if (!business) {
        throw new APIError(404, "Business not found", "NOT_FOUND");
    }

    if (business.status !== "pending") {
        throw new APIError(400, "Only pending businesses can be rejected", "INVALID_STATUS");
    }

    business.status = "rejected";
    // Note: rejection reason logged but not stored in current model
    await business.save();

    console.log(`[ADMIN] Business ${params.id} rejected by ${adminSession.email}: ${reason}`);

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
