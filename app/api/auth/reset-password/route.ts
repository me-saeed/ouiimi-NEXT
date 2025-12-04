import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import ForgetPass from "@/lib/models/ForgetPass";
import bcrypt from "bcryptjs";
import { withRateLimit } from "@/lib/security/rate-limit";
import { resetPasswordSchema } from "@/lib/validation";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

async function resetPasswordHandler(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the request body
    // Note: confirmPassword is validated on frontend, but we only need password for the API
    const validatedData = resetPasswordSchema.parse(body);



    await dbConnect();

    // Verify token and email match
    // Convert token string to ObjectId if it's a valid MongoDB ObjectId
    let tokenId;
    try {
      tokenId = new mongoose.Types.ObjectId(validatedData.token);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired reset link. Please request a new password reset.",
        },
        { status: 400 }
      );
    }

    // Find ForgetPass record by ID first (more reliable)
    const forgetPassRecord = await ForgetPass.findById(tokenId);

    if (!forgetPassRecord) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired reset link. Please request a new password reset.",
        },
        { status: 400 }
      );
    }

    // Verify email matches
    if (forgetPassRecord.email.toLowerCase() !== validatedData.email.toLowerCase()) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired reset link. Please request a new password reset.",
        },
        { status: 400 }
      );
    }

    // Check if user exists - try both lowercase and original case
    let user = await User.findOne({
      email: validatedData.email.toLowerCase(),
    });

    // If not found with lowercase, try original case
    if (!user) {
      user = await User.findOne({
        email: validatedData.email,
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Update user password using updateOne to avoid DocumentNotFoundError
    const updateResult = await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // Verify the update was successful
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Delete the forget password record
    await ForgetPass.findByIdAndDelete(forgetPassRecord._id);

    return NextResponse.json(
      {
        message: "Password reset successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Safe error logging
    try {
      console.error("Reset password error:", error);
      if (error?.stack) console.error("Error stack:", error.stack);
      if (error?.name) console.error("Error name:", error.name);
      if (error?.message) console.error("Error message:", error.message);
    } catch (logError) {
      console.error("Error logging failed:", logError);
    }

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors || [] },
        { status: 400 }
      );
    }

    // Log the full error for debugging
    if (process.env.NODE_ENV === "test") {
      try {
        console.error("Full error object:", {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        });
      } catch (logError) {
        // Ignore logging errors
      }
    }

    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", details: errorMessage },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(resetPasswordHandler);

