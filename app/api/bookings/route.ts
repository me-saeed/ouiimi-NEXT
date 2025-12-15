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

    // Declare staffId at function scope for later use
    const staffId = validatedData.staffId
      ? new mongoose.Types.ObjectId(validatedData.staffId)
      : null;

    // Check if staff is already booked at this time (across ALL services)
    if (staffId) {
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

    console.log("[Booking API] Attempting atomic update - marking staff as booked");
    console.log("[Booking API] Looking for:", {
      serviceId: validatedData.serviceId,
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      staffId: staffId?.toString()
    });

    // First, let's check what the service actually has
    const serviceCheck = await Service.findById(validatedData.serviceId);
    if (serviceCheck) {
      const matchingSlot = serviceCheck.timeSlots.find((slot: any) => {
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);
        const bookingDateObj = new Date(bookingDate);
        bookingDateObj.setHours(0, 0, 0, 0);
        return slotDate.getTime() === bookingDateObj.getTime() &&
          slot.startTime === bookingStartTime &&
          slot.endTime === bookingEndTime;
      });

      if (matchingSlot) {
        console.log("[Booking API] Found matching slot:", {
          date: matchingSlot.date,
          startTime: matchingSlot.startTime,
          endTime: matchingSlot.endTime,
          isBooked: matchingSlot.isBooked,
          staffIds: matchingSlot.staffIds,
          staffIdsType: Array.isArray(matchingSlot.staffIds) ?
            (matchingSlot.staffIds.length > 0 ? typeof matchingSlot.staffIds[0] : 'empty array') :
            'not an array'
        });
      } else {
        console.error("[Booking API] No matching slot found in service!");
        return NextResponse.json(
          { error: "Time slot not found in service" },
          { status: 404 }
        );
      }
    }

    // ✅ CANONICAL FORMAT ONLY: staffIds = [{staffId: ObjectId, isBooked: boolean}]
    let updatedService = null;

    if (staffId) {
      updatedService = await Service.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(validatedData.serviceId),
          timeSlots: {
            $elemMatch: {
              date: bookingDate,
              startTime: bookingStartTime,
              endTime: bookingEndTime,
              staffIds: {
                $elemMatch: {
                  staffId: staffId,
                  isBooked: false
                }
              }
            }
          }
        },
        {
          $set: {
            "timeSlots.$[slot].staffIds.$[staff].isBooked": true,
            "timeSlots.$[slot].bookingId": bookingId
          }
        },
        {
          new: true,
          arrayFilters: [
            {
              "slot.date": bookingDate,
              "slot.startTime": bookingStartTime,
              "slot.endTime": bookingEndTime
            },
            {
              "staff.staffId": staffId
            }
          ]
        }
      );
    } else {
      // No staff selected - just mark the slot as booked
      updatedService = await Service.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(validatedData.serviceId),
          timeSlots: {
            $elemMatch: {
              date: bookingDate,
              startTime: bookingStartTime,
              endTime: bookingEndTime,
              isBooked: false
            }
          }
        },
        {
          $set: {
            "timeSlots.$.isBooked": true,
            "timeSlots.$.bookingId": bookingId
          }
        },
        {
          new: true
        }
      );
    }

    if (!updatedService) {
      console.error("[Booking API] Atomic update failed - staff may already be booked or slot doesn't exist");
      return NextResponse.json(
        { error: "This staff member is not available for the selected time slot" },
        { status: 409 }
      );
    }

    console.log("[Booking API] ✅ Staff booking flag updated successfully");

    // Get the updated slot to check if ALL staff are now booked
    const bookedSlot = updatedService.timeSlots.find((slot: any) => {
      const slotDate = new Date(slot.date);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() === bookingDateTimestamp &&
        slot.startTime === bookingStartTime &&
        slot.endTime === bookingEndTime;
    });

    if (bookedSlot) {
      const totalStaff = bookedSlot.staffIds?.length || 0;
      const bookedStaff = bookedSlot.staffIds?.filter((s: any) => s.isBooked).length || 0;
      const allStaffBooked = bookedStaff >= totalStaff;

      console.log(`[Booking API] Staff booking status: ${bookedStaff}/${totalStaff} staff now booked`);

      // Update the slot's isBooked flag
      if (allStaffBooked) {
        await Service.updateOne(
          {
            _id: validatedData.serviceId,
            "timeSlots.date": bookingDate,
            "timeSlots.startTime": bookingStartTime,
            "timeSlots.endTime": bookingEndTime
          },
          {
            $set: { "timeSlots.$.isBooked": true }
          }
        );
        console.log("[Booking API] ✅ All staff booked - slot marked as FULLY BOOKED");
      } else {
        console.log(`[Booking API] ✅ Partial booking - ${bookedStaff}/${totalStaff} staff booked, SLOT REMAINS VISIBLE`);
      }
    }


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

    // Email Notification: Converted to "Payment Pending" or removed entirely until payment is made.
    // User requested confirmation emails ONLY after payment.
    console.log("[Booking API] Booking created. Waiting for payment to send confirmation emails.");

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

    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Max 100 per page
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    console.log("Query params:", { businessId, userId, status, limit, page, skip });

    const query: any = {}; // Renamed from 'filter' to 'query'
    if (businessId) {
      const mongoose = (await import("mongoose")).default;
      query.businessId = mongoose.Types.ObjectId.isValid(businessId)
        ? new mongoose.Types.ObjectId(businessId)
        : businessId;
    }
    if (userId) {
      const mongoose = (await import("mongoose")).default;
      query.userId = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;
    }
    if (status) {
      query.status = status;
    }

    console.log("Fetching bookings with query:", query);

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

    const bookings = await Booking.find(query)
      .populate("userId", "fname lname email contactNo")
      .populate("businessId", "businessName logo address email phone")
      .populate("serviceId", "serviceName category")
      .populate("staffId", "name photo")
      .sort({ createdAt: -1 }) // Changed sorting to createdAt descending
      .limit(limit)
      .skip(skip)
      .lean(); // 30% performance improvement

    // Get total count for pagination
    const total = await Booking.countDocuments(query);

    console.log("Found bookings:", bookings.length, "Total:", total);

    return NextResponse.json(
      {
        bookings: bookings.map((b: any) => ({
          id: String(b._id),
          userId: typeof b.userId === 'object' && b.userId !== null ? {
            id: String(b.userId._id),
            fname: b.userId.fname,
            lname: b.userId.lname,
            email: b.userId.email,
            contactNo: b.userId.contactNo,
          } : (b.userId ? String(b.userId) : null),
          businessId: typeof b.businessId === 'object' && b.businessId !== null ? {
            id: String(b.businessId._id),
            businessName: b.businessId.businessName,
            logo: b.businessId.logo,
            address: b.businessId.address,
            email: b.businessId.email,
            phone: b.businessId.phone,
          } : (b.businessId ? String(b.businessId) : null),
          serviceId: typeof b.serviceId === 'object' && b.serviceId !== null ? {
            id: String(b.serviceId._id),
            serviceName: b.serviceId.serviceName,
            category: b.serviceId.category,
          } : (b.serviceId ? String(b.serviceId) : null),
          staffId: (typeof b.staffId === 'object' && b.staffId !== null ? {
            id: String(b.staffId._id),
            name: b.staffId.name,
            photo: b.staffId.photo,
          } : (b.staffId ? String(b.staffId) : null)),
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
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasMore: skip + bookings.length < total,
        },
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

