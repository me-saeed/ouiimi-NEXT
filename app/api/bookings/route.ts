import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import User from "@/lib/models/User";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";
import { verifyToken } from "@/lib/jwt";
import { withRateLimit } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/services/mailjet";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const bookingCreateSchema = z.object({
  userId: z.string(),
  businessId: z.string(),
  serviceId: z.string(),
  staffId: z.string().optional(),
  timeSlot: z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  addOns: z.array(z.object({
    name: z.string(),
    cost: z.number().min(0),
  })).optional(),
  totalCost: z.number().min(0),
  customerNotes: z.string().optional(),
});

async function createBookingHandler(req: NextRequest) {
  try {
    console.log("=== CREATE BOOKING API CALLED ===");

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("No authorization header");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("Invalid token");
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    console.log("Token verified, userId:", decoded.userId);

    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const validatedData = bookingCreateSchema.parse(body);
    console.log("Validated data:", validatedData);

    if (String(validatedData.userId) !== String(decoded.userId)) {
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 403 }
      );
    }

    await dbConnect();
    console.log("Database connected");

    const mongoose = (await import("mongoose")).default;
    const bookingDate = new Date(validatedData.timeSlot.date);
    // Convert 12-hour format (e.g., "11:00 AM") to 24-hour format (e.g., "11:00")
    const convertTo24Hour = (time12: string): string => {
      const trimmed = time12.trim();
      const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) {
        // Already in 24-hour format or invalid
        return trimmed;
      }
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3].toUpperCase();

      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      return `${String(hours).padStart(2, "0")}:${minutes}`;
    };

    let bookingStartTime = validatedData.timeSlot.startTime.trim();
    let bookingEndTime = validatedData.timeSlot.endTime.trim();

    // Convert to 24-hour format if needed
    if (bookingStartTime.includes("AM") || bookingStartTime.includes("PM")) {
      bookingStartTime = convertTo24Hour(bookingStartTime);
    }
    if (bookingEndTime.includes("AM") || bookingEndTime.includes("PM")) {
      bookingEndTime = convertTo24Hour(bookingEndTime);
    }

    console.log("[Booking API] Time conversion - Original:", validatedData.timeSlot.startTime, "->", bookingStartTime);
    console.log("[Booking API] Time conversion - Original:", validatedData.timeSlot.endTime, "->", bookingEndTime);

    // Check if staff is already booked at this time (across ALL services)
    if (validatedData.staffId) {
      const staffId = new mongoose.Types.ObjectId(validatedData.staffId);

      // Create date range for the booking day
      const bookingDayStart = new Date(bookingDate);
      bookingDayStart.setHours(0, 0, 0, 0);
      const bookingDayEnd = new Date(bookingDate);
      bookingDayEnd.setHours(23, 59, 59, 999);

      // Find all existing bookings for this staff member at the same date and overlapping time
      const conflictingBookings = await Booking.find({
        staffId: staffId,
        status: { $in: ["pending", "confirmed"] }, // Only check active bookings
        "timeSlot.date": {
          $gte: bookingDayStart,
          $lte: bookingDayEnd,
        },
        $or: [
          // New booking starts during existing booking
          {
            $and: [
              { "timeSlot.startTime": { $lte: bookingStartTime } },
              { "timeSlot.endTime": { $gt: bookingStartTime } },
            ],
          },
          // New booking ends during existing booking
          {
            $and: [
              { "timeSlot.startTime": { $lt: bookingEndTime } },
              { "timeSlot.endTime": { $gte: bookingEndTime } },
            ],
          },
          // New booking completely overlaps existing booking
          {
            $and: [
              { "timeSlot.startTime": { $gte: bookingStartTime } },
              { "timeSlot.endTime": { $lte: bookingEndTime } },
            ],
          },
          // Existing booking completely overlaps new booking
          {
            $and: [
              { "timeSlot.startTime": { $lte: bookingStartTime } },
              { "timeSlot.endTime": { $gte: bookingEndTime } },
            ],
          },
        ],
      });

      if (conflictingBookings.length > 0) {
        console.log("Staff conflict detected:", conflictingBookings.length, "conflicting bookings");
        return NextResponse.json(
          {
            error: "Staff member is already booked at this time. Please select a different time slot or staff member.",
            details: "The selected staff member has another booking during this time period."
          },
          { status: 409 } // Conflict status
        );
      }
    }

    // 1. Recalculate Cost on Server (Security Fix)
    // First, fetch the service to get base cost
    const service = await Service.findById(validatedData.serviceId);
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Ignore validatedData.totalCost from client
    // Find the time slot to get its price
    console.log("[Booking API] Searching for slot - Date:", bookingDate, "Start:", bookingStartTime, "End:", bookingEndTime);
    console.log("[Booking API] Service has", service.timeSlots?.length || 0, "time slots");

    // Normalize dates for comparison
    const bookingDateObj = new Date(bookingDate);
    bookingDateObj.setHours(0, 0, 0, 0);
    const bookingDateTimestamp = bookingDateObj.getTime();

    const targetSlot = service.timeSlots.find((slot: any) => {
      const slotDate = new Date(slot.date);
      slotDate.setHours(0, 0, 0, 0);
      const slotDateTimestamp = slotDate.getTime();

      const dateMatch = slotDateTimestamp === bookingDateTimestamp;
      const startMatch = slot.startTime === bookingStartTime;
      const endMatch = slot.endTime === bookingEndTime;

      if (dateMatch && startMatch && endMatch) {
        console.log("[Booking API] Found matching slot:", {
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price
        });
      }

      return dateMatch && startMatch && endMatch;
    });

    if (!targetSlot) {
      console.error("[Booking API] Slot not found! Available slots for date:",
        service.timeSlots
          .filter((s: any) => {
            const sd = new Date(s.date);
            sd.setHours(0, 0, 0, 0);
            return sd.getTime() === bookingDateTimestamp;
          })
          .map((s: any) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            price: s.price,
            isBooked: s.isBooked
          }))
      );
    }

    // Use time slot price, default to 0 if not found
    let calculatedTotalCost = targetSlot?.price || 0;
    console.log("[Booking API] Target slot price:", targetSlot?.price, "Calculated total:", calculatedTotalCost);

    // Add Add-ons cost
    if (validatedData.addOns && validatedData.addOns.length > 0) {
      validatedData.addOns.forEach((addOn: any) => {
        calculatedTotalCost += addOn.cost;
      });
    }

    console.log("Calculated Total Cost:", calculatedTotalCost);

    // 2. Atomic Double Booking Check & Update (Race Condition Fix)
    // We try to find the service AND update the specific slot in one atomic operation
    // The query ensures the slot exists AND isBooked is false

    // Note: We need to match the slot by date, startTime, endTime
    // MongoDB array filters are perfect for this

    const bookingId = new mongoose.Types.ObjectId();

    console.log("[Booking API] Attempting atomic update with:", {
      serviceId: validatedData.serviceId,
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime
    });

    const updatedService = await Service.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(validatedData.serviceId),
        timeSlots: {
          $elemMatch: {
            date: bookingDate,
            startTime: bookingStartTime,
            endTime: bookingEndTime,
            isBooked: false // CRITICAL: Only update if currently free
          }
        }
      },
      {
        $set: {
          "timeSlots.$.isBooked": true,
          "timeSlots.$.bookingId": bookingId
        }
      },
      { new: true }
    );

    if (!updatedService) {
      console.error("[Booking API] Atomic update failed - Checking why...");
      // Check if slot exists but is already booked
      const serviceCheck = await Service.findById(validatedData.serviceId);
      if (serviceCheck) {
        const slotCheck = serviceCheck.timeSlots.find((slot: any) => {
          const slotDate = new Date(slot.date);
          slotDate.setHours(0, 0, 0, 0);
          return slotDate.getTime() === bookingDateTimestamp &&
            slot.startTime === bookingStartTime &&
            slot.endTime === bookingEndTime;
        });

        if (slotCheck) {
          console.error("[Booking API] Slot found but isBooked:", slotCheck.isBooked);
        } else {
          console.error("[Booking API] Slot not found in database at all");
        }
      }

      return NextResponse.json(
        { error: "This time slot is no longer available. Please select another time." },
        { status: 409 }
      );
    }

    console.log("Atomic slot reservation successful");

    // Generate sequential booking number starting from 5000
    const lastBooking = await Booking.findOne().sort({ bookingNumber: -1 }).select('bookingNumber');
    const bookingNumber = lastBooking?.bookingNumber ? lastBooking.bookingNumber + 1 : 5000;
    console.log("Generated booking number:", bookingNumber);

    // Calculate platform fee (e.g., 1.99) and service amount
    const PLATFORM_FEE = 1.99;
    const platformFee = PLATFORM_FEE;
    const serviceAmount = calculatedTotalCost - platformFee;

    const bookingData: any = {
      _id: bookingId,
      bookingNumber: bookingNumber,
      userId: new mongoose.Types.ObjectId(validatedData.userId),
      businessId: new mongoose.Types.ObjectId(validatedData.businessId),
      serviceId: new mongoose.Types.ObjectId(validatedData.serviceId),
      timeSlot: {
        date: bookingDate,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
      },
      totalCost: calculatedTotalCost, // Use server-calculated cost
      depositAmount: Math.round(calculatedTotalCost * 0.1 * 100) / 100,
      remainingAmount: Math.round(calculatedTotalCost * 0.9 * 100) / 100,
      platformFee: platformFee,
      serviceAmount: serviceAmount,
      status: "pending",  // Changed to pending - will be confirmed after payment
      paymentStatus: "pending",
      adminPaymentStatus: "pending", // Admin needs to release payment
    };

    if (validatedData.staffId) {
      bookingData.staffId = new mongoose.Types.ObjectId(validatedData.staffId);
      console.log("Staff ID added:", validatedData.staffId);
    }

    if (validatedData.addOns && validatedData.addOns.length > 0) {
      bookingData.addOns = validatedData.addOns;
      console.log("Add-ons added:", validatedData.addOns.length);
    }

    if (validatedData.customerNotes) {
      bookingData.customerNotes = validatedData.customerNotes;
    }

    console.log("Creating booking with data:", JSON.stringify(bookingData, null, 2));
    const booking = await Booking.create(bookingData);
    console.log("Booking created, ID:", String(booking._id));

    console.log("Booking created, ID:", String(booking._id));

    // Time slot was already marked as booked in the atomic update step above

    // Ensure all models are registered before populate (Staff is already imported at top)
    // Models are auto-registered when imported, but double-check for safety
    if (!mongoose.models.Business) {
      await import("@/lib/models/Business");
    }
    if (!mongoose.models.Service) {
      await import("@/lib/models/Service");
    }
    if (!mongoose.models.User) {
      await import("@/lib/models/User");
    }

    // Staff model should be registered from import, but verify
    if (!mongoose.models.Staff) {
      console.warn("[Booking API] Staff model not registered, importing...");
      await import("@/lib/models/Staff");
    }

    console.log("[Booking API] Populating booking with related data...");
    const savedBooking = await Booking.findById(booking._id)
      .populate("userId", "fname lname email")
      .populate("businessId", "businessName logo address email phone")
      .populate("serviceId", "serviceName category")
      .populate("staffId", "name photo")
      .lean();

    if (!savedBooking) {
      console.error("Booking was not saved to database!");
      return NextResponse.json(
        { error: "Failed to save booking to database. Please try again." },
        { status: 500 }
      );
    }

    console.log("Booking verified in database. ID:", String(savedBooking._id));

    let userIdData: any;
    if (savedBooking.userId && typeof savedBooking.userId === 'object' && 'fname' in savedBooking.userId) {
      const user = savedBooking.userId as any;
      userIdData = {
        id: user._id?.toString() || user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
      };
    } else {
      userIdData = savedBooking.userId?.toString() || savedBooking.userId;
    }

    let businessIdData: any;
    if (savedBooking.businessId && typeof savedBooking.businessId === 'object' && 'businessName' in savedBooking.businessId) {
      const business = savedBooking.businessId as any;
      businessIdData = {
        id: business._id?.toString() || business._id,
        businessName: business.businessName,
        email: business.email, // CRITICAL FIX: Ensure email is passed
      };
    } else {
      businessIdData = savedBooking.businessId?.toString() || savedBooking.businessId;
    }

    let serviceIdData: any;
    if (savedBooking.serviceId && typeof savedBooking.serviceId === 'object' && 'serviceName' in savedBooking.serviceId) {
      const service = savedBooking.serviceId as any;
      serviceIdData = {
        id: service._id?.toString() || service._id,
        serviceName: service.serviceName,
      };
    } else {
      serviceIdData = savedBooking.serviceId?.toString() || savedBooking.serviceId;
    }

    let staffIdData: any = null;
    if (savedBooking.staffId) {
      if (typeof savedBooking.staffId === 'object' && 'name' in savedBooking.staffId) {
        const staff = savedBooking.staffId as any;
        staffIdData = {
          id: staff._id?.toString() || staff._id,
          name: staff.name,
        };
      } else {
        staffIdData = savedBooking.staffId.toString();
      }
    }

    // Send confirmation email
    try {
      if (userIdData && typeof userIdData === 'object' && userIdData.email) {
        const businessName = typeof businessIdData === 'object' ? businessIdData.businessName : "Business";
        const serviceName = typeof serviceIdData === 'object' ? serviceIdData.serviceName : "Service";
        const date = new Date(savedBooking.timeSlot.date).toLocaleDateString("en-GB");
        const time = `${savedBooking.timeSlot.startTime} - ${savedBooking.timeSlot.endTime}`;

        await sendEmail(
          [userIdData.email],
          "Booking Confirmed - ouiimi",
          {
            fname: userIdData.fname || "Customer",
            email: userIdData.email,
            businessName,
            serviceName,
            date,
            time,
            totalCost: savedBooking.totalCost,
            depositAmount: savedBooking.depositAmount,
            bookingId: String(savedBooking._id).slice(-8),
            // outstanding balance for shopper template
            outstanding: savedBooking.remainingAmount
          },
          "booking_confirmation_shopper"
        );

        // Send confirmation email to Business
        if (businessIdData && typeof businessIdData === 'object' && businessIdData.email) {
          console.log(`[Email] Sending booking confirmation to BUSINESS: ${businessIdData.email}`);
          console.log(`[Email] Business confirmation data:`, {
            customerId: userIdData.id,
            customerName: userIdData.fname + ' ' + userIdData.lname,
            bookingId: String(savedBooking._id).slice(-8)
          });

          const sent = await sendEmail(
            [businessIdData.email],
            "New Booking Received - ouiimi",
            {
              fname: userIdData.fname || "Customer", // This maps to 'first_name' in generic logic, typically addressed to recipient.
              // But for business email, templates often use 'customer_name' for the person who booked
              customerName: `${userIdData.fname} ${userIdData.lname}`.trim(), // Explicitly pass customer name
              email: businessIdData.email,
              businessName,
              serviceName,
              date,
              time,
              bookingId: String(savedBooking._id).slice(-8),
              depositAmount: savedBooking.depositAmount,
              totalCost: savedBooking.totalCost, // ADDED: Missing variable likely causing failure
              outstanding: savedBooking.remainingAmount
            },
            "booking_confirmation_business"
          );

          if (sent) {
            console.log(`[Email] Business confirmation result: SUCCESS`);
          } else {
            console.error(`[Email] Business confirmation result: FAILED (Check Mailjet logs)`);
          }
        } else {
          console.warn(`[Email] Skipping business confirmation - No business email found for ID: ${businessIdData?.id || businessIdData}`);
        }
      }
    } catch (emailError) {
      console.error("Error sending booking confirmation email:", emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking: {
          id: String(savedBooking._id),
          userId: userIdData,
          businessId: businessIdData,
          serviceId: serviceIdData,
          staffId: staffIdData,
          timeSlot: savedBooking.timeSlot,
          addOns: savedBooking.addOns || [],
          totalCost: savedBooking.totalCost,
          depositAmount: savedBooking.depositAmount,
          remainingAmount: savedBooking.remainingAmount,
          status: savedBooking.status,
          paymentStatus: savedBooking.paymentStatus,
          customerNotes: savedBooking.customerNotes,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create booking error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    if (error.name === "ZodError") {
      console.error("Validation errors:", error.errors);
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

async function getBookingsHandler(req: NextRequest) {
  try {
    console.log("=== GET BOOKINGS API CALLED ===");

    const authHeader = req.headers.get("authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header");
      return NextResponse.json(
        { error: "Unauthorized - No valid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log("Token extracted, length:", token.length);

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("Token verification failed");
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    console.log("Token verified successfully, userId:", decoded.userId);

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    console.log("Query params:", { businessId, userId, status });

    const filter: any = {};
    if (businessId) {
      const mongoose = (await import("mongoose")).default;
      filter.businessId = mongoose.Types.ObjectId.isValid(businessId)
        ? new mongoose.Types.ObjectId(businessId)
        : businessId;
    }
    if (userId) {
      const mongoose = (await import("mongoose")).default;
      filter.userId = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;
    }
    if (status) {
      filter.status = status;
    }

    console.log("Fetching bookings with filter:", filter);

    // Ensure all models are registered before populate
    const mongoose = (await import("mongoose")).default;
    if (!mongoose.models.Business) {
      await import("@/lib/models/Business");
    }
    if (!mongoose.models.Service) {
      await import("@/lib/models/Service");
    }
    if (!mongoose.models.User) {
      await import("@/lib/models/User");
    }
    if (!mongoose.models.Staff) {
      console.warn("[Booking API GET] Staff model not registered, importing...");
      await import("@/lib/models/Staff");
    }

    const bookings = await Booking.find(filter)
      .populate("userId", "fname lname email contactNo")
      .populate("businessId", "businessName logo address email phone")
      .populate("serviceId", "serviceName category")
      .populate("staffId", "name photo")
      .sort({ "timeSlot.date": 1, "timeSlot.startTime": 1 })
      .lean();

    console.log("Found bookings:", bookings.length);

    return NextResponse.json(
      {
        bookings: bookings.map((b: any) => ({
          id: b._id?.toString() || b._id,
          _id: b._id?.toString() || b._id,
          userId: (b.userId && typeof b.userId === 'object') ? {
            id: b.userId._id?.toString(),
            fname: b.userId.fname,
            lname: b.userId.lname,
            email: b.userId.email,
            contactNo: b.userId.contactNo,
          } : b.userId?.toString() || null,
          businessId: (b.businessId && typeof b.businessId === 'object') ? {
            id: b.businessId._id?.toString(),
            businessName: b.businessId.businessName,
            logo: b.businessId.logo,
            address: b.businessId.address,
            email: b.businessId.email,
            phone: b.businessId.phone,
          } : b.businessId?.toString() || null,
          serviceId: (b.serviceId && typeof b.serviceId === 'object') ? {
            id: b.serviceId._id?.toString(),
            serviceName: b.serviceId.serviceName,
            category: b.serviceId.category,
            baseCost: 0, // Price is now in time slots
          } : b.serviceId?.toString() || null,
          staffId: b.staffId ? (typeof b.staffId === 'object' ? {
            id: b.staffId._id?.toString(),
            name: b.staffId.name,
            photo: b.staffId.photo,
          } : b.staffId.toString()) : null,
          bookingNumber: b.bookingNumber || null, // Fallback for old bookings without bookingNumber
          timeSlot: b.timeSlot,
          addOns: b.addOns || [],
          totalCost: b.totalCost,
          depositAmount: b.depositAmount,
          remainingAmount: b.remainingAmount,
          platformFee: b.platformFee || 0,
          serviceAmount: b.serviceAmount || (b.totalCost - (b.platformFee || 0)),
          adminPaymentStatus: b.adminPaymentStatus || "pending",
          status: b.status,
          paymentStatus: b.paymentStatus,
          customerNotes: b.customerNotes,
          businessNotes: b.businessNotes,
          cancelledAt: b.cancelledAt,
          cancellationReason: b.cancellationReason,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get bookings error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error.message },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(createBookingHandler);
export const GET = withRateLimit(getBookingsHandler);

