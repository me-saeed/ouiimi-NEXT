/**
 * =============================================================================
 * CREATE CHECKOUT API ROUTE - /api/payments/create-checkout
 * =============================================================================
 * 
 * This endpoint creates a Stripe Checkout Session for processing payments.
 * Stripe Checkout is a hosted payment page that handles all payment UI/security.
 * 
 * HTTP METHOD: POST
 * 
 * REQUEST BODY:
 * {
 *   "bookingId": "booking_id_here"
 * }
 * 
 * RESPONSE (Success - 200):
 * {
 *   "sessionId": "cs_xxx...",      // Stripe session ID
 *   "url": "https://checkout.stripe.com/..."  // Redirect URL for payment
 * }
 * 
 * PAYMENT FLOW:
 * 1. Frontend calls this endpoint with bookingId
 * 2. We fetch booking details from database (with service and business info)
 * 3. Calculate payment: depositAmount (10%) + platformFee ($1.99)
 * 4. Create Stripe Checkout Session with:
 *    - Two line items: Deposit + Platform Fee
 *    - Success URL: /bookings/{id}/confirm?session_id={CHECKOUT_SESSION_ID}
 *    - Cancel URL: /bookings/{id}/checkout
 * 5. Save session ID to booking.paymentIntentId
 * 6. Return session URL to frontend
 * 7. Frontend redirects user to Stripe's hosted payment page
 * 
 * WHY STRIPE CHECKOUT (not embedded)?
 * - Works around ad blockers that block embedded payment forms
 * - Handles 3D Secure authentication automatically
 * - Provides consistent, trusted payment experience
 * - PCI compliance is handled by Stripe
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";

// =============================================================================
// STRIPE CLIENT INITIALIZATION
// =============================================================================
// Initialize Stripe with secret key from environment variables
// apiVersion ensures we're using a specific, tested API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
});

/**
 * POST handler - Creates Stripe Checkout Session
 */
export async function POST(request: NextRequest) {
    try {
        // =====================================================================
        // STEP 1: Extract booking ID from request
        // =====================================================================
        const { bookingId } = await request.json();

        if (!bookingId) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        // =====================================================================
        // STEP 2: Connect to database and fetch booking
        // =====================================================================
        await dbConnect();

        // Use .populate() to fetch related service and business data
        // .lean() returns a plain JavaScript object (faster, no Mongoose overhead)
        const booking = await Booking.findById(bookingId)
            .populate("serviceId")   // Get service details (name, etc.)
            .populate("businessId")  // Get business details (name, etc.)
            .lean();

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // =====================================================================
        // STEP 3: Calculate payment amounts
        // =====================================================================
        // Platform fee: ouiimi's service charge ($1.99)
        // Deposit: 10% of service cost (stored in booking.depositAmount)
        // Total: deposit + platformFee
        const platformFee = booking.platformFee || 1.99;
        const totalAmount = booking.depositAmount + platformFee;
        const amountInCents = Math.round(totalAmount * 100);

        // Extract populated data
        const serviceId = booking.serviceId as any;
        const businessId = booking.businessId as any;

        // =====================================================================
        // STEP 4: Create Stripe Checkout Session
        // =====================================================================
        // stripe.checkout.sessions.create() returns a session with a URL
        // User is redirected to this URL to complete payment on Stripe's page
        const session = await stripe.checkout.sessions.create({
            // Payment methods accepted
            payment_method_types: ["card"],

            // Line items shown on checkout page
            // We show two separate items: Deposit and Platform Fee
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `${serviceId?.serviceName || "Service"} - Deposit`,
                            description: `10% deposit for ${businessId?.businessName || "Business"}`,
                        },
                        unit_amount: Math.round(booking.depositAmount * 100), // Cents
                    },
                    quantity: 1,
                },
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Platform Fee",
                            description: "ouiimi service fee",
                        },
                        unit_amount: Math.round(platformFee * 100), // Cents
                    },
                    quantity: 1,
                },
            ],

            // "payment" mode = one-time payment (not subscription)
            mode: "payment",

            // Where to redirect after successful payment
            // {CHECKOUT_SESSION_ID} is replaced by Stripe with actual session ID
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/bookings/${bookingId}/confirm?session_id={CHECKOUT_SESSION_ID}`,

            // Where to redirect if user cancels payment
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/bookings/${bookingId}/checkout`,

            // Metadata stored with the payment (useful for webhooks)
            metadata: {
                bookingId: String(booking._id),
                userId: String(booking.userId),
                businessId: String(businessId?._id || booking.businessId),
                serviceId: String(serviceId?._id || booking.serviceId),
            },
        });

        // =====================================================================
        // STEP 5: Save session ID to booking
        // =====================================================================
        // We store the session ID so we can verify payment later
        await Booking.findByIdAndUpdate(bookingId, {
            paymentIntentId: session.id, // Store session ID for verification
        });

        // =====================================================================
        // STEP 6: Return session URL to frontend
        // =====================================================================
        // Frontend will redirect user to session.url for payment
        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error("Checkout session creation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
