import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
    try {
        const { bookingId } = await request.json();

        if (!bookingId) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        await dbConnect();

        const booking = await Booking.findById(bookingId)
            .populate("serviceId")
            .populate("businessId")
            .lean();

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // Calculate payment amount
        const platformFee = booking.platformFee || 1.99;
        const totalAmount = booking.depositAmount + platformFee;
        const amountInCents = Math.round(totalAmount * 100);

        const serviceId = booking.serviceId as any;
        const businessId = booking.businessId as any;

        // Create Stripe Checkout Session (hosted payment page)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `${serviceId?.serviceName || "Service"} - Deposit`,
                            description: `10% deposit for ${businessId?.businessName || "Business"}`,
                        },
                        unit_amount: Math.round(booking.depositAmount * 100),
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
                        unit_amount: Math.round(platformFee * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/bookings/${bookingId}/confirm?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/bookings/${bookingId}/checkout`,
            metadata: {
                bookingId: String(booking._id),
                userId: String(booking.userId),
                businessId: String(businessId?._id || booking.businessId),
                serviceId: String(serviceId?._id || booking.serviceId),
            },
        });

        // Store session ID in booking
        await Booking.findByIdAndUpdate(bookingId, {
            paymentIntentId: session.id, // Store session ID instead of payment intent
        });

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
