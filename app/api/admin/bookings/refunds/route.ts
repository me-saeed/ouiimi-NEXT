import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { Booking } from "@/lib/models";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function getRefundBookingsHandler(req: NextRequest) {
    // Rate limiting
    const rateLimitResponse = applyRateLimit(req, 200);
    if (rateLimitResponse) return rateLimitResponse;

    // Admin authentication
    await authenticateAdmin(req);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    await dbConnect();

    const bookings = await Booking.find({
        adminPaymentStatus: "refund_pending"
    })
        .populate("userId", "fname lname email")
        .populate("businessId", "businessName")
        .populate("serviceId", "serviceName")
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    const total = await Booking.countDocuments({
        adminPaymentStatus: "refund_pending"
    });

    return successResponse({
        bookings: bookings.map((b: any) => ({
            id: String(b._id),
            bookingNumber: b.bookingNumber,
            userId: b.userId,
            businessId: b.businessId,
            serviceId: b.serviceId,
            timeSlot: b.timeSlot,
            totalCost: b.totalCost,
            depositAmount: b.depositAmount,
            status: b.status,
            paymentStatus: b.paymentStatus,
            cancelledAt: b.cancelledAt,
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

export const GET = asyncHandler(getRefundBookingsHandler);
