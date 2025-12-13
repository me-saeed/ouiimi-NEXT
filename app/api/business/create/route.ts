/**
 * =============================================================================
 * CREATE BUSINESS API ROUTE - /api/business/create
 * =============================================================================
 * 
 * This endpoint allows authenticated users to register a new business.
 * Each user can only have ONE business (enforced by unique userId index).
 * 
 * HTTP METHOD: POST
 * AUTHENTICATION: Required (JWT Bearer token)
 * 
 * REQUEST HEADERS:
 * {
 *   "Authorization": "Bearer <jwt_token>"
 * }
 * 
 * REQUEST BODY:
 * {
 *   "userId": "user_id",              // Must match token userId
 *   "businessName": "My Salon",       // Required, unique
 *   "email": "salon@email.com",       // Required, unique
 *   "address": "123 Main Street",     // Required
 *   "phone": "+1234567890",           // Optional
 *   "story": "About my business..."   // Optional
 * }
 * 
 * RESPONSE (Success - 201):
 * {
 *   "message": "Business account created successfully",
 *   "business": {
 *     "id": "business_id",
 *     "businessName": "My Salon",
 *     "email": "salon@email.com",
 *     "status": "approved",
 *     "userId": "user_id"
 *   }
 * }
 * 
 * BUSINESS REGISTRATION FLOW:
 * 1. Verify JWT token (user must be logged in)
 * 2. Validate request body with Zod schema
 * 3. Check userId from token matches userId in body (security)
 * 4. Connect to database
 * 5. Verify user exists in database
 * 6. Check user doesn't already have a business
 * 7. Check businessName and email are not taken
 * 8. Create business with status "approved" (testing) or "pending" (production)
 * 9. Return business details
 * 
 * ERROR CODES:
 * - 400: Validation error, duplicate business name/email
 * - 401: No token or invalid token
 * - 403: User ID mismatch (trying to create business for another user)
 * - 404: User not found
 * - 503: Database connection failed
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
import { businessCreateSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/security/rate-limit";
import { verifyToken } from "@/lib/jwt";

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';

/**
 * createBusinessHandler - Main handler for business registration
 */
