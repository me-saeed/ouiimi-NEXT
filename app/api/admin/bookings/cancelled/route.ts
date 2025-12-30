import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { Booking } from "@/lib/models";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function getCancelledBookingsHandler(req: NextRequest) {
    // Rate limiting
    const rateLimitResponse = applyRateLimit(req, 100);
    if (rateLimitResponse) return rateLimitResponse;

    // Admin authentication
    await authenticateAdmin(req);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const type = searchParams.get("type"); // 'customer' or 'business'
    const skip = (page - 1) * limit;

    await dbConnect();

    // Build query
    const query: any = { status: "cancelled" };

    // Optional filter by who cancelled
    if (type) {
        if (type === 'customer') {
            query.cancelledBy = 'customer';
        } else if (type === 'business') {
            query.cancelledBy = 'business';
        }
    }

    const bookings = await Booking.find(query)
        .populate("userId", "fname lname email")
        .populate("businessId", "businessName")
        .populate("serviceId", "serviceName")
        .sort({ cancelledAt: -1, updatedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    const total = await Booking.countDocuments(query);

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
            cancelledBy: b.cancelledBy,
            cancelledAt: b.cancelledAt,
            cancellationReason: b.cancellationReason,
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

export const GET = asyncHandler(getCancelledBookingsHandler);
