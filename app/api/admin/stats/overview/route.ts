/**
 * Admin Dashboard - Overview Stats API
 * Returns key metrics for admin dashboard overview
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import Booking from "@/lib/models/Booking";
import { verifyToken } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Verify admin auth
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded.roles?.includes('admin')) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        await dbConnect();

        // Get current month date range
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Parallel queries for better performance
        const [
            totalBusinesses,
            pendingApproval,
            pendingPayments,
            releasedThisMonth,
        ] = await Promise.all([
            // Total businesses count
            Business.countDocuments(),

            // Businesses pending approval
            Business.countDocuments({ status: "pending" }),

            // Pending payments
            Booking.aggregate([
                {
                    $match: {
                        adminPaymentStatus: { $in: ["pending", null] },
                        status: "confirmed",
                    },
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        totalAmount: { $sum: { $multiply: ["$totalCost", 0.10] } },
                    },
                },
            ]),

            // Released payments this month
            Booking.aggregate([
                {
                    $match: {
                        adminPaymentStatus: "released",
                        updatedAt: { $gte: firstDayOfMonth },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalReleased: {
                            $sum: {
                                $subtract: [
                                    { $multiply: ["$totalCost", 0.10] },
                                    { $ifNull: ["$platformFee", 1.99] },
                                ],
                            },
                        },
                        totalFees: { $sum: { $ifNull: ["$platformFee", 1.99] } },
                    },
                },
            ]),
        ]);

        // Format response
        const stats = {
            totalBusinesses,
            pendingApproval,
            pendingPayments: {
                count: pendingPayments[0]?.count || 0,
                amount: pendingPayments[0]?.totalAmount || 0,
            },
            releasedThisMonth: releasedThisMonth[0]?.totalReleased || 0,
            platformFeesMonth: releasedThisMonth[0]?.totalFees || 0,
        };

        return NextResponse.json({ stats });
    } catch (error: any) {
        console.error("Error fetching overview stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
