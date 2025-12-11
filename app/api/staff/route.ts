/**
 * =============================================================================
 * STAFF API ROUTES - /api/staff
 * =============================================================================
 * 
 * This file handles staff member management for businesses.
 * Staff can be assigned to time slots when creating services.
 * 
 * ENDPOINTS:
 * - POST /api/staff  - Create a new staff member
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
 * REQUEST BODY:
 * {
 *   "businessId": "business_id",      // Required - which business
 *   "name": "Jane Smith",             // Required - staff name
 *   "photo": "https://...",           // Optional - profile photo URL
 *   "qualifications": "Licensed...",  // Optional - certifications
 *   "about": "5 years experience..."  // Optional - bio text
 * }
 * 
 * RESPONSE (Success - 201):
 * {
 *   "message": "Staff member added successfully",
 *   "staff": { id, name, photo, qualifications, about, isActive, businessId }
 * }
 * 
 * FLOW:
 * 1. Verify JWT token
 * 2. Validate request body
 * 3. Check business exists
 * 4. Verify user owns the business
 * 5. Create staff member
 * 6. Return staff details
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
    // STEP 2: Parse and validate request body
    // =========================================================================
    const body = await req.json();
    const validatedData = staffCreateSchema.parse(body);

    // =========================================================================
    // STEP 3: Connect to database
    // =========================================================================
    await dbConnect();

    // =========================================================================
    // STEP 4: Verify business exists
    // =========================================================================
    const business = await Business.findById(validatedData.businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // =========================================================================
    // STEP 5: Verify user owns this business
    // =========================================================================
    // Only business owner can add staff to their business
    if (String(business.userId) !== String(decoded.userId)) {
      return NextResponse.json(
        { error: "Unauthorized - You can only add staff to your own business" },
        { status: 403 }
      );
    }

    // Allow staff to be added to pending or approved businesses (for testing)
    // In production, you might want to require business approval first
    if (business.status === "rejected") {
      return NextResponse.json(
        { error: "Cannot add staff to a rejected business" },
        { status: 403 }
      );
    }

    console.log("Creating staff member:", validatedData.name, "for business:", validatedData.businessId);
    console.log("Staff data to create:", {
      businessId: validatedData.businessId,
      name: validatedData.name,
      photo: validatedData.photo || null,
      qualifications: validatedData.qualifications || null,
      about: validatedData.about || null,
    });

    // =========================================================================
    // STEP 6: Create staff member in database
    // =========================================================================
    const staff = await Staff.create({
      businessId: validatedData.businessId,
      name: validatedData.name.trim(),
      photo: validatedData.photo?.trim() || null,
      qualifications: validatedData.qualifications?.trim() || null,
      about: validatedData.about?.trim() || null,
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
