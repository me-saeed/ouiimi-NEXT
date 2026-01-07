/**
 * =============================================================================
 * ADMIN BUSINESSES API - /api/admin/businesses (Production-Ready)
 * =============================================================================
 * 
 * Admin-only endpoint for managing all businesses.
 * Requires admin role authentication.
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

// =============================================================================
// GET All Businesses (Admin Only)
// =============================================================================
async function getBusinessesHandler(req: NextRequest) {
    // Rate limiting
    const rateLimitResponse = applyRateLimit(req, 200);
    if (rateLimitResponse) return rateLimitResponse;

    // Admin authentication
    await authenticateAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    await dbConnect();

    const query: any = {};
    if (status) query.status = status;

    const businesses = await Business.find(query)
        .populate("userId", "fname lname email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    const total = await Business.countDocuments(query);

    return successResponse({
        businesses: businesses.map((b: any) => ({
            id: String(b._id),
            businessName: b.businessName,
            status: b.status,
            owner: b.userId,
            email: b.email,
            phone: b.phone,
            address: typeof b.address === 'object'
                ? `${b.address.street || ''}, ${b.address.city || ''}, ${b.address.state || ''} ${b.address.postalCode || ''}`.trim()
                : b.address || '',
            category: b.category,
            subCategory: b.subCategory,
            logo: b.logo,
            story: b.story,
            bankDetails: b.bankDetails ? {
                name: b.bankDetails.name,
                bsb: b.bankDetails.bsb,
                accountNumber: b.bankDetails.accountNumber
            } : null,
            createdAt: b.createdAt,
        })),
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    });
}

export const GET = asyncHandler(getBusinessesHandler);
