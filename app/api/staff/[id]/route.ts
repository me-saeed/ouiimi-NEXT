/**
 * =============================================================================
 * STAFF BY ID API - /api/staff/[id] (Production-Ready)
 * =============================================================================
 * 
 * GET: Public (no auth needed)
 * PUT/DELETE: Requires session auth + business ownership
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Staff from "@/lib/models/Staff";
import Business from "@/lib/models/Business";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

// =============================================================================
// GET Staff by ID (Public)
// =============================================================================
async function getStaffHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  const staff = await Staff.findById(params.id).lean();
  if (!staff) {
    throw new APIError(404, "Staff member not found", "NOT_FOUND");
  }

  return successResponse({ staff }, 200, {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  });
}

// =============================================================================
// UPDATE Staff (Requires Auth + Ownership)
// =============================================================================
async function updateStaffHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 20);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  const staff = await Staff.findById(params.id);
  if (!staff) {
    throw new APIError(404, "Staff member not found", "NOT_FOUND");
  }

  // Verify ownership
  const business = await Business.findById(staff.businessId);
  if (!business) {
    throw new APIError(404, "Business not found", "BUSINESS_NOT_FOUND");
  }

  if (String(business.userId) !== String(session.userId)) {
    throw new APIError(403, "You can only update your own staff", "FORBIDDEN");
  }

  const body = await req.json();

  // Update allowed fields
  if (body.name) staff.name = body.name;
  if (body.qualifications !== undefined) staff.qualifications = body.qualifications;
  if (body.about !== undefined) staff.about = body.about;
  if (body.isActive !== undefined) staff.isActive = body.isActive;

  await staff.save();

  return successResponse({
    message: "Staff updated successfully",
    staff: {
      id: String(staff._id),
      name: staff.name,
      isActive: staff.isActive,
    },
  });
}

// =============================================================================
// DELETE Staff (Requires Auth + Ownership)
// =============================================================================
async function deleteStaffHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 10);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  const staff = await Staff.findById(params.id);
  if (!staff) {
    throw new APIError(404, "Staff member not found", "NOT_FOUND");
  }

  // Verify ownership
  const business = await Business.findById(staff.businessId);
  if (!business) {
    throw new APIError(404, "Business not found", "BUSINESS_NOT_FOUND");
  }

  if (String(business.userId) !== String(session.userId)) {
    throw new APIError(403, "You can only delete your own staff", "FORBIDDEN");
  }

  await Staff.findByIdAndDelete(params.id);

  return successResponse({
    message: "Staff deleted successfully",
  });
}

// =============================================================================
// EXPORTS
// =============================================================================
export const GET = asyncHandler(getStaffHandler);
export const PUT = asyncHandler(updateStaffHandler);
export const DELETE = asyncHandler(deleteStaffHandler);
