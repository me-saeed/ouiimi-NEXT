/**
 * =============================================================================
 * ADMIN BUSINESS APPROVE - /api/admin/businesses/[id]/approve
 * =============================================================================
 * 
 * Admin-only endpoint to approve pending businesses.
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function approveBusinessHandler(
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

    if (business.status !== "pending") {
        throw new APIError(400, "Only pending businesses can be approved", "INVALID_STATUS");
    }

    business.status = "approved";
    await business.save();

    console.log(`[ADMIN] Business ${params.id} approved by ${adminSession.email}`);

    return successResponse({
        message: "Business approved successfully",
        business: {
            id: String(business._id),
            businessName: business.businessName,
            status: business.status,
        },
    });
}

export const POST = asyncHandler(approveBusinessHandler);
