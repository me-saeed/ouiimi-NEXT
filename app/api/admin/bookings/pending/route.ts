import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import { verifyToken } from "@/lib/jwt";
import User from "@/lib/models/User";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    // Check if user is admin (for now, allow access - can be restricted later)
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

    const now = new Date();
    
    // Get all confirmed bookings first, then filter by end time
    const allBookings = await Booking.find({
      adminPaymentStatus: { $in: ["pending", null] },
      status: "confirmed",
    })
      .populate("userId", "fname lname email")
      .populate("businessId", "businessName logo address")
      .populate("serviceId", "serviceName category")
      .populate("staffId", "name")
      .lean();

    // Filter bookings where service end time has passed, then sort
    const bookings = allBookings
      .filter((b: any) => {
        const bookingDate = new Date(b.timeSlot.date);
        const bookingDateTime = new Date(`${bookingDate.toISOString().split('T')[0]}T${b.timeSlot.endTime}`);
        return bookingDateTime <= now;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.timeSlot.date).getTime();
        const dateB = new Date(b.timeSlot.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return b.timeSlot.startTime.localeCompare(a.timeSlot.startTime);
      });

    return NextResponse.json({
      bookings: bookings.map((b: any) => ({
        id: b._id?.toString() || b._id,
        userId: typeof b.userId === 'object' ? {
          id: b.userId._id?.toString(),
          fname: b.userId.fname,
          lname: b.userId.lname,
          email: b.userId.email,
        } : b.userId?.toString(),
        businessId: typeof b.businessId === 'object' ? {
          id: b.businessId._id?.toString(),
          businessName: b.businessId.businessName,
          logo: b.businessId.logo,
          address: b.businessId.address,
        } : b.businessId?.toString(),
        serviceId: typeof b.serviceId === 'object' ? {
          id: b.serviceId._id?.toString(),
          serviceName: b.serviceId.serviceName,
          category: b.serviceId.category,
          baseCost: 0, // Price is now in time slots
          duration: b.serviceId.duration,
        } : b.serviceId?.toString(),
        staffId: b.staffId ? (typeof b.staffId === 'object' ? {
          id: b.staffId._id?.toString(),
          name: b.staffId.name,
        } : b.staffId.toString()) : null,
        timeSlot: b.timeSlot,
        totalCost: b.totalCost,
        platformFee: b.platformFee || 0,
        serviceAmount: b.serviceAmount || (b.totalCost - (b.platformFee || 0)),
        adminPaymentStatus: b.adminPaymentStatus || "pending",
        status: b.status,
        paymentStatus: b.paymentStatus,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching pending bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending bookings" },
      { status: 500 }
    );
  }
}
