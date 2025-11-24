import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { businessUpdateSchema } from "@/lib/validation";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

async function getBusinessHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const business = await Business.findById(params.id).populate("userId", "fname lname email");

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Type-safe userId handling
    let userIdData: any;
    if (business.userId && typeof business.userId === 'object' && 'fname' in business.userId) {
      // Populated user object
      const user = business.userId as any;
      userIdData = {
        id: user._id?.toString() || user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
      };
    } else {
      // Just ObjectId
      userIdData = business.userId?.toString() || business.userId;
    }

    return NextResponse.json(
      {
        business: {
          id: business._id?.toString() || business._id,
          _id: business._id?.toString() || business._id,
          userId: userIdData,
          businessName: business.businessName,
          email: business.email,
          phone: business.phone,
          address: business.address,
          logo: business.logo,
          story: business.story,
          status: business.status,
          bankDetails: business.bankDetails,
          createdAt: business.createdAt,
          updatedAt: business.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get business error:", error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}

async function updateBusinessHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = businessUpdateSchema.parse(body);

    await dbConnect();

    const business = await Business.findById(params.id);

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    Object.assign(business, validatedData);
    await business.save();

    // Verify business was saved
    const savedBusiness = await Business.findById(business._id);
    if (!savedBusiness) {
      console.error("Business update was not saved to database!");
      return NextResponse.json(
        { error: "Failed to save business update. Please try again." },
        { status: 500 }
      );
    }

    console.log("Business updated and verified. ID:", String(savedBusiness._id));

    return NextResponse.json(
      {
        message: "Business updated successfully",
        business: {
          id: String(business._id),
          businessName: business.businessName,
          email: business.email,
          status: business.status,
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

    console.error("Update business error:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimitDynamic(getBusinessHandler);
export const PUT = withRateLimitDynamic(updateBusinessHandler);

