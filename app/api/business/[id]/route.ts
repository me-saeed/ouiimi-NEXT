/**
 * =============================================================================
 * BUSINESS BY ID API - /api/business/[id] (Production-Ready)
 * =============================================================================
 * 
 * GET: Public (no auth needed)
 * PUT: Requires session auth + ownership
 * DELETE: Requires session auth + ownership
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

// =============================================================================
// GET Business by ID (Public)
// =============================================================================
async function getBusinessHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  const business = await Business.findById(params.id).lean();
  if (!business) {
    throw new APIError(404, "Business not found", "NOT_FOUND");
  }

  return successResponse({ business });
}

// =============================================================================
// UPDATE Business (Requires Auth + Ownership)
// =============================================================================
async function updateBusinessHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 20);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  const business = await Business.findById(params.id);
  if (!business) {
    throw new APIError(404, "Business not found", "NOT_FOUND");
  }

  // Verify ownership
  if (String(business.userId) !== String(session.userId)) {
    throw new APIError(403, "You can only update your own business", "FORBIDDEN");
  }

  const body = await req.json();

  // Update allowed fields (excluding sensitive ones like userId, status)
  const allowedFields = [
    'businessName', 'story', 'address', 'phone',
    'email', 'logo', 'operatingHours', 'website'
  ];

  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      (business as any)[field] = body[field];
    }
  });

  await business.save();

  return successResponse({
    message: "Business updated successfully",
    business: {
      id: String(business._id),
      businessName: business.businessName,
    },
  });
}

// =============================================================================
// DELETE Business (Requires Auth + Ownership)
// =============================================================================
async function deleteBusinessHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 5);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  await dbConnect();

  const business = await Business.findById(params.id);
  if (!business) {
    throw new APIError(404, "Business not found", "NOT_FOUND");
  }

  // Verify ownership
  if (String(business.userId) !== String(session.userId)) {
    throw new APIError(403, "You can only delete your own business", "FORBIDDEN");
  }

  // Soft delete - mark as suspended instead of hard delete
  business.status = "suspended";
  await business.save();

  return successResponse({
    message: "Business deactivated successfully",
  });
}

// =============================================================================
// EXPORTS
// =============================================================================
export const GET = asyncHandler(getBusinessHandler);
export const PUT = asyncHandler(updateBusinessHandler);
export const DELETE = asyncHandler(deleteBusinessHandler);
