import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import { verifyToken } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

        // Verify user has admin role
        if (!decoded.roles?.includes('admin')) {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        await dbConnect();

        // Get all bookings with released payment status
        const releasedBookings = await Booking.find({
            adminPaymentStatus: "released",
            status: "completed"
        })
            .populate("userId", "fname lname email")
            .populate("businessId", "businessName logo address")
            .populate("serviceId", "serviceName category")
            .sort({ updatedAt: -1 })
            .limit(100); // Limit to last 100 released payments

        return NextResponse.json({
            bookings: releasedBookings.map((booking: any) => ({
                id: String(booking._id),
                bookingNumber: booking.bookingNumber,
                userId: booking.userId,
                businessId: booking.businessId,
                serviceId: booking.serviceId,
                timeSlot: booking.timeSlot,
                addOns: booking.addOns,
                totalCost: booking.totalCost,
                depositAmount: booking.depositAmount,
                remainingAmount: booking.remainingAmount,
                platformFee: booking.platformFee || 1.99,
                serviceAmount: booking.serviceAmount,
                status: booking.status,
                paymentStatus: booking.paymentStatus,
                adminPaymentStatus: booking.adminPaymentStatus,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
            })),
        });
    } catch (error: any) {
        console.error("Error fetching payment history:", error);
        return NextResponse.json(
            { error: "Failed to fetch payment history" },
            { status: 500 }
        );
    }
}
