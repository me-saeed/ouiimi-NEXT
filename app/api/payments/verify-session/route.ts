/**
 * =============================================================================
 * VERIFY SESSION API ROUTE - /api/payments/verify-session
 * =============================================================================
 * 
 * This endpoint verifies a Stripe Checkout Session after payment completion.
 * It's called from the confirmation page after user returns from Stripe.
 * 
 * HTTP METHOD: POST
 * 
 * REQUEST BODY:
 * {
 *   "sessionId": "cs_xxx...",    // Stripe Checkout Session ID
 *   "bookingId": "booking_id"     // Our booking ID
 * }
 * 
 * RESPONSE (Success - 200):
 * {
 *   "success": true,
 *   "booking": {
 *     "id": "booking_id",
 *     "status": "confirmed",
 *     "paymentStatus": "deposit_paid"
 *   }
 * }
 * 
 * RESPONSE (Error - 400): { "error": "Payment not completed" }
 * 
 * VERIFICATION FLOW:
 * 1. User completes payment on Stripe's hosted page
 * 2. Stripe redirects to: /bookings/{id}/confirm?session_id={CHECKOUT_SESSION_ID}
 * 3. Confirmation page calls this endpoint with sessionId and bookingId
 * 4. We retrieve session from Stripe and check payment_status === "paid"
 * 5. If paid, update booking:
 *    - status: "pending" → "confirmed"
 *    - paymentStatus: "pending" → "deposit_paid"
 * 6. Return success response to show confirmation to user
 * 
 * WHY THIS MATTERS:
 * - Confirms payment actually succeeded (not just returned from Stripe)
 * - Updates booking status so business sees confirmed booking
 * - Protects against fake confirmation page visits
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import User from "@/lib/models/User";

// =============================================================================
// LAZY STRIPE INITIALIZATION
// =============================================================================
// Initialize Stripe lazily to avoid build-time errors in CI/CD
// when environment variables aren't available
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY environment variable is not set");
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-11-17.clover",
        });
    }
    return stripeInstance;
}

/**
 * POST handler - Verifies Stripe payment and confirms booking
 */
export async function POST(request: NextRequest) {
    try {
        // =====================================================================
        // STEP 1: Extract session and booking IDs
        // =====================================================================
        const { sessionId, bookingId } = await request.json();

        if (!sessionId || !bookingId) {
            return NextResponse.json(
                { error: "Session ID and Booking ID are required" },
                { status: 400 }
            );
        }

        // =====================================================================
        // STEP 2: Retrieve Checkout Session from Stripe
        // =====================================================================
        // This is the authoritative source of payment status
        // We call Stripe's API to verify the session is actually paid
        const session = await getStripe().checkout.sessions.retrieve(sessionId);

        // =====================================================================
        // STEP 3: Verify payment was completed
        // =====================================================================
        // payment_status can be: "paid", "unpaid", or "no_payment_required"
        // We only confirm booking if status is "paid"
        if (session.payment_status !== "paid") {
            return NextResponse.json(
                { error: "Payment not completed" },
                { status: 400 }
            );
        }

        // =====================================================================
        // STEP 4: Connect to database and update booking
        // =====================================================================
        await dbConnect();

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // =====================================================================
        // STEP 5: Update booking status to confirmed
        // =====================================================================
        // paymentStatus: "pending" → "deposit_paid" (customer paid 10%)
        // status: "pending" → "confirmed" (booking is now active)
        booking.paymentStatus = "deposit_paid";
        booking.status = "confirmed";
        await booking.save();

        // =====================================================================
        // STEP 5.5: Send Confirmation Emails (Reliability Fallback)
        // =====================================================================
        // We trigger email here as well to ensure delivery even if webhook fails
        // (common in dev/localhost without public URL).
        try {
            // Re-fetch with population to ensure we have all data
            // Use _id from the already fetched booking object
            const populatedBooking = await Booking.findById(booking._id)
                .populate("userId", "fname lname email")
                .populate("businessId", "businessName email")
                .populate("serviceId", "serviceName");

            if (populatedBooking) {
                const user = populatedBooking.userId as any;
                const business = populatedBooking.businessId as any;
                const service = populatedBooking.serviceId as any;

                // Use serviceSnapshot as fallback if service was deleted
                const serviceData = service || {
                    serviceName: (populatedBooking as any).serviceSnapshot?.name || 'Service',
                    category: (populatedBooking as any).serviceSnapshot?.category || ''
                };

                if (user && business) {
                    const emailPayload = {
                        booking: booking as any,
                        customer: user,
                        business: business,
                        service: serviceData
                    };

                    const EmailService = (await import("@/lib/email-service")).default;

                    Promise.all([
                        EmailService.sendBookingConfirmation(emailPayload),
                        EmailService.sendNewBookingToBusiness(emailPayload)
                    ]).catch(err => console.error("⚠️ Failed to send confirmation emails in verify-session:", err));
                }
            }
        } catch (emailErr) {
            console.error("⚠️ Failed to send confirmation emails in verify-session:", emailErr);
            // Non-blocking: continue to success response
        }

        // =====================================================================
        // STEP 6: Return success response
        // =====================================================================
        return NextResponse.json({
            success: true,
            booking: {
                id: booking._id,
                status: booking.status,
                paymentStatus: booking.paymentStatus,
            },
        });
    } catch (error: any) {
        console.error("Session verification error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to verify payment" },
            { status: 500 }
        );
    }
}
