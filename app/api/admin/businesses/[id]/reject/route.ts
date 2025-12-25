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
import { EmailService } from "@/lib/email-service";

export const dynamic = 'force-dynamic';

async function rejectBusinessHandler(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Rate limiting (60 requests per minute for admin actions - increased for testing)
    const rateLimitResponse = applyRateLimit(req, 60);
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

    // Send rejection email
    try {
        const businessWithUser = await Business.findById(params.id).populate('userId', 'fname lname email');
        if (businessWithUser && businessWithUser.userId) {
            await EmailService.sendBusinessRejected(businessWithUser, businessWithUser.userId, reason);
        }
    } catch (emailError) {
        console.error('[ADMIN] Failed to send rejection email:', emailError);
        // Don't fail the request if email fails
    }

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

export const PUT = asyncHandler(rejectBusinessHandler);
