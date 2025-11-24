import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Staff from "@/lib/models/Staff";
import { staffUpdateSchema } from "@/lib/validation";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

async function getStaffHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const staff = await Staff.findById(params.id).populate("businessId", "businessName");

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Type-safe businessId handling
    let businessIdData: any;
    if (staff.businessId && typeof staff.businessId === 'object' && 'businessName' in staff.businessId) {
      // Populated business object
      const business = staff.businessId as any;
      businessIdData = {
        id: business._id?.toString() || business._id,
        businessName: business.businessName,
      };
    } else {
      // Just ObjectId
      businessIdData = staff.businessId?.toString() || staff.businessId;
    }

    return NextResponse.json(
      {
        staff: {
          id: staff._id?.toString() || staff._id,
          _id: staff._id?.toString() || staff._id,
          businessId: businessIdData,
          name: staff.name,
          photo: staff.photo,
          qualifications: staff.qualifications,
          about: staff.about,
          isActive: staff.isActive,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

async function updateStaffHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = staffUpdateSchema.parse(body);

    await dbConnect();

    const staff = await Staff.findById(params.id);

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    Object.assign(staff, validatedData);
    await staff.save();

    // Verify staff was saved
    const savedStaff = await Staff.findById(staff._id);
    if (!savedStaff) {
      console.error("Staff update was not saved to database!");
      return NextResponse.json(
        { error: "Failed to save staff update. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Staff member updated successfully",
        staff: {
          id: String(staff._id),
          name: staff.name,
          isActive: staff.isActive,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update staff error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

async function deleteStaffHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const staff = await Staff.findById(params.id);

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    staff.isActive = false;
    await staff.save();

    return NextResponse.json(
      {
        message: "Staff member deactivated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete staff error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate staff member" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimitDynamic(getStaffHandler);
export const PUT = withRateLimitDynamic(updateStaffHandler);
export const DELETE = withRateLimitDynamic(deleteStaffHandler);

