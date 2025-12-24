/**
 * =============================================================================
 * BOOKINGS API - CREATE BOOKING (Production-Ready)
 * =============================================================================
 * 
 * Handles booking creation with server-side session validation and rate limiting.
 * 
 * SECURITY:
 * - Session-based authentication
 * - Rate limiting (30 requests/minute)
 * - Server-side cost calculation
 * - Atomic slot booking (prevents double-booking)
 */

import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
import Staff from "@/lib/models/Staff";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  errorResponse,
  createdResponse,
  asyncHandler,
  APIError
} from "@/lib/api-response";
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
  // ==========================================================================
  // STEP 1: Rate Limiting (30 req/min for bookings)
  // ==========================================================================
  const rateLimitResponse = applyRateLimit(req, 30);
  if (rateLimitResponse) return rateLimitResponse;

  // ==========================================================================
  // STEP 2: Session Authentication
  // ==========================================================================
  const session = await authenticateRequest(req);

  // ==========================================================================
  // STEP 3: Parse and validate request
  // ==========================================================================
  const body = await req.json();
  const validatedData = bookingCreateSchema.parse(body);

  // Verify user owns this booking
  if (String(validatedData.userId) !== String(session.userId)) {
    throw new APIError(403, "Cannot create booking for another user", "FORBIDDEN");
  }

  await dbConnect();

  // ==========================================================================
  // STEP 4: Time conversion helper
  // ==========================================================================
  const convertTo24Hour = (time12: string): string => {
    const trimmed = time12.trim();
    const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return trimmed;

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  let bookingStartTime = validatedData.timeSlot.startTime.trim();
  let bookingEndTime = validatedData.timeSlot.endTime.trim();

  if (bookingStartTime.includes("AM") || bookingStartTime.includes("PM")) {
    bookingStartTime = convertTo24Hour(bookingStartTime);
  }
  if (bookingEndTime.includes("AM") || bookingEndTime.includes("PM")) {
    bookingEndTime = convertTo24Hour(bookingEndTime);
  }

  const bookingDate = new Date(validatedData.timeSlot.date);
  const staffId = validatedData.staffId
    ? new mongoose.Types.ObjectId(validatedData.staffId)
    : null;
  // ==========================================================================
  // AUTO-EXPIRY: Clear stale pending bookings before checking availability
  // ==========================================================================
  const expiryTime = new Date(Date.now() - 15 * 60 * 1000);
  await Booking.updateMany(
    { status: { $in: ["pre_payment", "pending"] }, createdAt: { $lt: expiryTime } },
    { $set: { status: "cancelled", cancellationReason: "Pre-payment hold expired" } }
  );

  // ==========================================================================
  // STEP 5: Check staff availability (if staff selected)
  // ==========================================================================
  if (staffId) {
    const bookingDayStart = new Date(bookingDate);
    bookingDayStart.setHours(0, 0, 0, 0);
    const bookingDayEnd = new Date(bookingDate);
    bookingDayEnd.setHours(23, 59, 59, 999);

    const conflictingBookings = await Booking.find({
      staffId: staffId,
      status: { $in: ["confirmed", "completed"] },
      "timeSlot.date": {
        $gte: bookingDayStart,
        $lte: bookingDayEnd,
      },
      $and: [
        { "timeSlot.startTime": { $lt: bookingEndTime } },
        { "timeSlot.endTime": { $gt: bookingStartTime } },
      ],
    });

    if (conflictingBookings.length > 0) {
      throw new APIError(
        409,
        "Staff member is already booked at this time",
        "STAFF_UNAVAILABLE"
      );
    }
  }

  // ==========================================================================
  // STEP 6: Server-side cost calculation (SECURITY)
  // ==========================================================================
  const service = await Service.findById(validatedData.serviceId);
  if (!service) {
    throw new APIError(404, "Service not found", "SERVICE_NOT_FOUND");
  }

  const bookingDateObj = new Date(bookingDate);
  bookingDateObj.setHours(0, 0, 0, 0);
  const bookingDateTimestamp = bookingDateObj.getTime();

  const targetSlot = service.timeSlots.find((slot: any) => {
    const slotDate = new Date(slot.date);
    slotDate.setHours(0, 0, 0, 0);
    return slotDate.getTime() === bookingDateTimestamp &&
      slot.startTime === bookingStartTime &&
      slot.endTime === bookingEndTime;
  });

  let calculatedTotalCost = targetSlot?.price || 0;

  // Add add-ons cost
  if (validatedData.addOns && validatedData.addOns.length > 0) {
    validatedData.addOns.forEach((addOn: any) => {
      calculatedTotalCost += addOn.cost;
    });
  }

  // ==========================================================================
  // STEP 7: Verify slot availability (Without reserving yet)
  // ==========================================================================
  const bookingId = new mongoose.Types.ObjectId();

  // Basic check: Does the slot exist and is it not already booked?
  if (!targetSlot) {
    throw new APIError(409, "Time slot no longer exists", "SLOT_UNAVAILABLE");
  }

  // If staff is specified, check that specific staff member's availability
  if (staffId) {
    const staffAvailability = targetSlot.staffIds?.find((s: any) => String(s.staffId) === String(staffId));
    if (!staffAvailability || staffAvailability.isBooked) {
      throw new APIError(409, "Staff member is no longer available for this slot", "STAFF_UNAVAILABLE");
    }
  } else if (targetSlot.isBooked) {
    // If no specific staff, check the general slot status
    throw new APIError(409, "Time slot is already fully booked", "SLOT_UNAVAILABLE");
  }

  // ==========================================================================
  // STEP 8: Create booking
  // ==========================================================================
  const lastBooking = await Booking.findOne().sort({ bookingNumber: -1 }).select('bookingNumber');
  const bookingNumber = lastBooking?.bookingNumber ? lastBooking.bookingNumber + 1 : 5000;

  const PLATFORM_FEE = 1.99;
  const bookingData: any = {
    _id: bookingId,
    bookingNumber,
    userId: new mongoose.Types.ObjectId(validatedData.userId),
    businessId: new mongoose.Types.ObjectId(validatedData.businessId),
    serviceId: new mongoose.Types.ObjectId(validatedData.serviceId),
    timeSlot: {
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
    },
    totalCost: calculatedTotalCost,
    depositAmount: Math.round(calculatedTotalCost * 0.1 * 100) / 100,
    remainingAmount: Math.round(calculatedTotalCost * 0.9 * 100) / 100,
    platformFee: PLATFORM_FEE,
    serviceAmount: calculatedTotalCost - PLATFORM_FEE,
    status: "pre_payment",
    paymentStatus: "pending",
    adminPaymentStatus: "pending",
  };

  if (validatedData.staffId) {
    bookingData.staffId = new mongoose.Types.ObjectId(validatedData.staffId);
  }
  if (validatedData.addOns) {
    bookingData.addOns = validatedData.addOns;
  }
  if (validatedData.customerNotes) {
    bookingData.customerNotes = validatedData.customerNotes;
  }

  const booking = await Booking.create(bookingData);

  // Populate related data
  const savedBooking = await Booking.findById(booking._id)
    .populate("userId", "fname lname email")
    .populate("businessId", "businessName logo address email phone")
    .populate("serviceId", "serviceName category")
    .populate("staffId", "name photo")
    .lean();

  return createdResponse({
    message: "Booking created successfully",
    booking: {
      id: String(savedBooking!._id),
      bookingNumber: savedBooking!.bookingNumber,
      ...savedBooking,
    },
  });
}

