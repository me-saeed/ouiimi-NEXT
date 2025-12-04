import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
import { businessCreateSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/security/rate-limit";
import { verifyToken } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

async function createBusinessHandler(req: NextRequest) {
  try {


    // Verify authentication token
    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      console.error("No authorization token provided");
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.error("Invalid or expired token");
      return NextResponse.json(
        { error: "Invalid or expired token. Please sign in again." },
        { status: 401 }
      );
    }



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

    // Verify userId from token matches userId in request body
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

    // Convert userId to ObjectId
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

    // Check for existing business
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



    // Prepare business data
    const businessData: any = {
      userId: userId,
      businessName: validatedData.businessName.trim(),
      email: validatedData.email.toLowerCase().trim(),
      address: validatedData.address.trim(),
      status: "approved", // Auto-approve for testing. Change to "pending" for production with admin approval
    };

    // Add optional fields only if they exist
    if (validatedData.phone) {
      businessData.phone = validatedData.phone.trim();
    }
    if (validatedData.story) {
      businessData.story = validatedData.story.trim();
    }



    let business;
    try {
      business = await Business.create(businessData);

      // Verify the business was actually saved to database
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

      if (createError.code === 11000) {
        // Duplicate key error
        const duplicateField = Object.keys(createError.keyPattern || {})[0];
        return NextResponse.json(
          { error: `${duplicateField} already exists` },
          { status: 400 }
        );
      }

      // Re-throw to be caught by outer catch
      throw createError;
    }

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
      { status: 201 }
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

export const POST = withRateLimit(createBusinessHandler);

