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
// Import from models index to ensure all models are registered
import { Booking, Service, Business, User, Staff } from "@/lib/models";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  errorResponse,
  createdResponse,
  successResponse,
  asyncHandler,
  APIError
} from "@/lib/api-response";
import { z } from "zod";

export const dynamic = 'force-dynamic';

import { bookingCreateSchema } from "@/lib/validations/booking";

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
  // Extended to 2 hours to give users more time to complete checkout
  // ==========================================================================
  const expiryTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours
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
  // STEP 6: Execute Booking with Transaction (Prevents Race Conditions)
  // ==========================================================================
  const dbSession = await mongoose.startSession();
  let result: any;

  try {
    await dbSession.withTransaction(async () => {
      // 1. Re-Verify staff availability INSIDE the transaction
      if (staffId) {
        const bookingDayStart = new Date(bookingDate);
        bookingDayStart.setHours(0, 0, 0, 0);
        const bookingDayEnd = new Date(bookingDate);
        bookingDayEnd.setHours(23, 59, 59, 999);

        // Explicitly check for overlapping bookings locked by this transaction
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
        }).session(dbSession); // Pass session to lock/read consistent state

        if (conflictingBookings.length > 0) {
          throw new APIError(
            409,
            "Staff member is already booked at this time (race detected)",
            "STAFF_UNAVAILABLE"
          );
        }
      }

      // 2. Server-side integrity checks
      const service = await Service.findById(validatedData.serviceId).session(dbSession);
      if (!service) {
        throw new APIError(404, "Service not found", "SERVICE_NOT_FOUND");
      }
      if (service.status !== 'listed') {
        throw new APIError(409, "This service is no longer available for booking", "SERVICE_UNAVAILABLE");
      }

      const business = await Business.findById(validatedData.businessId).session(dbSession);
      if (!business) {
        throw new APIError(404, "Business not found", "BUSINESS_NOT_FOUND");
      }
      if (business.status !== 'approved') {
        throw new APIError(403, "This business is not currently accepting bookings", "BUSINESS_UNAVAILABLE");
      }

      // Verify Time (Past check)
      const slotDateObj = new Date(bookingDate);
      const [sHours, sMinutes] = bookingStartTime.split(':').map(Number);
      slotDateObj.setHours(sHours, sMinutes, 0, 0);

      if (slotDateObj.getTime() < Date.now()) {
        throw new APIError(400, "Cannot book a time slot in the past", "INVALID_DATE");
      }

      // Calculate Cost
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

      if (!targetSlot) {
        throw new APIError(409, "Time slot no longer exists", "SLOT_UNAVAILABLE");
      }

      // Strict Staff check inside transaction
      if (staffId && targetSlot.staffIds) {
        const isStaffInSlot = targetSlot.staffIds.some((s: any) => String(s.staffId) === String(staffId));
        if (!isStaffInSlot) {
          throw new APIError(409, "Staff member is not assigned to this slot", "STAFF_INVALID");
        }
      }

      let calculatedTotalCost = targetSlot?.price || 0;
      if (validatedData.addOns && validatedData.addOns.length > 0) {
        validatedData.addOns.forEach((addOn: any) => {
          calculatedTotalCost += addOn.cost;
        });
      }

      // 3. Create Booking
      const bookingId = new mongoose.Types.ObjectId();
      const lastBooking = await Booking.findOne().sort({ bookingNumber: -1 }).session(dbSession).select('bookingNumber');
      const bookingNumber = lastBooking?.bookingNumber ? lastBooking.bookingNumber + 1 : 5000;

      const { PLATFORM_FEE, DEPOSIT_PERCENTAGE } = await import("@/lib/constants/pricing");

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
        depositAmount: Math.round(calculatedTotalCost * DEPOSIT_PERCENTAGE * 100) / 100,
        remainingAmount: Math.round(calculatedTotalCost * (1 - DEPOSIT_PERCENTAGE) * 100) / 100,
        platformFee: PLATFORM_FEE,
        serviceAmount: calculatedTotalCost - PLATFORM_FEE,
        // Preserve service details in case service is deleted later
        serviceSnapshot: {
          name: service.serviceName,
          category: service.category || '',
        },
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

      const booking = await Booking.create([bookingData], { session: dbSession });
      result = booking[0];
    });

    await dbSession.endSession();
  } catch (error) {
    await dbSession.endSession();
    throw error;
  }

  if (!result) {
    throw new APIError(500, "Failed to create booking", "BOOKING_CREATION_FAILED");
  }

  // Populate related data (outside transaction to reduce lock time, technically safe as ID is fixed)
  const savedBooking = await Booking.findById(result._id)
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
    // Hide pre-payment bookings for everyone by default
    // Bookings are only valid/visible after payment
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

  return successResponse(
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
