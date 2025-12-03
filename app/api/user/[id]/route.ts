import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/jwt";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const userUpdateSchema = z.object({
  fname: z.string().min(1).optional(),
  lname: z.string().optional(),
  email: z.string().email().optional(),
  contactNo: z.string().optional(),
  address: z.string().optional(),
  pic: z.string().optional(),
});

async function updateUserHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    if (String(params.id) !== String(decoded.userId)) {
      return NextResponse.json(
        { error: "Unauthorized - can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = userUpdateSchema.parse(body);

    await dbConnect();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    Object.assign(user, validatedData);
    await user.save();

    return NextResponse.json(
      {
        message: "User updated successfully",
        user: {
          id: String(user._id),
          fname: user.fname,
          lname: user.lname,
          email: user.email,
          contactNo: user.contactNo,
          address: user.address,
          pic: user.pic,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update user error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export const PUT = withRateLimitDynamic(updateUserHandler);

