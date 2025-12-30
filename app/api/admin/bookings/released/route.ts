/**
 * =============================================================================
 * ADMIN RELEASED PAYMENTS - /api/admin/bookings/released
 * =============================================================================
 * 
 * Admin-only endpoint to view all bookings with released payments.
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import User from "@/lib/models/User";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function getReleasedPaymentsHandler(req: NextRequest) {
    // Rate limiting
    const rateLimitResponse = applyRateLimit(req, 100);
    if (rateLimitResponse) return rateLimitResponse;

    // Admin authentication
    await authenticateAdmin(req);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    await dbConnect();

    const bookings = await Booking.find({ adminPaymentStatus: "released" })
        .populate("businessId", "businessName email")
        .populate("serviceId", "serviceName")
        .populate("userId", "fname lname")
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    const total = await Booking.countDocuments({ adminPaymentStatus: "released" });

    // Calculate total released amount
    const totalReleased = await Booking.aggregate([
        { $match: { adminPaymentStatus: "released" } },
        { $group: { _id: null, total: { $sum: "$serviceAmount" } } }
    ]);

    return successResponse({
        bookings: bookings.map((b: any) => ({
            id: String(b._id),
            bookingNumber: b.bookingNumber,
            businessId: b.businessId,
            serviceId: b.serviceId,
            userId: b.userId,
            serviceAmount: b.serviceAmount,
            updatedAt: b.updatedAt,
        })),
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        summary: {
            totalReleased: totalReleased[0]?.total || 0,
        },
    });
}

export const GET = asyncHandler(getReleasedPaymentsHandler);
