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
import {
    sendBookingConfirmationToShopper,
    sendBookingConfirmationToBusiness
} from "@/lib/services/mailjet";

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
                    booking.paymentStatus = "deposit_paid";
                    booking.status = "confirmed";
                    await booking.save();
                    console.log(`✅ Booking ${booking._id} updated to confirmed`);

                    // Prepare email data
                    const user = booking.userId as any;
                    const business = booking.businessId as any;
                    const service = booking.serviceId as any;

                    if (user && business && service) {
                        const emailData = {
                            fname: user.fname,
                            lname: user.lname,
                            email: user.email,
                            businessName: business.businessName,
                            serviceName: service.serviceName,
                            date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            }),
                            time: `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}`,
                            totalCost: booking.totalCost,
                            depositAmount: booking.depositAmount,
                            paymentAmount: booking.depositAmount, // The amount just paid
                            remainingAmount: booking.remainingAmount,
                            bookingId: booking.bookingNumber || (booking._id as any).toString().slice(-6).toUpperCase(),
                            location: business.address || "Business Location" // Fallback if address not populated
                        };

                        // Send confirmation to Shopper
                        try {
                            await sendBookingConfirmationToShopper(user.email, user.fname, emailData);
                            console.log(`📧 Shopper confirmation sent to ${user.email}`);

                            // Send notification to Business
                            // Note: We send to business email, usually fetched from business profile
                            if (business.email) {
                                await sendBookingConfirmationToBusiness(business.email, "Business Owner", {
                                    ...emailData,
                                    customerName: `${user.fname} ${user.lname}`
                                });
                                console.log(`📧 Business notification sent to ${business.email}`);
                            }
                        } catch (emailError) {
                            console.error("⚠️ Failed to send confirmation emails:", emailError);
                            // Don't fail the webhook, just log
                        }
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
                    // Keep status as pending, customer can retry
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
