import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validation";
import { generateToken } from "@/lib/jwt";
import { withRateLimit } from "@/lib/security/rate-limit";
// CSRF protection temporarily disabled
// import { validateCSRFToken } from "@/lib/security/csrf";
import { sendWelcomeEmail } from "@/lib/services/mailjet";

export const dynamic = 'force-dynamic';

async function signupHandler(req: NextRequest) {
  try {
    // CSRF Protection disabled for now
    // TODO: Re-enable CSRF protection after fixing token validation issues

    const body = await req.json();
    const validatedData = signupSchema.parse(body);

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: validatedData.email.toLowerCase() },
        { username: validatedData.username.toLowerCase() },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Get counter ID
    const lastRecord = await User.findOne().sort({ counterId: -1 }).limit(1);
    const counterId = lastRecord ? lastRecord.counterId + 1 : 1;

    // Create user
    const user: IUser = await User.create({
      fname: validatedData.fname,
      lname: validatedData.lname,
      email: validatedData.email.toLowerCase(),
      username: validatedData.username.toLowerCase(),
      password: hashedPassword,
      address: validatedData.address || null,
      contactNo: validatedData.contactNo || null,
      counterId,
      verify: "yes", // Auto-verify for now, can add email verification later
    });

    // Ensure user has _id
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
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

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.fname);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the signup if email fails
    }

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
        message: "User created successfully",
        user: userData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(signupHandler);