async function createBusinessHandler(req: NextRequest) {
  try {
    // =========================================================================
    // STEP 1: Extract and verify JWT token
    // =========================================================================
    // Token format: "Bearer <jwt_token>"
    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)  // Remove "Bearer " prefix
      : null;

    if (!token) {
      console.error("No authorization token provided");
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    // verifyToken() returns { userId, email, username } or null if invalid
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.error("Invalid or expired token");
      return NextResponse.json(
        { error: "Invalid or expired token. Please sign in again." },
        { status: 401 }
      );
    }

    // =========================================================================
    // STEP 2: Parse request body
    // =========================================================================
    let body;
    try {
      body = await req.json();
    } catch (jsonError: any) {
      console.error("Error parsing request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 3: Security check - verify userId matches token
    // =========================================================================
    // This prevents users from creating businesses for other users
    if (body.userId && body.userId !== decoded.userId) {
      console.error("UserId mismatch. Token userId:", decoded.userId, "Body userId:", body.userId);
      return NextResponse.json(
        { error: "User ID mismatch. You can only create a business for your own account." },
        { status: 403 }
      );
    }

    // Use userId from token if not provided in body
    if (!body.userId) {
      body.userId = decoded.userId;
    }

    // =========================================================================
    // STEP 4: Validate request body with Zod schema
    // =========================================================================
    let validatedData;
    try {
      validatedData = businessCreateSchema.parse(body);
    } catch (validationError: any) {
      console.error("Validation error:", validationError);
      if (validationError.name === "ZodError") {
        const errorMessages = validationError.errors.map((e: any) =>
          `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        return NextResponse.json(
          {
            error: "Validation failed",
            details: errorMessages
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // =========================================================================
    // STEP 5: Connect to database
    // =========================================================================
    try {
      const dbConnection = await dbConnect();
      // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (dbConnection.connection.readyState !== 1) {
        console.warn("Database connection state is not 'connected'");
      }
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      console.error("Error message:", dbError.message);
      console.error("Error stack:", dbError.stack);
      return NextResponse.json(
        {
          error: "Database connection failed. Please try again later.",
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 503 }
      );
    }

    // =========================================================================
    // STEP 6: Convert userId to MongoDB ObjectId
    // =========================================================================
    const mongoose = (await import("mongoose")).default;
    let userId;

    try {
      if (mongoose.Types.ObjectId.isValid(validatedData.userId)) {
        userId = new mongoose.Types.ObjectId(validatedData.userId);
      } else {
        return NextResponse.json(
          { error: "Invalid user ID format" },
          { status: 400 }
        );
      }
    } catch (err) {
      console.error("Error converting userId to ObjectId:", err);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 7: Verify user exists in database
    // =========================================================================
    let user = await User.findById(userId);
    if (!user) {
      console.error("User not found with ObjectId, trying string ID:", validatedData.userId);
      // Try to find user by string ID as fallback
      user = await User.findById(validatedData.userId);
      if (!user) {
        return NextResponse.json(
          { error: `User not found with ID: ${validatedData.userId}. Please sign in again.` },
          { status: 404 }
        );
      }

      // Update userId to match the found user
      userId = user._id;
    }
    console.log("User found:", user.email);

    // =========================================================================
    // STEP 8: Check for existing business
    // =========================================================================
    // Users can only have ONE business (userId is unique in Business model)
    // Also check if businessName or email is already taken
    const existingBusiness = await Business.findOne({
      $or: [
        { userId: userId },
        { businessName: validatedData.businessName },
        { email: validatedData.email.toLowerCase() },
      ],
    });

    if (existingBusiness) {
      console.error("Business already exists:", existingBusiness);
      if (String(existingBusiness.userId) === String(userId)) {
        return NextResponse.json(
          { error: "You already have a business registered. Please update your existing business instead." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Business name or email already taken" },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 9: Prepare business data
    // =========================================================================
    const businessData: any = {
      userId: userId,
      businessName: validatedData.businessName.trim(),
      email: validatedData.email.toLowerCase().trim(),
      address: typeof validatedData.address === 'string' ? validatedData.address.trim() : validatedData.address.street.trim(),
      location: typeof validatedData.address === 'object' && validatedData.address.location ? validatedData.address.location : undefined,
      // NOTE: "approved" for testing, change to "pending" for production
      // "pending" requires admin approval before business can list services
      status: "approved",
    };

    // Add optional fields only if they exist
    if (validatedData.phone) {
      businessData.phone = validatedData.phone.trim();
    }
    if (validatedData.story) {
      businessData.story = validatedData.story.trim();
    }

    // =========================================================================
    // STEP 10: Create business in database
    // =========================================================================
    let business;
    try {
      // Business.create() inserts document into businesses collection
      business = await Business.create(businessData);

      // Double-check that business was saved (paranoid check)
      const savedBusiness = await Business.findById(business._id);
      if (!savedBusiness) {
        console.error("Business was not saved to database!");
        return NextResponse.json(
          { error: "Failed to save business to database. Please try again." },
          { status: 500 }
        );
      }

    } catch (createError: any) {
      console.error("Error creating business:", createError);
      console.error("Error code:", createError.code);
      console.error("Error message:", createError.message);
      console.error("Error stack:", createError.stack);

      // Handle MongoDB duplicate key error (code 11000)
      if (createError.code === 11000) {
        const duplicateField = Object.keys(createError.keyPattern || {})[0];
        return NextResponse.json(
          { error: `${duplicateField} already exists` },
          { status: 400 }
        );
      }

      // Re-throw to be caught by outer catch
      throw createError;
    }

    // =========================================================================
    // STEP 11: Return success response
    // =========================================================================
    return NextResponse.json(
      {
        message: "Business account created successfully. Pending approval.",
        business: {
          id: String(business._id),
          businessName: business.businessName,
          email: business.email,
          status: business.status,
          userId: String(business.userId),
        },
      },
      { status: 201 }  // 201 = Created
    );
  } catch (error: any) {
    console.error("Business creation error:", error);
    console.error("Error stack:", error.stack);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      // Duplicate key error
      return NextResponse.json(
        { error: "Business name or email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create business account",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// EXPORT: Wrap with rate limiting
// =============================================================================
export const POST = withRateLimit(createBusinessHandler);
