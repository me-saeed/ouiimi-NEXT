import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { bankDetailsSchema } from "@/lib/validation";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

async function updateBankDetailsHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = bankDetailsSchema.parse(body);

    await dbConnect();

    const business = await Business.findById(params.id);

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    business.bankDetails = validatedData;
    await business.save();

    return NextResponse.json(
      {
        message: "Bank details updated successfully",
        bankDetails: business.bankDetails,
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

    console.error("Update bank details error:", error);
    return NextResponse.json(
      { error: "Failed to update bank details" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimitDynamic(updateBankDetailsHandler);
export const PUT = withRateLimitDynamic(updateBankDetailsHandler);

