/**
 * =============================================================================
 * SIGNIN API ROUTE - /api/auth/signin (Production-Ready)
 * =============================================================================
 * 
 * Handles user authentication with server-side sessions and security hardening.
 * 
 * SECURITY FEATURES:
 * - Rate limiting (10 requests/minute per IP)
 * - HttpOnly cookie sessions (no localStorage)
 * - Secure password hashing with bcrypt
 * - Account status validation
 * - Standardized error responses
 * 
 * REQUEST: POST /api/auth/signin
 * Body: { username: string, password: string }
 * 
 * RESPONSE: { message: string, user: UserData }
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { signinSchema } from "@/lib/validation";
import { createSession } from "@/lib/session";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  errorResponse,
  successResponse,
  APIErrors,
  APIError,
  asyncHandler
} from "@/lib/api-response";
import { sendWelcomeEmail } from "@/lib/services/mailjet";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function signinHandler(req: NextRequest) {
  // ==========================================================================
  // STEP 1: Rate Limiting (10 requests/minute)
  // ==========================================================================
  const rateLimitResponse = applyRateLimit(req, 10);
  if (rateLimitResponse) return rateLimitResponse;

  // ==========================================================================
  // STEP 2: Parse and validate request body
  // ==========================================================================
  const body = await req.json();
  const validatedData = signinSchema.parse(body);

  // ==========================================================================
  // STEP 3: Connect to database
  // ==========================================================================
  await dbConnect();

  // ==========================================================================
  // STEP 4: Find user (case-insensitive)
  // ==========================================================================
  const user: IUser | null = await User.findOne({
    $or: [
      { email: validatedData.username.toLowerCase() },
      { username: validatedData.username.toLowerCase() },
    ],
  }).select('+password'); // Explicitly include password field

  if (!user || !user._id) {
    throw APIErrors.Unauthorized;
  }

  // ==========================================================================
  // STEP 5: Account validation
  // ==========================================================================
  if (user.isEnable !== "yes") {
    throw new APIError(
      403,
      "Account is disabled. Please contact support.",
      "ACCOUNT_DISABLED"
    );
  }

  if (user.verify !== "yes") {
    throw new APIError(
      403,
      "Please verify your email address before signing in.",
      "EMAIL_NOT_VERIFIED"
    );
  }

  // ==========================================================================
  // STEP 6: Verify password
  // ==========================================================================
  if (!user.password) {
    throw APIErrors.Unauthorized;
  }

  const isPasswordValid = await bcrypt.compare(
    validatedData.password,
    user.password
  );

  if (!isPasswordValid) {
    throw APIErrors.Unauthorized;
  }

  // ==========================================================================
  // STEP 7: Create server-side session (HttpOnly cookie)
  // ==========================================================================
  // Determine best role (prioritize admin > business > user)
  // CRITICAL: Check for business ownership to set correct role
  const { Business } = await import('@/lib/models');
  const userBusiness = await Business.findOne({ userId: user._id });

  let userRole = 'user';
  if (user.Roles?.includes('admin')) {
    userRole = 'admin';
  } else if (user.Roles?.includes('business') || userBusiness) {
    userRole = 'business';
    // Update user Roles array if they have a business but aren't in Roles
    if (!user.Roles?.includes('business')) {
      user.Roles = user.Roles || [];
      if (!user.Roles.includes('business')) {
        user.Roles.push('business');
      }
    }
  }

  const sessionToken = await createSession({
    userId: String(user._id),
    email: user.email,
    role: userRole,
    fname: user.fname,
    lname: user.lname,
  });

  // ==========================================================================
  // STEP 8: Update last login date
  // ==========================================================================
  const isFirstLogin = !user.lastLoginDate;
  user.lastLoginDate = new Date();
  await user.save();

  // ==========================================================================
  // STEP 9: Send welcome email on first login (async, don't wait)
  // ==========================================================================
  if (isFirstLogin) {
    sendWelcomeEmail(user.email, user.fname).catch(error => {
      console.error('[Signin] Welcome email failed:', error);
    });
  }

  // ==========================================================================
  // STEP 10: Return success response with session cookie
  // ==========================================================================
  const response = successResponse({
    message: "Login successful",
    user: {
      id: String(user._id),
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      username: user.username,
      role: user.Roles?.[0] || 'user',
    },
  });

  // Set cookie explicitly in response headers
  response.cookies.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
}

// =============================================================================
// EXPORT: Wrap with async error handler
// =============================================================================
export const POST = asyncHandler(signinHandler);
