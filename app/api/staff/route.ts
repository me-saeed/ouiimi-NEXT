/**
 * =============================================================================
 * STAFF API ROUTES - /api/staff
 * =============================================================================
 * 
 * This file handles staff member management for businesses.
 * Staff can be assigned to time slots when creating services.
 * 
 * ENDPOINTS:
 * - POST /api/staff  - Create a new staff member (Multipart/FormData)
 * - GET /api/staff   - List staff members for a business
 * 
 * AUTHENTICATION: Required (JWT Bearer token) for POST
 * 
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Staff from "@/lib/models/Staff";
import Business from "@/lib/models/Business";
import { staffCreateSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/security/rate-limit";
import { verifyToken } from "@/lib/jwt";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';

/**
 * =============================================================================
 * POST /api/staff - Create Staff Member
 * =============================================================================
 * 
 * REQUEST HEADERS:
 * {
 *   "Authorization": "Bearer <jwt_token>"
 * }
 * 
 * REQUEST BODY (FormData):
 * - businessId: string
 * - name: string
 * - photo: File (Optional)
 * - qualifications: string (Optional)
 * - about: string (Optional)
 * 
 * RESPONSE (Success - 201):
 * {
 *   "message": "Staff member added successfully",
 *   "staff": { id, name, photo, qualifications, about, isActive, businessId }
 * }
 */
async function createStaffHandler(req: NextRequest) {
  try {
    // =========================================================================
    // STEP 1: Verify authentication
    // =========================================================================
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

    // =========================================================================
    // STEP 2: Parse FormData
    // =========================================================================
    const formData = await req.formData();

    // Extract fields
    const businessId = formData.get("businessId") as string;
    const name = formData.get("name") as string;
    const qualifications = formData.get("qualifications") as string | null;
    const about = formData.get("about") as string | null;
    const photoFile = formData.get("photo") as File | null;

    // Validate using Zod (we construct an object to validate)
    const dataToValidate = {
      businessId,
      name,
      qualifications: qualifications || undefined,
      about: about || undefined,
      // photo is validated separately
    };

    // We use a partial schema or specific checks because 'photo' in schema might expect a string URL
    // Let's use the schema but omit 'photo' for validation
    const schemaWithoutPhoto = staffCreateSchema.omit({ photo: true });
    const validatedData = schemaWithoutPhoto.parse(dataToValidate);

    // =========================================================================
    // STEP 3: Connect to database
    // =========================================================================
    await dbConnect();

    // =========================================================================
    // STEP 4: Verify business exists and ownership
    // =========================================================================
    // Only business owner can add staff to their business
    const business = await Business.findById(validatedData.businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (String(business.userId) !== String(decoded.userId)) {
      return NextResponse.json(
        { error: "Unauthorized - You can only add staff to your own business" },
        { status: 403 }
      );
    }

    if (business.status === "rejected") {
      return NextResponse.json(
        { error: "Cannot add staff to a rejected business" },
        { status: 403 }
      );
    }

    // =========================================================================
    // STEP 5: Handle File Upload
    // =========================================================================
    let photoUrl = "";
    if (photoFile && photoFile.size > 0) {
        // Validate file type
        if (!photoFile.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Invalid file type. Only images are allowed." },
                { status: 400 }
            );
        }

        // Validate size (e.g. 5MB)
        if (photoFile.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Image too large. Max 5MB." },
                { status: 400 }
            );
        }

        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const originalName = photoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `staff-${Date.now()}-${originalName}`;

        // Ensure uploads directory exists
        const relativeUploadDir = "/uploads/staff";
        const uploadDir = join(process.cwd(), "public", relativeUploadDir);

        try {
            await mkdir(uploadDir, { recursive: true });
            const filePath = join(uploadDir, filename);
            await writeFile(filePath, buffer);
            photoUrl = `${relativeUploadDir}/${filename}`;
        } catch (e) {
            console.error("Error saving file:", e);
            return NextResponse.json(
                { error: "Failed to save image file" },
                { status: 500 }
            );
        }
    }

    // =========================================================================
    // STEP 6: Create staff member in database
    // =========================================================================
    const staff = await Staff.create({
      businessId: validatedData.businessId,
      name: validatedData.name.trim(),
      photo: photoUrl || undefined,
      qualifications: validatedData.qualifications || undefined,
      about: validatedData.about || undefined,
      isActive: true, // Default to active
    });

  console.log("Staff created, ID:", String(staff._id));

  // Verify staff was saved (paranoid check)
  const savedStaff = await Staff.findById(staff._id);
  if (!savedStaff) {
    console.error("Staff was not saved to database!");
    return NextResponse.json(
      { error: "Failed to save staff to database. Please try again." },
      { status: 500 }
    );
  }

  console.log("Staff created and verified. ID:", String(savedStaff._id));
  console.log("Staff details:", {
    id: String(savedStaff._id),
    name: savedStaff.name,
    businessId: String(savedStaff.businessId),
    isActive: savedStaff.isActive,
    photo: savedStaff.photo,
    qualifications: savedStaff.qualifications,
    about: savedStaff.about,
  });

  // =========================================================================
  // STEP 7: Return success response
  // =========================================================================
  return NextResponse.json(
    {
      message: "Staff member added successfully",
      staff: {
        id: String(savedStaff._id),
        _id: String(savedStaff._id),  // Include both formats for compatibility
        name: savedStaff.name,
        photo: savedStaff.photo,
        qualifications: savedStaff.qualifications,
        about: savedStaff.about,
        isActive: savedStaff.isActive,
        businessId: String(savedStaff.businessId),
      },
    },
    { status: 201 }  // 201 = Created
  );
} catch (error: any) {
  console.error("Create staff error:", error);
  console.error("Error details:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });

  if (error.name === "ZodError") {
    return NextResponse.json(
      { error: "Validation error", details: error.errors },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: "Failed to add staff member",
      details: error.message || "Unknown error occurred"
    },
    { status: 500 }
  );
}
}

