/**
 * =============================================================================
 * SIGNUP API ROUTE - /api/auth/signup (Production-Ready)
 * =============================================================================
 * 
 * Handles new user registration with security hardening.
 * 
 * SECURITY FEATURES:
 * - Strict rate limiting (5 requests/minute per IP)
 * - Password hashing with bcrypt (12 rounds)
 * - Duplicate email/username prevention
 * - Auto-login with HttpOnly cookie session
 * - Email verification system
 * 
 * REQUEST: POST /api/auth/signup
 * Body: { fname, lname, email, username, password, address?, contactNo? }
 * 
 * RESPONSE: { message: string, user: UserData }
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validation";
import { createSession } from "@/lib/session";
import { strictRateLimit } from "@/lib/rate-limit";
import {
  errorResponse,
  createdResponse,
  APIErrors,
  asyncHandler,
  APIError
} from "@/lib/api-response";
import EmailService from "@/lib/email-service";
import crypto from "crypto";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function signupHandler(req: NextRequest) {
  // ==========================================================================
  // STEP 1: Strict Rate Limiting (5 requests/minute for signup)
  // ==========================================================================
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateLimitResult = strictRateLimit(ip);

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
    return errorResponse(
      new APIError(
        429,
        'Too many signup attempts. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        { retryAfter }
      )
    );
  }

  // ==========================================================================
  // STEP 2: Parse and validate request body
  // ==========================================================================
  const body = await req.json();
  const validatedData = signupSchema.parse(body);

  // ==========================================================================
  // STEP 3: Connect to database
  // ==========================================================================
  await dbConnect();

  // ==========================================================================
  // STEP 4: Check for existing user
  // ==========================================================================
  const existingUser = await User.findOne({
    $or: [
      { email: validatedData.email.toLowerCase() },
      { username: validatedData.username.toLowerCase() },
    ],
  });

  if (existingUser) {
    throw new APIError(
      400,
      "Email or username already exists",
      "DUPLICATE_USER"
    );
  }

  // ==========================================================================
  // STEP 5: Hash password (12 rounds)
  // ==========================================================================
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  // ==========================================================================
  // STEP 6: Generate unique counter ID
  // ==========================================================================
  const lastRecord = await User.findOne().sort({ counterId: -1 }).limit(1);
  const counterId = lastRecord ? lastRecord.counterId + 1 : 1;

  // ==========================================================================
  // STEP 7: Generate verification token
  // ==========================================================================
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // ==========================================================================
  // STEP 8: Create user in database
  // ==========================================================================
  const user: IUser = await User.create({
    fname: validatedData.fname,
    lname: validatedData.lname,
    email: validatedData.email.toLowerCase(),
    username: validatedData.username.toLowerCase(),
    password: hashedPassword,
    address: typeof validatedData.address === 'string'
      ? validatedData.address
      : validatedData.address?.street || null,
    location: typeof validatedData.address === 'object' && validatedData.address?.location
      ? validatedData.address.location
      : undefined,
    contactNo: validatedData.contactNo || null,
    counterId,
    verify: "no", // Verification required
    verificationToken,
    verificationTokenExpiry,
  });

  if (!user || !user._id) {
    throw new APIError(500, "Failed to create user", "USER_CREATION_FAILED");
  }

  // ==========================================================================
  // STEP 9: Create session (auto-login)
  // ==========================================================================
  await createSession({
    userId: String(user._id),
    email: user.email,
    role: 'user',
    fname: user.fname,
    lname: user.lname,
  });

  // ==========================================================================
  // STEP 10: Send verification email (async, don't wait)
  // ==========================================================================
  const { getBaseUrl } = await import('@/lib/utils/url');
  const baseUrl = getBaseUrl();
  const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

  EmailService.sendAccountVerification(user as any, verificationLink).catch(error => {
    console.error('[Signup] Verification email failed:', error);
  });

  // ==========================================================================
  // STEP 11: Return success response (201 Created)
  // ==========================================================================
  return createdResponse({
    message: "Account created successfully",
    user: {
      id: String(user._id),
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      username: user.username,
      role: 'user',
    },
  });
}

// =============================================================================
// EXPORT: Wrap with async error handler
// =============================================================================
export const POST = asyncHandler(signupHandler);
