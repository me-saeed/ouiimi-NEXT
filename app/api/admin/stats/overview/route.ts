/**
 * =============================================================================
 * ADMIN STATS OVERVIEW - /api/admin/stats/overview (Production-Ready)
 * =============================================================================
 * 
 * Admin dashboard statistics endpoint.
 * Requires admin role authentication.
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import Booking from "@/lib/models/Booking";
import User from "@/lib/models/User";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function getStatsHandler(req: NextRequest) {
    // Rate limiting
    const rateLimitResponse = applyRateLimit(req, 30);
    if (rateLimitResponse) return rateLimitResponse;

    // Admin authentication
    await authenticateAdmin(req);

    await dbConnect();

    // Fetch all stats in parallel for performance
    const [
        totalUsers,
        totalBusinesses,
        pendingBusinesses,
        approvedBusinesses,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        revenue
    ] = await Promise.all([
        User.countDocuments(),
        Business.countDocuments(),
        Business.countDocuments({ status: "pending" }),
        Business.countDocuments({ status: "approved" }),
        Booking.countDocuments(),
        Booking.countDocuments({ status: "pending" }),
        Booking.countDocuments({ status: "confirmed" }),
        Booking.aggregate([
            { $match: { paymentStatus: { $in: ["deposit_paid", "fully_paid"] } } },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ])
    ]);

    return successResponse({
        users: {
            total: totalUsers,
        },
        businesses: {
            total: totalBusinesses,
            pending: pendingBusinesses,
            approved: approvedBusinesses,
        },
        bookings: {
            total: totalBookings,
            pending: pendingBookings,
            confirmed: confirmedBookings,
        },
        revenue: {
            total: revenue[0]?.total || 0,
        },
    });
}

export const GET = asyncHandler(getStatsHandler);
