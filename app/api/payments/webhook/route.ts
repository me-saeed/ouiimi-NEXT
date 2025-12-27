/**
 * =============================================================================
 * STRIPE WEBHOOK API ROUTE - /api/payments/webhook
 * =============================================================================
 * 
 * This endpoint handles Stripe webhook events for async payment updates.
 * Stripe sends events here when payment status changes.
 * 
 * HTTP METHOD: POST
 * AUTHENTICATION: Stripe signature verification
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

function getWebhookSecret(): string {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
    }
    return process.env.STRIPE_WEBHOOK_SECRET;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "No signature found" },
                { status: 400 }
            );
        }

        let event: Stripe.Event;

        try {
            // Verify webhook signature
            const stripe = getStripe();
            event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
        } catch (err: any) {
            console.error("⚠️  Webhook signature verification failed:", err.message);
            return NextResponse.json(
                { error: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        // Connect to database
        await dbConnect();

        // Handle the event
        switch (event.type) {
            case "payment_intent.succeeded":
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log("💰 Payment succeeded:", paymentIntent.id);

                // Update booking status
                const booking = await Booking.findOne({
                    paymentIntentId: paymentIntent.id,
                })
                    .populate("userId", "fname lname email")
                    .populate("businessId", "businessName email")
                    .populate("serviceId", "serviceName");

                if (booking) {
                    // Use BookingService for atomic slot reservation
                    const { BookingService } = await import("@/lib/services/booking-service");
                    try {
                        await BookingService.confirmSlotReservation(String(booking._id));
                        console.log(`✅ Booking ${booking._id} confirmed and slot reserved via webhook`);
                    } catch (error: any) {
                        console.error(`❌ Webhook reservation failed for booking ${booking._id}:`, error);
                        // Slot was taken during payment process. 
                        // We mark as failure, business will need to handle.
                        booking.paymentStatus = "deposit_paid"; // Money was still paid
                        booking.status = "pre_payment"; // Slot not reserved, keep it in pre_payment or mark for manual review
                        booking.businessNotes = `PAYMENT SUCCESS via webhook but Slot was already taken. Error: ${error.message}`;
                        await booking.save();
                    }

                    // Refresh booking to ensure we have latest data for emails
                    const updatedBooking = await Booking.findById(booking._id)
                        .populate("userId", "fname lname email")
                        .populate("businessId", "businessName email")
                        .populate("serviceId", "serviceName");

                    if (!updatedBooking) return; // Should not happen

                    // Prepare email data
                    const user = booking.userId as any;
                    const business = booking.businessId as any;
                    const service = booking.serviceId as any;

                    if (user && business && service) {
                        const emailPayload = {
                            booking: booking as any,
                            customer: user,
                            business: business,
                            service: service
                        };

                        const EmailService = (await import("@/lib/email-service")).default;

                        Promise.all([
                            EmailService.sendBookingConfirmation(emailPayload),
                            EmailService.sendNewBookingToBusiness(emailPayload)
                        ]).catch(err => console.error("⚠️ Failed to send confirmation emails via webhook:", err));
                    }
                } else {
                    console.error(`❌ No booking found for payment ${paymentIntent.id}`);
                }
                break;

            case "payment_intent.payment_failed":
                const failedIntent = event.data.object as Stripe.PaymentIntent;
                console.log("❌ Payment failed:", failedIntent.id);

                // Optionally update booking to mark payment failure
                const failedBooking = await Booking.findOne({
                    paymentIntentId: failedIntent.id,
                });

                if (failedBooking) {
                    // Keep status as pre_payment, customer can retry
                    console.log(`⚠️  Payment failed for booking ${failedBooking._id}`);
                }
                break;

            case "payment_intent.canceled":
                const canceledIntent = event.data.object as Stripe.PaymentIntent;
                console.log("🚫 Payment canceled:", canceledIntent.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook handling error:", error);
        return NextResponse.json(
            { error: error.message || "Webhook handler failed" },
            { status: 500 }
        );
    }
}
