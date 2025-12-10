import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
    try {
        const { sessionId, bookingId } = await request.json();

        if (!sessionId || !bookingId) {
            return NextResponse.json(
                { error: "Session ID and Booking ID are required" },
                { status: 400 }
            );
        }

        // Retrieve the Checkout Session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return NextResponse.json(
                { error: "Payment not completed" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Update booking status to confirmed
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        booking.paymentStatus = "deposit_paid";
        booking.status = "confirmed";
        await booking.save();

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
