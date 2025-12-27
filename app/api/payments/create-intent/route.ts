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
import Booking, { IBooking, PopulatedBooking } from "@/lib/models/Booking";
import Business, { IBusiness } from "@/lib/models/Business";
import Service, { IService } from "@/lib/models/Service";

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

        // Safety Check: Ensure populated fields exist (referenced docs might be deleted)
        if (!booking.serviceId || !booking.businessId) {
            return NextResponse.json(
                { error: "The Service or Business associated with this booking no longer exists." },
                { status: 404 }
            );
        }

        if (booking.status === 'cancelled') {
            return NextResponse.json(
                { error: "This booking has been cancelled and cannot be paid for." },
                { status: 400 }
            );
        }

        if (booking.paymentStatus === 'deposit_paid' || booking.status === 'confirmed') {
            return NextResponse.json(
                { error: "This booking has already been paid for." },
                { status: 400 }
            );
        }

        // =========================================================================
        // RACE CONDITION CHECK: Ensure slot is still available
        // =========================================================================
        // We fetch the service fresh to get the latest timeSlots status
        const freshService = await Service.findById(booking.serviceId._id || booking.serviceId).select('timeSlots');

        if (freshService) {
            const bookingDateObj = new Date(booking.timeSlot.date);
            bookingDateObj.setHours(0, 0, 0, 0);
            const bookingDateTimestamp = bookingDateObj.getTime();

            const targetSlot = freshService.timeSlots.find((slot: any) => {
                const slotDate = new Date(slot.date);
                slotDate.setHours(0, 0, 0, 0);
                return slotDate.getTime() === bookingDateTimestamp &&
                    slot.startTime === booking.timeSlot.startTime &&
                    slot.endTime === booking.timeSlot.endTime;
            });

            if (!targetSlot) {
                return NextResponse.json({ error: "This time slot is no longer available." }, { status: 409 });
            }

            if (booking.staffId) {
                const staffAvailability = targetSlot.staffIds?.find((s: any) => String(s.staffId) === String(booking.staffId));
                // If staff entry missing OR marked booked
                if (!staffAvailability || staffAvailability.isBooked) {
                    return NextResponse.json({ error: "The selected staff member is no longer available for this time." }, { status: 409 });
                }
            } else {
                // General slot booking
                if (targetSlot.isBooked) {
                    return NextResponse.json({ error: "This time slot has just been booked by another customer." }, { status: 409 });
                }
            }
        }

        const stripe = getStripe();

        // Check if payment already exists - if so, return the existing clientSecret
        if (booking.paymentIntentId) {
            try {
                const existingIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);

                // RESURRECTION LOGIC: If existing intent is canceled, ignore it and create a new one
                if (existingIntent.status !== 'canceled') {
                    return NextResponse.json({
                        clientSecret: existingIntent.client_secret,
                        bookingId: booking._id,
                    });
                }

                // If canceled, fall through to creation logic below to generate a new one
                console.log(`[Payment] Found canceled intent ${booking.paymentIntentId} for booking ${booking._id}. Creating new one.`);
            } catch (error) {
                console.error("Error retrieving existing payment intent:", error);
                // If retrieval fails, create a new one (fallthrough to creation logic)
            }
        }

        // Calculate payment amount
        // depositAmount is the 10% deposit.
        // We ADD the platform fee ($1.99) to this amount so the CUSTOMER pays for it.
        const { PLATFORM_FEE } = await import("@/lib/constants/pricing");
        const platformFee = booking.platformFee || PLATFORM_FEE;
        const totalAmount = booking.depositAmount + platformFee;

        // Convert to cents (Stripe requires amount in smallest currency unit)
        const amountInCents = Math.round(totalAmount * 100);

        // Type cast populated fields using strict interfaces
        // We use the centralized PopulatedBooking type
        const populatedBooking = booking as unknown as PopulatedBooking;
        const serviceId = populatedBooking.serviceId;
        const businessId = populatedBooking.businessId;

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
