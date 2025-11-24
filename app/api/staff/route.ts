import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Staff from "@/lib/models/Staff";
import Business from "@/lib/models/Business";
import { staffCreateSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/security/rate-limit";

async function createStaffHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = staffCreateSchema.parse(body);

    await dbConnect();

    const business = await Business.findById(validatedData.businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (business.status !== "approved") {
      return NextResponse.json(
        { error: "Business must be approved to add staff" },
        { status: 403 }
      );
    }

    const staff = await Staff.create({
      businessId: validatedData.businessId,
      name: validatedData.name,
      photo: validatedData.photo || null,
      qualifications: validatedData.qualifications || null,
      about: validatedData.about || null,
    });

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

    return NextResponse.json(
      {
        message: "Staff member added successfully",
        staff: {
          id: String(staff._id),
          name: staff.name,
          photo: staff.photo,
          isActive: staff.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create staff error:", error);
    return NextResponse.json(
      { error: "Failed to add staff member" },
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