/**
 * =============================================================================
 * GET /api/staff - List Staff Members
 * =============================================================================
 * 
 * QUERY PARAMETERS:
 * - businessId (required): Which business to list staff for
 * - isActive (optional): Filter by active status ("true" or "false")
 * 
 * EXAMPLE:
 *   GET /api/staff?businessId=abc123&isActive=true
 * 
 * RESPONSE (Success - 200):
 * {
 *   "staff": [
 *     { id, name, photo, qualifications, about, bio, isActive, createdAt },
 *     ...
 *   ]
 * }
 * 
 * NOTE: This endpoint is public (no auth required) so customers can see staff
 */
async function getStaffListHandler(req: NextRequest) {
  try {
    // =========================================================================
    // STEP 1: Connect to database
    // =========================================================================
    await dbConnect();

    // =========================================================================
    // STEP 2: Extract query parameters
    // =========================================================================
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const isActive = searchParams.get("isActive");

    // businessId is required - must know which business to list staff for
    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 3: Build filter query
    // =========================================================================
    const filter: any = { businessId };

    // Optionally filter by active status
    if (isActive !== null) {
      filter.isActive = isActive === "true";
    }

    // =========================================================================
    // STEP 4: Query database for staff
    // =========================================================================
    // .sort({ createdAt: -1 }) = newest first
    // .lean() = return plain JavaScript objects (faster)
    const staff = await Staff.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // =========================================================================
    // STEP 5: Return staff list
    // =========================================================================
    return NextResponse.json(
      {
        staff: staff.map((s: any) => ({
          id: s._id?.toString() || s._id,
          _id: s._id?.toString() || s._id,
          name: s.name,
          photo: s.photo,
          qualifications: s.qualifications,
          about: s.about,
          bio: s.about, // Map 'about' to 'bio' for frontend compatibility
          isActive: s.isActive,
          createdAt: s.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get staff list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// =============================================================================
// EXPORTS: Wrap handlers with rate limiting
// =============================================================================
export const POST = withRateLimit(createStaffHandler);
export const GET = withRateLimit(getStaffListHandler);
