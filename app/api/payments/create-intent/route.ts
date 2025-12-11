/**
 * =============================================================================
 * CREATE PAYMENT INTENT API ROUTE - /api/payments/create-intent
 * =============================================================================
 * 
 * This endpoint creates a Stripe PaymentIntent for embedded payment flow.
 * Used for custom payment UIs (not Checkout Sessions).
 * 
 * HTTP METHOD: POST
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";

// =============================================================================
// LAZY STRIPE INITIALIZATION
// =============================================================================
// Initialize Stripe lazily to avoid build-time errors in CI/CD
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
        const { bookingId } = await request.json();

        if (!bookingId) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        // Connect to database
        await dbConnect();

        // Fetch booking details
        const booking = await Booking.findById(bookingId)
            .populate("serviceId")
            .populate("businessId");

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        const stripe = getStripe();

        // Check if payment already exists - if so, return the existing clientSecret
        if (booking.paymentIntentId) {
            try {
                const existingIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
                return NextResponse.json({
                    clientSecret: existingIntent.client_secret,
                    bookingId: booking._id,
                });
            } catch (error) {
                console.error("Error retrieving existing payment intent:", error);
                // If retrieval fails, create a new one (fallthrough to creation logic)
            }
        }

        // Calculate payment amount
        // depositAmount is already calculated as 10% when booking was created
        // platformFee defaults to $1.99 if not set
        const platformFee = booking.platformFee || 1.99;
        const totalAmount = booking.depositAmount + platformFee;

        // Convert to cents (Stripe requires amount in smallest currency unit)
        const amountInCents = Math.round(totalAmount * 100);

        // Type cast populated fields
        const serviceId = booking.serviceId as any;
        const businessId = booking.businessId as any;

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                bookingId: String(booking._id),
                userId: String(booking.userId),
                businessId: String(businessId._id || businessId),
                serviceId: String(serviceId._id || serviceId),
                depositAmount: booking.depositAmount.toString(),
                platformFee: platformFee.toString(),
            },
            description: `Deposit for ${serviceId.serviceName || "Service"} - ${businessId.businessName || "Business"}`,
        });

        // Store payment intent ID in booking
        booking.paymentIntentId = paymentIntent.id;
        await booking.save();

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: totalAmount,
        });
    } catch (error: any) {
        console.error("Payment intent creation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create payment intent" },
            { status: 500 }
        );
    }
}
