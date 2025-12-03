import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Staff from "@/lib/models/Staff";
import Business from "@/lib/models/Business";
import { staffCreateSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/security/rate-limit";
import { verifyToken } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

async function createStaffHandler(req: NextRequest) {
  try {
    // Verify authentication
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

    const body = await req.json();
    const validatedData = staffCreateSchema.parse(body);

    await dbConnect();

    // Verify user owns the business
    const business = await Business.findById(validatedData.businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Check if user owns this business
    if (String(business.userId) !== String(decoded.userId)) {
      return NextResponse.json(
        { error: "Unauthorized - You can only add staff to your own business" },
        { status: 403 }
      );
    }

    // Allow staff to be added to pending or approved businesses
    // (For testing, we allow pending businesses to add staff)
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

    const staff = await Staff.create({
      businessId: validatedData.businessId,
      name: validatedData.name.trim(),
      photo: validatedData.photo?.trim() || null,
      qualifications: validatedData.qualifications?.trim() || null,
      about: validatedData.about?.trim() || null,
    });

    console.log("Staff created, ID:", String(staff._id));

    // Verify staff was saved
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

    return NextResponse.json(
      {
        message: "Staff member added successfully",
        staff: {
          id: String(savedStaff._id),
          _id: String(savedStaff._id),
          name: savedStaff.name,
          photo: savedStaff.photo,
          qualifications: savedStaff.qualifications,
          about: savedStaff.about,
          isActive: savedStaff.isActive,
          businessId: String(savedStaff.businessId),
        },
      },
      { status: 201 }
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

async function getStaffListHandler(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const isActive = searchParams.get("isActive");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    const filter: any = { businessId };
    if (isActive !== null) {
      filter.isActive = isActive === "true";
    }

    const staff = await Staff.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        staff: staff.map((s: any) => ({
          id: s._id?.toString() || s._id,
          _id: s._id?.toString() || s._id,
          name: s.name,
          photo: s.photo,
          qualifications: s.qualifications,
          about: s.about,
          bio: s.about, // Map 'about' to 'bio' for compatibility
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

export const POST = withRateLimit(createStaffHandler);
export const GET = withRateLimit(getStaffListHandler);

