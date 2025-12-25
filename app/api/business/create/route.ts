/**
 * =============================================================================
 * CREATE BUSINESS API ROUTE - /api/business/create
 * =============================================================================
 * 
 * This endpoint allows authenticated users to register a new business.
 * Each user can only have ONE business (enforced by unique userId index).
 * 
 * HTTP METHOD: POST
 * AUTHENTICATION: Required (Session-based via HttpOnly cookie)
 * 
 * REQUEST BODY:
 * {
 *   "userId": "user_id",              // Must match session userId
 *   "businessName": "My Salon",       // Required, unique
 *   "email": "salon@email.com",       // Required, unique
 *   "address": "123 Main Street",     // Required
 *   "phone": "+1234567890",           // Optional
 *   "story": "About my business..."   // Optional
 * }
 * 
 * RESPONSE (Success - 201):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Business account created successfully",
 *     "business": {
 *       "id": "business_id",
 *       "businessName": "My Salon",
 *       "email": "salon@email.com",
 *       "status": "approved",
 *       "userId": "user_id"
 *     }
 *   }
 * }
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
import { businessCreateSchema } from "@/lib/validation";
import { applyRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/services/mailjet";
import { asyncHandler, APIError, successResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

async function createBusinessHandler(req: NextRequest) {
  // Get session and verify authentication
  const session = await getSession();

  if (!session || !session.userId) {
    throw new APIError(401, "Authentication required. Please sign in.", "UNAUTHORIZED");
  }

  //Apply rate limiting (5 requests per minute for business creation)
  const rateLimitResult = applyRateLimit(req, 5);
  if (rateLimitResult) {
    return rateLimitResult; // Return 429 response if rate limited
  }

  // Parse request body
  const body = await req.json();

  if (!body) {
    throw new APIError(400, "Request body is required", "MISSING_BODY");
  }

  // Security check - verify userId matches session
  if (body.userId && body.userId !== session.userId) {
    throw new APIError(403, "User ID mismatch", "USER_MISMATCH");
  }

  // Use userId from session
  body.userId = session.userId;

  // Validate request body
  const validatedData = businessCreateSchema.parse(body);

  // Connect to database
  await dbConnect();

  // Convert userId to MongoDB ObjectId
  const mongoose = (await import("mongoose")).default;
  let userId;

  if (mongoose.Types.ObjectId.isValid(validatedData.userId)) {
    userId = new mongoose.Types.ObjectId(validatedData.userId);
  } else {
    throw new APIError(400, "Invalid user ID format", "INVALID_USER_ID");
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new APIError(404, "User not found", "USER_NOT_FOUND");
  }

  // Check for existing business
  const existingBusiness = await Business.findOne({
    $or: [
      { userId: userId },
      { businessName: validatedData.businessName },
      { email: validatedData.email.toLowerCase() },
    ],
  });

  if (existingBusiness) {
    if (String(existingBusiness.userId) === String(userId)) {
      throw new APIError(400, "You already have a business registered", "BUSINESS_EXISTS");
    }
    throw new APIError(400, "Business name or email already taken", "DUPLICATE");
  }

  // Prepare business data
  const businessData: any = {
    userId: userId,
    businessName: validatedData.businessName.trim(),
    email: validatedData.email.toLowerCase().trim(),
    address: typeof validatedData.address === 'string'
      ? validatedData.address.trim()
      : validatedData.address.street.trim(),
    location: typeof validatedData.address === 'object' && validatedData.address.location
      ? validatedData.address.location
      : undefined,
    // status defaults to "pending" from Business model schema
  };

  // Add optional fields
  if (validatedData.phone) businessData.phone = validatedData.phone.trim();
  if (validatedData.story) businessData.story = validatedData.story.trim();
  if (validatedData.website) businessData.website = validatedData.website.trim();
  if (validatedData.socialMedia) businessData.socialMedia = validatedData.socialMedia.trim();

  // Create business
  let business;
  try {
    business = await Business.create(businessData);
  } catch (createError: any) {
    if (createError.code === 11000) {
      const field = Object.keys(createError.keyPattern || {})[0];
      throw new APIError(400, `${field} already exists`, "DUPLICATE");
    }
    throw new APIError(500, "Failed to create business", "DB_ERROR");
  }

  // Send welcome email (non-blocking)
  sendEmail(
    [business.email],
    "Welcome to Ouiimi - Business Account Created",
    {
      email: business.email,
      businessName: business.businessName
    },
    "business_welcome"
  ).catch(e => console.error("Failed to send welcome email:", e));

  // Return success
  return successResponse({
    message: "Business account created successfully",
    business: {
      id: String(business._id),
      businessName: business.businessName,
      email: business.email,
      status: business.status,
      userId: String(business.userId),
    },
  }, 201);
}

export const POST = asyncHandler(createBusinessHandler);
