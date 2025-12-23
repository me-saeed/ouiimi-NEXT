/**
 * =============================================================================
 * STAFF API - /api/staff (Production-Ready)
 * =============================================================================
 * 
 * GET: Public (no auth) - List staff for a business
 * POST: Requires session auth + business ownership
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Staff from "@/lib/models/Staff";
import Business from "@/lib/models/Business";
import { staffCreateSchema } from "@/lib/validation";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler, createdResponse } from "@/lib/api-response";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = 'force-dynamic';

// =============================================================================
// POST - Create Staff (Requires Auth)
// =============================================================================
async function createStaffHandler(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(req, 20);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const session = await authenticateRequest(req);

  // Parse FormData
  const formData = await req.formData();
  const businessId = formData.get("businessId") as string;
  const name = formData.get("name") as string;
  const qualifications = formData.get("qualifications") as string | null;
  const about = formData.get("about") as string | null;
  const photoFile = formData.get("photo") as File | null;

  const dataToValidate = {
    businessId,
    name,
    qualifications: qualifications || undefined,
    about: about || undefined,
  };

  const schemaWithoutPhoto = staffCreateSchema.omit({ photo: true });
  const validatedData = schemaWithoutPhoto.parse(dataToValidate);

  await dbConnect();

  // Verify business ownership
  const business = await Business.findById(validatedData.businessId);
  if (!business) {
    throw new APIError(404, "Business not found", "BUSINESS_NOT_FOUND");
  }

  if (String(business.userId) !== String(session.userId)) {
    throw new APIError(403, "You can only add staff to your own business", "FORBIDDEN");
  }

  if (business.status === "rejected") {
    throw new APIError(403, "Cannot add staff to a rejected business", "BUSINESS_REJECTED");
  }

  // Handle file upload
  let photoUrl = "";
  if (photoFile && photoFile.size > 0) {
    if (!photoFile.type.startsWith("image/")) {
      throw new APIError(400, "Invalid file type. Only images allowed.", "INVALID_FILE_TYPE");
    }

    if (photoFile.size > 5 * 1024 * 1024) {
      throw new APIError(400, "Image too large. Max 5MB.", "FILE_TOO_LARGE");
    }

    const bytes = await photoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = photoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `staff-${Date.now()}-${originalName}`;
    const uploadDir = join(process.cwd(), "uploads");

    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    photoUrl = `/api/images/${filename}`;
  }

  // Create staff member
  const staff = await Staff.create({
    businessId: validatedData.businessId,
    name: validatedData.name.trim(),
    photo: photoUrl || undefined,
    qualifications: validatedData.qualifications || undefined,
    about: validatedData.about || undefined,
    isActive: true,
  });

  return createdResponse({
    message: "Staff member added successfully",
    staff: {
      id: String(staff._id),
      name: staff.name,
      photo: staff.photo,
      qualifications: staff.qualifications,
      about: staff.about,
      isActive: staff.isActive,
      businessId: String(staff.businessId),
    },
  });
}

// =============================================================================
// GET - List Staff (Public)
// =============================================================================
async function getStaffListHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const status = searchParams.get("status") || "active";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const skip = (page - 1) * limit;

  if (!businessId) {
    throw new APIError(400, "businessId is required", "MISSING_PARAM");
  }

  await dbConnect();

  const query: any = { businessId };
  if (status === "active") query.isActive = true;
  else if (status === "inactive") query.isActive = false;

  const staff = await Staff.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Staff.countDocuments(query);

  return NextResponse.json({
    staff: staff.map((s: any) => ({
      id: String(s._id),
      businessId: String(s.businessId),
      name: s.name,
      photo: s.photo,
      qualifications: s.qualifications,
      about: s.about,
      isActive: s.isActive,
      createdAt: s.createdAt,
    })),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

// =============================================================================
// EXPORTS
// =============================================================================
export const POST = asyncHandler(createStaffHandler);
export const GET = asyncHandler(getStaffListHandler);
