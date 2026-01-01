/**
 * =============================================================================
 * BUSINESS SESSION API - /api/auth/business-session
 * =============================================================================
 * 
 * Handles business re-authentication:
 * POST - Verify credentials and create business session
 * DELETE - Destroy business session (when leaving business routes)
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Business from "@/lib/models/Business";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { createBusinessSession, destroyBusinessSession } from "@/lib/business-session";
import { applyRateLimit } from "@/lib/rate-limit";
import {
    errorResponse,
    successResponse,
    APIErrors,
    APIError,
    asyncHandler
} from "@/lib/api-response";

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/business-session
 * Re-authenticate for business access
 */
async function createBusinessSessionHandler(req: NextRequest) {
    // Rate limit: 5 attempts per minute
    const rateLimitResponse = applyRateLimit(req, 5);
    if (rateLimitResponse) return rateLimitResponse;

    // Must be logged in as shopper first
    const shopperSession = await getSession();
    if (!shopperSession) {
        throw new APIError(401, "Please sign in first", "NOT_AUTHENTICATED");
    }

    // Parse request body
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
        throw new APIError(400, "Username and password are required", "MISSING_CREDENTIALS");
    }

    // Connect to database
    await dbConnect();

    // Find user (must match current session)
    const user = await User.findOne({
        $or: [
            { email: username.toLowerCase() },
            { username: username.toLowerCase() },
        ],
    }).select('+password');

    if (!user || !user._id) {
        throw new APIError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    // Verify this is the same user as the shopper session
    if (String(user._id) !== shopperSession.userId) {
        throw new APIError(401, "Credentials must match your logged-in account", "USER_MISMATCH");
    }

    // Verify password
    if (!user.password) {
        throw new APIError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new APIError(401, "Invalid password", "INVALID_PASSWORD");
    }

    // Check if user has a business
    const business = await Business.findOne({ userId: user._id });

    // Create business session
    const sessionToken = await createBusinessSession({
        userId: String(user._id),
        email: user.email,
        businessId: business ? String(business._id) : undefined,
    });

    // Return success with cookie set
    const response = successResponse({
        message: "Business access granted",
        hasBusiness: !!business,
        businessId: business ? String(business._id) : null,
    });

    // Explicitly set cookie in response
    response.cookies.set('business-session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
    });

    return response;
}

/**
 * DELETE /api/auth/business-session
 * Clear business session (when leaving business routes)
 */
async function deleteBusinessSessionHandler(req: NextRequest) {
    destroyBusinessSession();

    const response = successResponse({
        message: "Business session cleared",
    });

    // Explicitly delete cookie in response
    response.cookies.delete('business-session');

    return response;
}

export const POST = asyncHandler(createBusinessSessionHandler);
export const DELETE = asyncHandler(deleteBusinessSessionHandler);
