import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import ForgetPass from "@/lib/models/ForgetPass";
import { withRateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/services/mailjet";

async function forgotPasswordHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = forgotPasswordSchema.parse(body);

    await dbConnect();

    // Check if user exists
    const user = await User.findOne({
      email: validatedData.email.toLowerCase(),
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Create forget password record
    const forgetPassRecord = await ForgetPass.create({
      email: validatedData.email.toLowerCase(),
    });

    // Generate reset link - use production URL in production, localhost in development
    const baseUrl = process.env.NEXTAUTH_URL || 
                    (process.env.NODE_ENV === "production" ? "https://ouiimi.com.au" : "http://localhost:3000");
    const resetLink = `${baseUrl}/reset-password?email=${encodeURIComponent(validatedData.email)}&token=${forgetPassRecord._id}`;

    // Send password reset email
    try {
      await sendPasswordResetEmail(
        validatedData.email,
        user.fname,
        resetLink
      );
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // Don't reveal if email failed for security
    }

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(forgotPasswordHandler);