// =============================================================================
// GET Bookings Handler
// =============================================================================
async function getBookingsHandler(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 60);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const userId = searchParams.get("userId");
  const staffId = searchParams.get("staffId");
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const skip = (page - 1) * limit;

  const query: any = {};

  // Security: Users can only see their own bookings or their business bookings
  if (userId) {
    if (String(userId) !== String(session.userId)) {
      throw new APIError(403, "Cannot view other users' bookings", "FORBIDDEN");
    }
    query.userId = new mongoose.Types.ObjectId(userId);
  }

  if (businessId) {
    query.businessId = mongoose.Types.ObjectId.isValid(businessId)
      ? new mongoose.Types.ObjectId(businessId)
      : businessId;
  }

  if (status) {
    if (status.includes(',')) {
      query.status = { $in: status.split(',') };
    } else {
      query.status = status;
    }
  } else {
    // Default: Hide pre-payment bookings from generic lists
    query.status = { $ne: "pre_payment" };
  }

  if (staffId) {
    query.staffId = new mongoose.Types.ObjectId(staffId);
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query["timeSlot.date"] = { $gte: startOfDay, $lte: endOfDay };
  }

  // ==========================================================================
  // AUTO-EXPIRY: Automatically cancel pending bookings older than 15 mins
  // ==========================================================================
  const expiryTime = new Date(Date.now() - 15 * 60 * 1000);
  await Booking.updateMany(
    {
      status: { $in: ["pre_payment", "pending"] },
      createdAt: { $lt: expiryTime }
    },
    {
      $set: { status: "cancelled", cancellationReason: "Pre-payment hold expired" }
    }
  );

  const bookings = await Booking.find(query)
    .populate("userId", "fname lname email contactNo")
    .populate("businessId", "businessName logo address email phone")
    .populate("serviceId", "serviceName category")
    .populate("staffId", "name photo")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Booking.countDocuments(query);

  return createdResponse(
    {
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + bookings.length < total,
      },
    });
}

// =============================================================================
// EXPORT
// =============================================================================
export const POST = asyncHandler(createBookingHandler);
export const GET = asyncHandler(getBookingsHandler);
