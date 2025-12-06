import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import { verifyToken } from "@/lib/jwt";
import User from "@/lib/models/User";

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user exists (for now, allow access - can be restricted later)
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Note: Admin role check can be enabled later
    // if (!user.Roles?.includes("admin")) {
    //   return NextResponse.json(
    //     { error: "Admin access required" },
    //     { status: 403 }
    //   );
    // }

    const bookingId = params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Update admin payment status to released
    booking.adminPaymentStatus = "released";
    await booking.save();

    return NextResponse.json({
      message: "Payment released successfully",
      booking: {
        id: booking._id.toString(),
        adminPaymentStatus: booking.adminPaymentStatus,
      },
    });
  } catch (error: any) {
    console.error("Error releasing payment:", error);
    return NextResponse.json(
      { error: "Failed to release payment" },
      { status: 500 }
    );
  }
}
