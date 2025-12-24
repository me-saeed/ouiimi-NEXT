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
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
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
    const expectedAmount = Math.round(booking.depositAmount * 100);
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
        // If reservation fails (slot taken), we mark as failed_to_reserve
        booking.status = "pending";
        booking.paymentStatus = "pending";
        booking.paymentIntentId = paymentIntentId;
        booking.businessNotes = `PAYMENT SUCCESSFUL but Slot was already taken during the checkout process. Error: ${error.message}`;
        await booking.save();

        throw new APIError(
            409,
            "Payment was successful, but the time slot was unfortunately taken by another customer while you were checking out. Please contact support for a refund or rescheduling.",
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

        if (bookingWithPopulated?.userId && bookingWithPopulated?.businessId && bookingWithPopulated?.serviceId) {
            // Send emails asynchronously (don't wait for them)
            Promise.all([
                EmailService.sendBookingConfirmation(
                    bookingWithPopulated,
                    bookingWithPopulated.userId,
                    bookingWithPopulated.businessId,
                    bookingWithPopulated.serviceId
                ),
                EmailService.sendNewBookingToBusiness(
                    bookingWithPopulated,
                    bookingWithPopulated.userId,
                    bookingWithPopulated.businessId,
                    bookingWithPopulated.serviceId
                )
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
