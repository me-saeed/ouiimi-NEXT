/**
 * =============================================================================
 * SIGNIN API ROUTE - /api/auth/signin
 * =============================================================================
 * 
 * This endpoint handles user login/authentication.
 * 
 * HTTP METHOD: POST
 * 
 * REQUEST BODY:
 * {
 *   "username": "user@email.com" or "username",  // Can be email or username
 *   "password": "userpassword"
 * }
 * 
 * RESPONSE (Success - 200):
 * {
 *   "message": "Login successful",
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
 * RESPONSE (Error - 401): { "error": "Invalid credentials" }
 * RESPONSE (Error - 403): { "error": "Account is disabled" }
 * 
 * AUTHENTICATION FLOW:
 * 1. Validate input with Zod schema
 * 2. Connect to database
 * 3. Find user by email OR username (case-insensitive)
 * 4. Check account is enabled (isEnable === "yes")
 * 5. Check email is verified (verify === "yes")
 * 6. Compare password with bcrypt
 * 7. Generate JWT token with user info
 * 8. Save token to user document
 * 9. Return user data + token
 * 
 * SECURITY:
 * - Rate limited to prevent brute force attacks
 * - Password never returned in response
 * - JWT token expires (configured in lib/jwt.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { signinSchema } from "@/lib/validation";
import { generateToken } from "@/lib/jwt";
import { withRateLimit } from "@/lib/security/rate-limit";
// CSRF protection temporarily disabled
// import { validateCSRFToken } from "@/lib/security/csrf";

// Force dynamic rendering (no static caching for auth routes)
export const dynamic = 'force-dynamic';

/**
 * signinHandler - Main login handler function
 * 
 * @param req - NextRequest object containing the request data
 * @returns NextResponse with user data and token, or error message
 */
async function signinHandler(req: NextRequest) {
  try {
    // CSRF Protection disabled for now
    // TODO: Re-enable CSRF protection after fixing token validation issues

    // =========================================================================
    // STEP 1: Parse and validate request body
    // =========================================================================
    // req.json() extracts the JSON body from the request
    // signinSchema.parse() validates the data against our Zod schema
    // If validation fails, it throws a ZodError
    const body = await req.json();
    const validatedData = signinSchema.parse(body);

    // =========================================================================
    // STEP 2: Connect to MongoDB database
    // =========================================================================
    // dbConnect() establishes connection (or reuses existing connection)
    // This MUST be called before any database operations
    await dbConnect();

    // =========================================================================
    // STEP 3: Find user by email OR username
    // =========================================================================
    // MongoDB $or operator allows searching multiple fields
    // toLowerCase() ensures case-insensitive matching
    // This allows users to login with either their email or username
    const user: IUser | null = await User.findOne({
      $or: [
        { email: validatedData.username.toLowerCase() },
        { username: validatedData.username.toLowerCase() },
      ],
    });

    // If no user found, return generic error (don't reveal if email exists)
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // =========================================================================
    // STEP 4: Check if account is enabled
    // =========================================================================
    // Admins can disable accounts by setting isEnable to "no"
    if (user.isEnable !== "yes") {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 }
      );
    }

    // =========================================================================
    // STEP 5: Check if email is verified
    // =========================================================================
    // Currently auto-verified on signup, but can require email confirmation
    if (user.verify !== "yes") {
      return NextResponse.json(
        { error: "Please verify your email address" },
        { status: 403 }
      );
    }

    // =========================================================================
    // STEP 6: Verify password using bcrypt
    // =========================================================================
    // bcrypt.compare() compares plain text password with hashed password
    // This is secure because we never store plain text passwords
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

    // =========================================================================
    // STEP 7: Generate JWT token
    // =========================================================================
    // generateToken() creates a signed JWT with user info
    // Token contains: { userId, email, username }
    // Token is used for authentication in subsequent requests
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      username: user.username || "",
    });

    // =========================================================================
    // STEP 8: Save token to user document
    // =========================================================================
    // Storing token in DB allows for token invalidation/logout
    user.token = token;
    await user.save();

    // =========================================================================
    // STEP 9: Return user data (excluding sensitive fields like password)
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
        message: "Login successful",
        user: userData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Signin error:", error);

    // Handle Zod validation errors specially
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Generic error for any other issues
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// =============================================================================
// EXPORT: Wrap handler with rate limiting middleware
// =============================================================================
// withRateLimit() wraps the handler to prevent abuse
// Limits requests per IP/user to prevent brute force attacks
export const POST = withRateLimit(signinHandler);
