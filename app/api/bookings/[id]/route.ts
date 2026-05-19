/**
 * =============================================================================
 * BOOKING BY ID API - /api/bookings/[id] (Production-Ready)
 * =============================================================================
 * 
 * GET: Requires session auth (users can only view their own bookings)
 * PUT: Requires session auth (updates, cancellations)
 * DELETE: Requires session auth + ownership
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
// Import from models index to ensure all models are registered
import { Booking, Service, Business, User, Staff } from "@/lib/models";
import { BookingService } from "@/lib/services/booking-service";
// Also import types directly if needed, or rely on Booking model exports
import { PopulatedBooking } from "@/lib/models/Booking";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, successResponse } from "@/lib/api-response";
import EmailService from "@/lib/email-service";
import { getBusinessSession } from "@/lib/business-session";
import { z } from "zod";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

const bookingUpdateSchema = z.object({
  status: z.enum(["pre_payment", "pending", "confirmed", "completed", "cancelled", "refunded"]).optional(),
  paymentStatus: z.enum(["pending", "deposit_paid", "fully_paid", "refunded"]).optional(),
  businessNotes: z.string().optional(),
  cancellationReason: z.string().optional(),
  cancelledBy: z.enum(["customer", "business"]).optional(),
});

// =============================================================================
// GET Booking by ID
// =============================================================================
async function getBookingHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  const booking = await Booking.findById(params.id)
    .populate("userId", "fname lname email contactNo")
    .populate("businessId", "businessName logo address email phone")
    .populate("serviceId", "serviceName category description")
    .populate("staffId", "name photo")
    .lean();

  if (!booking) {
    throw new APIError(404, "Booking not found", "NOT_FOUND");
  }

  // Security: Verify user can access this booking
  const bookingUserId = typeof booking.userId === 'object' ? (booking.userId._id || booking.userId.id) : booking.userId;
  if (String(bookingUserId) !== String(session.userId)) {
    throw new APIError(403, "You can only view your own bookings", "FORBIDDEN");
  }

  return successResponse({ booking });
}

// =============================================================================
// UPDATE Booking (Status, Cancellation)
// =============================================================================
async function updateBookingHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 20);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  const body = await req.json();
  const validatedData = bookingUpdateSchema.parse(body);

  await dbConnect();

  const booking = await Booking.findById(params.id).populate("serviceId businessId");
  if (!booking) {
    throw new APIError(404, "Booking not found", "NOT_FOUND");
  }

  // Check if user is business owner via business session
  // This allows business owners to update/complete bookings for their business
  const businessSession = await getBusinessSession();
  const bookingBusinessId = booking.businessId?._id || booking.businessId;
  const isBusinessOwner = businessSession?.businessId &&
    String(bookingBusinessId) === String(businessSession.businessId);

  // Security: Verify ownership (customer OR business owner)
  if (String(booking.userId) !== String(session.userId) && !isBusinessOwner) {
    throw new APIError(403, "You can only update your own bookings", "FORBIDDEN");
  }

  // Handle cancellation
  if (validatedData.status === "cancelled") {
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = validatedData.cancelledBy; // Save who cancelled it
    booking.cancellationReason = validatedData.cancellationReason || "";

    // Free up the time slot using BookingService to release hold safely (Issue 4 Fix)
    if (booking.serviceId && booking.timeSlot) {
      try {
        await BookingService.releaseHold(String(booking._id));
      } catch (error) {
        console.error("Error freeing slot via BookingService:", error);
      }
    }

    // Send cancellation email (async, don't block response)
    try {
      // Set status for Admin Dashboard Refund Tracking
      if (validatedData.cancelledBy === 'customer') {
        // Set to a special status or use adminPaymentStatus
        booking.adminPaymentStatus = 'refund_pending';
      }

      const bookingWithPopulated = await Booking.findById(booking._id)
        .populate('userId', 'fname lname email contactNo phone')
        .populate('businessId', 'businessName email phone address')
        .populate('serviceId', 'serviceName')
        .lean();

      if (bookingWithPopulated) {
        // Use strictly typed PopulatedBooking (centralized)
        const safeBooking = bookingWithPopulated as unknown as PopulatedBooking;

        // Use serviceSnapshot as fallback if service was deleted
        const serviceData = safeBooking.serviceId || {
          serviceName: (safeBooking as any).serviceSnapshot?.name || 'Service',
          category: (safeBooking as any).serviceSnapshot?.category || ''
        };

        if (safeBooking.userId && safeBooking.businessId) {
          // Calculate refund based on who cancelled
          // Shopper cancels: No refund (50% to ouiimi, 50% to business)
          // Business cancels: Full deposit refund to shopper
          const depositAmount = booking.depositAmount || (booking.totalCost * 0.10);
          const isCustomerCancellation = validatedData.cancelledBy === 'customer';
          const isBusinessCancellation = validatedData.cancelledBy === 'business';

          // Calculate amounts
          const shopperRefund = isBusinessCancellation ? depositAmount : 0;
          const businessPayout = isCustomerCancellation ? (depositAmount * 0.50) : 0;
          const ouiimiPayout = isCustomerCancellation ? (depositAmount * 0.50) : 0;

          // Send cancellation emails to BOTH Business and Customer
          const emailPayload = {
            booking: safeBooking as any,
            customer: safeBooking.userId,
            business: safeBooking.businessId,
            service: serviceData,
            // Refund/payout details
            refundAmount: shopperRefund > 0 ? shopperRefund.toFixed(2) : undefined,
            businessPayout: businessPayout > 0 ? businessPayout.toFixed(2) : undefined,
            cancelledBy: validatedData.cancelledBy,
            // For email logic
            isCustomerCancellation,
            isBusinessCancellation,
            noRefund: isCustomerCancellation // Shopper gets nothing if they cancelled
          };

          Promise.all([
            EmailService.sendCancellationToBusiness(emailPayload),
            EmailService.sendCancellationToCustomer(emailPayload)
          ]).catch(err => console.error('Cancellation email failed:', err));
        }
      }
    } catch (emailError) {
      console.error('Failed to prepare cancellation email:', emailError);
    }
  }

  // Handle completion
  if (validatedData.status === "completed") {
    booking.status = "completed";

    // IMPORTANT: When marked complete, it moves to "Pending Payout" queue for Admin
    booking.adminPaymentStatus = "pending";
  } else if (validatedData.status) {
    // Other status updates
    booking.status = validatedData.status;
  }

  // Apply other updates
  if (validatedData.businessNotes) booking.businessNotes = validatedData.businessNotes;
  if (validatedData.paymentStatus) booking.paymentStatus = validatedData.paymentStatus;

  await booking.save();

  return successResponse({
    message: "Booking updated successfully",
    booking: {
      id: String(booking._id),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    },
  });
}

// =============================================================================
// DELETE Booking
// =============================================================================
async function deleteBookingHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 10);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  const booking = await Booking.findById(params.id);
  if (!booking) {
    throw new APIError(404, "Booking not found", "NOT_FOUND");
  }

  // Security: Verify ownership
  if (String(booking.userId) !== String(session.userId)) {
    throw new APIError(403, "You can only delete your own bookings", "FORBIDDEN");
  }

  // Don't allow deletion of confirmed/paid bookings
  if (booking.status === "confirmed" || booking.paymentStatus !== "pending") {
    throw new APIError(400, "Cannot delete confirmed or paid bookings", "INVALID_STATUS");
  }

  await Booking.findByIdAndDelete(params.id);

  return successResponse({
    message: "Booking deleted successfully",
  });
}

// =============================================================================
// EXPORTS
// =============================================================================
export const GET = asyncHandler(getBookingHandler);
export const PUT = asyncHandler(updateBookingHandler);
export const DELETE = asyncHandler(deleteBookingHandler);
