import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { signinSchema } from "@/lib/validation";
import { generateToken } from "@/lib/jwt";
import { withRateLimit } from "@/lib/security/rate-limit";
// CSRF protection temporarily disabled
// import { validateCSRFToken } from "@/lib/security/csrf";

export const dynamic = 'force-dynamic';

async function signinHandler(req: NextRequest) {
  try {
    // CSRF Protection disabled for now
    // TODO: Re-enable CSRF protection after fixing token validation issues

    const body = await req.json();
    const validatedData = signinSchema.parse(body);

    await dbConnect();

    // Find user by email or username
    const user: IUser | null = await User.findOne({
      $or: [
        { email: validatedData.username.toLowerCase() },
        { username: validatedData.username.toLowerCase() },
      ],
    });

    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is enabled
    if (user.isEnable !== "yes") {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    // Check if user is verified (if email verification is enabled)
    if (user.verify !== "yes") {
      return NextResponse.json(
        { error: "Please verify your email address" },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      username: user.username || "",
    });

    // Update user with token
    user.token = token;
    await user.save();

    // Return user data (excluding password)
    const userData = {
      id: String(user._id),
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      username: user.username,
      token,
    };

    return NextResponse.json(
      {
        message: "Login successful",
        user: userData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Signin error:", error);

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

export const POST = withRateLimit(signinHandler);

