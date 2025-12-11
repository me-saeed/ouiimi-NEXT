/**
 * =============================================================================
 * SIGNUP API ROUTE - /api/auth/signup
 * =============================================================================
 * 
 * This endpoint handles new user registration.
 * 
 * HTTP METHOD: POST
 * 
 * REQUEST BODY:
 * {
 *   "fname": "John",            // First name (required)
 *   "lname": "Doe",             // Last name (required)
 *   "email": "user@email.com",  // Email (required, unique)
 *   "username": "johndoe",      // Username (required, unique)
 *   "password": "securepass",   // Password (required, min 6 chars)
 *   "address": "123 Main St",   // Optional
 *   "contactNo": "+1234567890"  // Optional
 * }
 * 
 * RESPONSE (Success - 201):
 * {
 *   "message": "User created successfully",
 *   "user": {
 *     "id": "user_id",
 *     "fname": "John",
 *     "lname": "Doe",
 *     "email": "user@email.com",
 *     "username": "johndoe",
 *     "token": "jwt_token_here"
 *   }
 * }
 * 
 * RESPONSE (Error - 400): { "error": "Email or username already exists" }
 * 
 * SIGNUP FLOW:
 * 1. Validate input with Zod schema
 * 2. Check if email/username already exists
 * 3. Hash password with bcrypt (12 rounds)
 * 4. Generate unique counterId
 * 5. Create user in database
 * 6. Generate JWT token
 * 7. Send welcome email via Mailjet
 * 8. Return user data + token
 */

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

// Force dynamic rendering (no static caching)
export const dynamic = 'force-dynamic';

/**
 * signupHandler - Main registration handler function
 * 
 * @param req - NextRequest object containing registration data
 * @returns NextResponse with new user data and token, or error
 */
async function signupHandler(req: NextRequest) {
  try {
    // CSRF Protection disabled for now
    // TODO: Re-enable CSRF protection after fixing token validation issues

    // =========================================================================
    // STEP 1: Parse and validate request body
    // =========================================================================
    // signupSchema validates: fname, lname, email, username, password
    // Password must meet minimum requirements (6+ chars)
    const body = await req.json();
    const validatedData = signupSchema.parse(body);

    // =========================================================================
    // STEP 2: Connect to database
    // =========================================================================
    await dbConnect();

    // =========================================================================
    // STEP 3: Check if user already exists
    // =========================================================================
    // Check both email AND username to prevent duplicates
    // Both are stored lowercase for case-insensitive uniqueness
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

    // =========================================================================
    // STEP 4: Hash password securely
    // =========================================================================
    // bcrypt.hash() with 12 salt rounds
    // NEVER store plain text passwords!
    // 12 rounds = good balance of security vs performance
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // =========================================================================
    // STEP 5: Generate unique counter ID
    // =========================================================================
    // counterId is a simple incrementing number for each user
    // Used for display purposes (e.g., "Member #1234")
    const lastRecord = await User.findOne().sort({ counterId: -1 }).limit(1);
    const counterId = lastRecord ? lastRecord.counterId + 1 : 1;

    // =========================================================================
    // STEP 6: Create user in database
    // =========================================================================
    // User.create() inserts a new document into the users collection
    // Email and username are lowercased for consistency
    // verify: "yes" means auto-verified (no email confirmation required)
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

    // Verify user was created successfully
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // =========================================================================
    // STEP 7: Generate JWT token
    // =========================================================================
    // User is auto-logged in after signup (no need to login separately)
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      username: user.username || "",
    });

    // Save token to user document
    user.token = token;
    await user.save();

    // =========================================================================
    // STEP 8: Send welcome email
    // =========================================================================
    // Uses Mailjet email service
    // Wrapped in try-catch so email failure doesn't fail signup
    try {
      await sendWelcomeEmail(user.email, user.fname);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the signup if email fails - user is still created
    }

    // =========================================================================
    // STEP 9: Return user data (excluding password)
    // =========================================================================
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
      { status: 201 }  // 201 = Created
    );
  } catch (error: any) {
    console.error("Signup error:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Handle MongoDB duplicate key error (race condition)
    // Error code 11000 = duplicate key violation
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

// =============================================================================
// EXPORT: Wrap with rate limiting
// =============================================================================
export const POST = withRateLimit(signupHandler);
