import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/services/mailjet";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "Email query param required" }, { status: 400 });
    }

    // Hardcoded known-good data for Business Booking Confirmation
    const testData = {
        fname: "Test Owner",
        customerName: "John Doe (Test)",
        email: email, // Recipient business email
        businessName: "Test Business",
        serviceName: "Test Service",
        date: "12/12/2025",
        time: "10:00 - 11:00",
        bookingId: "TEST-123",
        depositAmount: 25.00,
        totalCost: 50.00,
        outstanding: 25.00
    };

    console.log(`[DebugEmail] Attempting to send Business Confirmation to ${email}`);

    try {
        const success = await sendEmail(
            [email],
            "TEST - New Booking Received",
            testData,
            "booking_confirmation_business" // Using the exact template ID failing
        );

        if (success) {
            return NextResponse.json({ message: "Email sent successfully", data: testData });
        } else {
            return NextResponse.json({ error: "Email send failed (Check terminal logs for Mailjet error)" }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
