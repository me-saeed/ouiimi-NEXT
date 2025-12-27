import { NextRequest, NextResponse } from "next/server";
import EmailService from "@/lib/email-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "Email query param required" }, { status: 400 });
    }

    // Hardcoded known-good data for Business Booking Confirmation
    const testData = {
        booking: {
            _id: "TEST-123",
            bookingNumber: "TEST-123",
            totalCost: 50.00,
            depositAmount: 25.00,
            remainingAmount: 25.00,
            timeSlot: {
                date: new Date(),
                startTime: "10:00",
                endTime: "11:00"
            }
        },
        customer: {
            fname: "John",
            lname: "Doe (Test)",
            email: "test@shopper.com"
        },
        business: {
            businessName: "Test Business",
            email: email, // Recipient business email
            address: "123 Test St"
        },
        service: {
            serviceName: "Test Service"
        }
    };

    console.log(`[DebugEmail] Attempting to send Business Confirmation via EmailService to ${email}`);

    try {
        await EmailService.sendNewBookingToBusiness(testData as any);
        return NextResponse.json({ message: "Email sent successfully via EmailService", data: testData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
