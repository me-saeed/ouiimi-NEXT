/**
 * =============================================================================
 * SERVICE BY ID API - /api/services/[id] (Production-Ready)
 * =============================================================================
 * 
 * GET: Public (no auth required)
 * PUT/DELETE: Requires session auth & business ownership
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import { serviceUpdateSchema } from "@/lib/validation";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, successResponse } from "@/lib/api-response";
import mongoose from "mongoose";
import { getGlobalBusyMap, isStaffBusy } from "@/lib/utils/availability";
import Booking from "@/lib/models/Booking";
import type { StaffIdEntry, TimeSlotEntry } from "@/lib/types/api";

export const dynamic = 'force-dynamic';

// =============================================================================
// GET Service (Public - No Auth Required)
// =============================================================================
async function getServiceHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    throw new APIError(400, "Invalid service ID format", "INVALID_ID");
  }

  const service = await Service.findById(params.id)
    .populate("businessId", "businessName logo address email phone")
    .lean();

  if (!service) {
    throw new APIError(404, "Service not found", "NOT_FOUND");
  }

  // Populate staff data if available
  if (service.timeSlots && service.timeSlots.length > 0) {
    const Staff = (await import("@/lib/models/Staff")).default;
    const allStaffIds: string[] = [];

    service.timeSlots.forEach((ts: any) => {
      if (ts.staffIds && Array.isArray(ts.staffIds)) {
        ts.staffIds.forEach((staff: any) => {
          const idStr = typeof staff === 'string' ? staff : String(staff.staffId || staff.id || staff);
          if (idStr && !allStaffIds.includes(idStr)) {
            allStaffIds.push(idStr);
          }
        });
      }
    });

    if (allStaffIds.length > 0) {
      try {
        // Fetch global busy map for these staff members
        const startDate = new Date(); // Start from today
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 2); // Look 2 months ahead

        const busyMap = await getGlobalBusyMap(allStaffIds, startDate, endDate);

        const staffMembers = JSON.parse(JSON.stringify(await Staff.find({
          _id: { $in: allStaffIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).select('name photo').lean()));

        const staffMap = new Map(
          staffMembers.map((s: any) => [String(s._id || s.id), s])
        );

        service.timeSlots = service.timeSlots.map((ts: any) => {
          const updatedStaffIds = ts.staffIds?.map((staff: any) => {
            const staffIdStr = typeof staff === 'string' ? staff : String(staff.staffId || staff.id || staff);
            // Check global busy map
            const isGloballyBooked = isStaffBusy(busyMap, staffIdStr, ts.date, ts.startTime);

            if (typeof staff === 'string' || !staff.staffId) {
              return {
                staffId: staffIdStr,
                isBooked: isGloballyBooked,
                staffDetails: staffMap.get(staffIdStr) || null
              };
            }

            return {
              ...staff,
              isBooked: staff.isBooked || isGloballyBooked,
              staffDetails: staffMap.get(staffIdStr) || null
            };
          }) || [];

          // Determine if entire slot is booked (all staff are busy)
          const allStaffBooked = updatedStaffIds.length > 0 && updatedStaffIds.every((s: any) => s.isBooked);

          return {
            ...ts,
            staffIds: updatedStaffIds,
            isBooked: ts.isBooked || allStaffBooked
          };
        });
      } catch (error) {
        console.error("Error populating staff or availability:", error);
      }
    }
  }

  return successResponse({ service });
}

// =============================================================================
// UPDATE Service (Requires Auth + Ownership)
// =============================================================================
async function updateServiceHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 20);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    throw new APIError(400, "Invalid service ID format", "INVALID_ID");
  }

  const service = await Service.findById(params.id);
  if (!service) {
    throw new APIError(404, "Service not found", "NOT_FOUND");
  }

  // Verify ownership
  const business = await Business.findById(service.businessId);
  if (!business) {
    throw new APIError(404, "Business not found", "BUSINESS_NOT_FOUND");
  }

  if (String(business.userId) !== String(session.userId)) {
    throw new APIError(403, "You can only update your own services", "FORBIDDEN");
  }

  const body = await req.json();
  const validatedData = serviceUpdateSchema.parse(body);

  // ========================================================================
  // CROSS-SERVICE STAFF AVAILABILITY CHECK
  // Prevent same staff from being assigned to overlapping time slots across services
  // ========================================================================
  const timeSlots = body.timeSlots || [];
  if (timeSlots.length > 0) {

    // Get all staff IDs from the new time slots
    const staffIdsToCheck: string[] = [];
    timeSlots.forEach((slot: any) => {
      (slot.staffIds || []).forEach((staff: any) => {
        const sid = typeof staff === 'string' ? staff : String(staff.staffId || staff);
        if (sid && !staffIdsToCheck.includes(sid)) {
          staffIdsToCheck.push(sid);
        }
      });
    });

    if (staffIdsToCheck.length > 0) {
      // Find all OTHER services for this business that have any of these staff in their time slots
      const existingServices = await Service.find({
        businessId: service.businessId,
        _id: { $ne: params.id }, // Exclude current service
        "timeSlots.staffIds.staffId": { $in: staffIdsToCheck.map(id => new mongoose.Types.ObjectId(id)) }
      }).select("serviceName timeSlots");

      // Check each new time slot against existing ones
      for (const newSlot of timeSlots) {
        const newStart = new Date(`2000-01-01T${newSlot.startTime}`);
        const newEnd = new Date(`2000-01-01T${newSlot.endTime}`);
        const newDateStr = new Date(newSlot.date).toISOString().split('T')[0];

        for (const existingService of existingServices) {
          for (const existingSlot of existingService.timeSlots || []) {
            const existingDateStr = new Date(existingSlot.date).toISOString().split('T')[0];

            // Skip if dates don't match
            if (newDateStr !== existingDateStr) continue;

            const existingStart = new Date(`2000-01-01T${existingSlot.startTime}`);
            const existingEnd = new Date(`2000-01-01T${existingSlot.endTime}`);

            // Check for time overlap: (s1 < e2 && s2 < e1)
            const timeOverlaps = newStart < existingEnd && existingStart < newEnd;
            if (!timeOverlaps) continue;

            // Check for staff overlap
            for (const newStaff of newSlot.staffIds || []) {
              const newStaffId = typeof newStaff === 'string' ? newStaff : String(newStaff.staffId || newStaff);
              const existingStaffIds = (existingSlot.staffIds || []).map((s: any) =>
                String(s.staffId || s)
              );

              if (existingStaffIds.includes(newStaffId)) {
                throw new APIError(
                  400,
                  `Staff member is already assigned to "${existingService.serviceName}" at ${existingSlot.startTime}-${existingSlot.endTime} on ${newDateStr}. A staff member cannot serve multiple services at the same time.`,
                  "STAFF_CONFLICT"
                );
              }
            }
          }
        }
      }
    }
  }
  // ======================================================================== 

  // Update service fields
  Object.assign(service, validatedData);
  await service.save();

  return successResponse({
    message: "Service updated successfully",
    service: {
      id: String(service._id),
      serviceName: service.serviceName,
      status: service.status,
    },
  });
}

// =============================================================================
// DELETE Service (Requires Auth + Ownership)
// =============================================================================
async function deleteServiceHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 10);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    throw new APIError(400, "Invalid service ID format", "INVALID_ID");
  }

  const service = await Service.findById(params.id);
  if (!service) {
    throw new APIError(404, "Service not found", "NOT_FOUND");
  }

  // Verify ownership
  const business = await Business.findById(service.businessId);
  if (!business) {
    throw new APIError(404, "Business not found", "BUSINESS_NOT_FOUND");
  }

  if (String(business.userId) !== String(session.userId)) {
    throw new APIError(403, "You can only delete your own services", "FORBIDDEN");
  }

  await Service.findByIdAndDelete(params.id);

  return successResponse({
    message: "Service deleted successfully",
  });
}

// =============================================================================
// EXPORTS
// =============================================================================
export const GET = asyncHandler(getServiceHandler);
export const PUT = asyncHandler(updateServiceHandler);
export const DELETE = asyncHandler(deleteServiceHandler);
