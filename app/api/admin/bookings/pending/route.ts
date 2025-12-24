/**
 * =============================================================================
 * ADMIN PENDING BOOKINGS - /api/admin/bookings/pending
 * =============================================================================
 * 
 * Admin-only endpoint to view all pending bookings.
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

async function getPendingBookingsHandler(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 30);
  if (rateLimitResponse) return rateLimitResponse;

  // Admin authentication
  await authenticateAdmin(req);

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const skip = (page - 1) * limit;

  await dbConnect();

  const bookings = await Booking.find({
    status: { $in: ["confirmed", "completed"] },
    adminPaymentStatus: "pending"
  })
    .populate("userId", "fname lname email")
    .populate("businessId", "businessName")
    .populate("serviceId", "serviceName")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Booking.countDocuments({
    status: { $in: ["confirmed", "completed"] },
    adminPaymentStatus: "pending"
  });

  return successResponse({
    bookings: bookings.map((b: any) => ({
      id: String(b._id),
      bookingNumber: b.bookingNumber,
      user: b.userId,
      business: b.businessId,
      service: b.serviceId,
      timeSlot: b.timeSlot,
      totalCost: b.totalCost,
      status: b.status,
      paymentStatus: b.paymentStatus,
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

export const GET = asyncHandler(getPendingBookingsHandler);
