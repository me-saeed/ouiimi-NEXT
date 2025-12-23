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
          const idStr = String(staff.staffId);
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
            const staffIdStr = String(staff.staffId);
            // Check global busy map
            const isGloballyBooked = isStaffBusy(busyMap, staffIdStr, ts.date, ts.startTime);

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
