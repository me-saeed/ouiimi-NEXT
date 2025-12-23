/**
 * =============================================================================
 * ADMIN RELEASE PAYMENT - /api/admin/bookings/[id]/release-payment
 * =============================================================================
 * 
 * Admin-only endpoint to release payment to business after service completion.
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function releasePaymentHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Strict rate limiting for financial operations
  const rateLimitResponse = applyRateLimit(req, 5);
  if (rateLimitResponse) return rateLimitResponse;

  // Admin authentication
  const adminSession = await authenticateAdmin(req);

  await dbConnect();

  const booking = await Booking.findById(params.id)
    .populate("businessId", "businessName")
    .populate("serviceId", "serviceName");

  if (!booking) {
    throw new APIError(404, "Booking not found", "NOT_FOUND");
  }

  // Validate booking is eligible for payment release
  if (booking.status !== "completed") {
    throw new APIError(400, "Only completed bookings can have payments released", "INVALID_STATUS");
  }

  if (booking.adminPaymentStatus === "released") {
    throw new APIError(400, "Payment already released", "ALREADY_RELEASED");
  }

  // Release payment
  booking.adminPaymentStatus = "released";
  await booking.save();

  console.log(`[ADMIN] Payment released for booking ${params.id} by ${adminSession.email}`);

  return successResponse({
    message: "Payment released successfully",
    booking: {
      id: String(booking._id),
      bookingNumber: booking.bookingNumber,
      serviceAmount: booking.serviceAmount,
      adminPaymentStatus: booking.adminPaymentStatus,
    },
  });
}

export const POST = asyncHandler(releasePaymentHandler);
