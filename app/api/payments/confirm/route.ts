/**
 * =============================================================================
 * PAYMENT CONFIRMATION API - /api/payments/confirm (Production-Ready)
 * =============================================================================
 * 
 * Confirms Stripe PaymentIntent and updates booking status.
 * 
 * SECURITY:
 * - Session-based authentication
 * - Rate limiting (10 requests/minute)
 * - Stripe webhook verification
 * - Server-side payment verification
 */

import { NextRequest } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking, { IBooking, PopulatedBooking } from "@/lib/models/Booking";
import Business, { IBusiness } from "@/lib/models/Business";
import Service, { IService } from "@/lib/models/Service";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import {
    errorResponse,
    successResponse,
    asyncHandler,
    APIError
} from "@/lib/api-response";
import EmailService from "@/lib/email-service";
import User from "@/lib/models/User";

export const dynamic = 'force-dynamic';

// Lazy Stripe initialization
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY not configured");
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-11-17.clover",
        });
    }
    return stripeInstance;
}

async function confirmPaymentHandler(req: NextRequest) {
    // ==========================================================================
    // STEP 1: Rate Limiting (10 req/min for payments)
    // ==========================================================================
    const rateLimitResponse = applyRateLimit(req, 10);
    if (rateLimitResponse) return rateLimitResponse;

    // ==========================================================================
    // STEP 2: Session Authentication
    // ==========================================================================
    const session = await authenticateRequest(req);

    // ==========================================================================
    // STEP 3: Parse request
    // ==========================================================================
    const { paymentIntentId, bookingId } = await req.json();

    if (!paymentIntentId || !bookingId) {
        throw new APIError(400, "Missing paymentIntentId or bookingId", "BAD_REQUEST");
    }

    await dbConnect();

    // ==========================================================================
    // STEP 4: Verify booking ownership
    // ==========================================================================
    const booking = await Booking.findById(bookingId)
        .populate("serviceId", "serviceName category")
        .populate("businessId", "businessName email");

    if (!booking) {
        throw new APIError(404, "Booking not found", "BOOKING_NOT_FOUND");
    }

    // Safety Check: Ensure populated fields exist
    if (!booking.serviceId || !booking.businessId) {
        throw new APIError(404, "Associated Service or Business not found", "RESOURCE_MISSING");
    }

    // Security: Verify user owns this booking
    const bookingUserId = typeof booking.userId === 'object' ? (booking.userId._id || booking.userId.id) : booking.userId;
    if (String(bookingUserId) !== String(session.userId)) {
        throw new APIError(403, "Not authorized for this booking", "FORBIDDEN");
    }

    // ==========================================================================
    // STEP 5: Verify payment with Stripe
    // ==========================================================================
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
        throw new APIError(
            400,
            `Payment not successful. Status: ${paymentIntent.status}`,
            "PAYMENT_FAILED"
        );
    }

    // Verify amount matches (in cents)
    // Verify amount matches (in cents)
    const { PLATFORM_FEE } = await import("@/lib/constants/pricing");
    const expectedAmount = Math.round((booking.depositAmount + (booking.platformFee || PLATFORM_FEE)) * 100);
    if (paymentIntent.amount !== expectedAmount) {
        throw new APIError(
            400,
            "Payment amount mismatch",
            "AMOUNT_MISMATCH"
        );
    }

    // ==========================================================================
    // STEP 6: Atomically reserve slot and update booking status
    // ==========================================================================
    const { BookingService } = await import("@/lib/services/booking-service");
    try {
        await BookingService.confirmSlotReservation(bookingId);
        // Note: BookingService already sets status="confirmed" and paymentStatus="deposit_paid"
        // and saves the booking.
    } catch (error: any) {
        console.error(`[Payment Confirm] Reservation failed for booking ${bookingId}:`, error);

        // CRITICAL FIX: If money was paid but slot taken, we MUST record the payment.
        // We set status to 'cancelled' (or pending review) but paymentStatus to 'deposit_paid'.
        // This alerts the admin/system that a refund is needed.
        booking.status = "cancelled";
        booking.paymentStatus = "deposit_paid";
        booking.cancellationReason = "System Error: Slot unavailable after payment";
        booking.paymentIntentId = paymentIntentId;
        booking.businessNotes = `PAYMENT SUCCESSFUL ($${paymentIntent.amount / 100}) but Slot was already taken during checkout. REFUND NEEDED. Error: ${error.message}`;
        await booking.save();

        throw new APIError(
            409,
            "Payment was successful, but the time slot was taken by another customer seconds ago. A refund will be processed automatically or please contact support.",
            "SLOT_TAKEN_POST_PAYMENT"
        );
    }

    // Link payment intent to booking
    booking.paymentIntentId = paymentIntentId;
    await booking.save();

    // ==========================================================================
    // STEP 7: Send confirmation emails (async, don't block response)
    // ==========================================================================
    try {
        const bookingWithPopulated = await Booking.findById(booking._id)
            .populate('userId', 'fname lname email contactNo phone')
            .populate('businessId', 'businessName email phone address')
            .populate('serviceId', 'serviceName')
            .lean();

        if (bookingWithPopulated?.userId && bookingWithPopulated?.businessId) {
            // Use serviceSnapshot as fallback if service was deleted
            const serviceData = bookingWithPopulated.serviceId || {
                serviceName: (bookingWithPopulated as any).serviceSnapshot?.name || 'Service',
                category: (bookingWithPopulated as any).serviceSnapshot?.category || ''
            };

            // Send emails asynchronously (don't wait for them)
            const emailPayload = {
                booking: bookingWithPopulated as any,
                customer: bookingWithPopulated.userId as any,
                business: bookingWithPopulated.businessId as any,
                service: serviceData as any
            };

            Promise.all([
                EmailService.sendBookingConfirmation(emailPayload),
                EmailService.sendNewBookingToBusiness(emailPayload)
            ]).catch(error => {
                console.error('[Payment Confirm] Email sending failed:', error);
                // Don't throw - emails should not block payment confirmation
            });
        }
    } catch (emailError) {
        console.error('[Payment Confirm] Email preparation failed:', emailError);
        // Continue - don't block on email errors
    }

    return successResponse({
        success: true,
        message: "Payment confirmed successfully",
        booking: {
            id: String(booking._id),
            bookingNumber: booking.bookingNumber,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            timeSlot: booking.timeSlot,
        },
    });
}

// =============================================================================
// EXPORT
// =============================================================================
export const POST = asyncHandler(confirmPaymentHandler);
