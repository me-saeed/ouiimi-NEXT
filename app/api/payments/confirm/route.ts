/**
 * =============================================================================
 * CONFIRM PAYMENT API ROUTE - /api/payments/confirm
 * =============================================================================
 * 
 * This endpoint confirms a Stripe PaymentIntent-based payment.
 * Used for embedded payment flow (not Checkout Sessions).
 * 
 * HTTP METHOD: POST
 * 
 * REQUEST BODY:
 * {
 *   "paymentIntentId": "pi_xxx..."
 * }
 * 
 * RESPONSE (Success - 200):
 * {
 *   "success": true,
 *   "booking": { id, status, paymentStatus, service, business, timeSlot }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";

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

export async function POST(request: NextRequest) {
    try {
        const { paymentIntentId } = await request.json();

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: "Payment Intent ID is required" },
                { status: 400 }
            );
        }

        // Get Stripe instance (lazy initialization)
        const stripe = getStripe();

        // Retrieve payment intent from Stripe to verify status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
            return NextResponse.json(
                { error: "Payment not successful", status: paymentIntent.status },
                { status: 400 }
            );
        }

        // Connect to database
        await dbConnect();

        // Find booking associated with this payment
        const booking = await Booking.findOne({ paymentIntentId })
            .populate("serviceId")
            .populate("businessId");

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found for this payment" },
                { status: 404 }
            );
        }

        // Update booking payment status
        booking.paymentStatus = "deposit_paid";
        booking.status = "confirmed"; // Move from pending to confirmed
        await booking.save();

        return NextResponse.json({
            success: true,
            booking: {
                id: booking._id,
                status: booking.status,
                paymentStatus: booking.paymentStatus,
                service: booking.serviceId,
                business: booking.businessId,
                timeSlot: booking.timeSlot,
            },
        });
    } catch (error: any) {
        console.error("Payment confirmation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to confirm payment" },
            { status: 500 }
        );
    }
}
