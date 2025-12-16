import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
import Booking from "@/lib/models/Booking";
import { verifyToken } from "@/lib/jwt";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

export const dynamic = 'force-dynamic';

async function getDashboardStatsHandler(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        // Check if user is admin
        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user || !user.Roles.includes("admin")) {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        // Get counts
        const totalUsers = await User.countDocuments();
        const totalBusinesses = await Business.countDocuments();
        const pendingBusinesses = await Business.countDocuments({ status: "pending" });
        const approvedBusinesses = await Business.countDocuments({ status: "approved" });
        const totalBookings = await Booking.countDocuments();

        // Get booking stats
        const completedBookings = await Booking.countDocuments({ status: "completed" });
        const pendingBookings = await Booking.countDocuments({ status: "pending" });
        const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });

        // Calculate revenue (this month)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyBookings = await Booking.find({
            createdAt: { $gte: firstDayOfMonth },
            status: { $in: ["confirmed", "completed"] }
        }).lean();

        const revenueThisMonth = monthlyBookings.reduce((sum, booking: any) => {
            return sum + (booking.totalCost || 0);
        }, 0);

        const platformFeesThisMonth = monthlyBookings.reduce((sum, booking: any) => {
            return sum + (booking.platformFee || 0);
        }, 0);

        // Pending payments
        const pendingPayments = await Booking.find({
            adminPaymentStatus: "pending",
            paymentStatus: { $in: ["deposit_paid", "fully_paid"] }
        }).lean();

        const totalPendingAmount = pendingPayments.reduce((sum, booking: any) => {
            return sum + (booking.serviceAmount || booking.totalCost || 0);
        }, 0);

        return NextResponse.json(
            {
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
                    completed: completedBookings,
                    pending: pendingBookings,
                    confirmed: confirmedBookings,
                },
                revenue: {
                    thisMonth: revenueThisMonth,
                    platformFees: platformFeesThisMonth,
                },
                payments: {
                    pendingAmount: totalPendingAmount,
                    pendingCount: pendingPayments.length,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Get dashboard stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}

export const GET = withRateLimitDynamic(getDashboardStatsHandler);
