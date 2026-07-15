/**
 * =============================================================================
 * ADMIN MARK REFUND DONE - /api/admin/bookings/[id]/mark-refunded
 * =============================================================================
 *
 * Admin-only endpoint to mark a refund as processed.
 * After admin manually processes a refund in Stripe/bank,
 * they call this endpoint to move the booking out of the refund queue.
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import { authenticateAdmin } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

async function markRefundedHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 10);
  if (rateLimitResponse) return rateLimitResponse;

  // Admin authentication
  const adminSession = await authenticateAdmin(req);

  await dbConnect();

  const booking = await Booking.findById(params.id);
  if (!booking) {
    throw new APIError(404, "Booking not found", "NOT_FOUND");
  }

  if (booking.adminPaymentStatus !== "refund_pending") {
    throw new APIError(
      400,
      "This booking does not have a pending refund",
      "INVALID_STATUS"
    );
  }

  // Mark refund as processed — moves it out of the refund queue
  booking.adminPaymentStatus = "cancelled"; // reuses "cancelled" → no payout needed
  await booking.save();

  console.log(
    `[ADMIN] Refund marked as processed for booking ${params.id} by ${adminSession.email}`
  );

  return successResponse({
    message: "Refund marked as processed",
    booking: {
      id: String(booking._id),
      bookingNumber: booking.bookingNumber,
      adminPaymentStatus: booking.adminPaymentStatus,
    },
  });
}

export const POST = asyncHandler(markRefundedHandler);
