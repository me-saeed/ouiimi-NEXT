import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
});

// Webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
                });

                if (booking) {
                    booking.paymentStatus = "deposit_paid";
                    booking.status = "confirmed";
                    await booking.save();
                    console.log(`✅ Booking ${booking._id} updated to confirmed`);
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
