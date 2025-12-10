import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
    try {
        const { paymentIntentId } = await request.json();

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: "Payment Intent ID is required" },
                { status: 400 }
            );
        }

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
