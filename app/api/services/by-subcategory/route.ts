import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import mongoose from "mongoose";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError } from "@/lib/api-response";
import { handleError } from "@/lib/errors/error-handler";

export const dynamic = 'force-dynamic';

/**
 * GET /api/services/by-subcategory
 * 
 * Fetches an existing service for a business by subcategory.
 * Used in service creation form to implement "upsert" behavior -
 * one service per subcategory per business.
 * 
 * Query params:
 * - businessId (required): The business ID
 * - subCategory (required): The subcategory name
 * 
 * Returns:
 * - { exists: true, service: {...} } if service exists
 * - { exists: false } if no service for that subcategory
 */
export async function GET(req: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResponse = applyRateLimit(req, 30);
        if (rateLimitResponse) return rateLimitResponse;

        // Authentication required
        const session = await authenticateRequest(req);

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");
        const subCategory = searchParams.get("subCategory");

        if (!businessId || !subCategory) {
            throw new APIError(400, "businessId and subCategory are required", "MISSING_PARAMS");
        }

        if (!mongoose.Types.ObjectId.isValid(businessId)) {
            throw new APIError(400, "Invalid businessId format", "INVALID_ID");
        }

        await dbConnect();

        // Verify business ownership
        const business = await Business.findById(businessId);
        if (!business) {
            throw new APIError(404, "Business not found", "BUSINESS_NOT_FOUND");
        }

        if (String(business.userId) !== String(session.userId)) {
            throw new APIError(403, "You can only access your own business services", "FORBIDDEN");
        }

        // Find existing service for this subcategory
        const existingService = await Service.findOne({
            businessId: new mongoose.Types.ObjectId(businessId),
            subCategory: subCategory,
        }).lean();

        if (!existingService) {
            return NextResponse.json({ exists: false });
        }

        // Transform timeSlots for frontend consumption
        const transformedTimeSlots = (existingService.timeSlots || []).map((slot: any) => ({
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: slot.price,
            duration: slot.duration,
            // Extract staffIds for frontend (array of string IDs)
            staffIds: (slot.staffIds || []).map((s: any) =>
                typeof s === 'object' && s.staffId ? String(s.staffId) : String(s)
            ),
            addOns: slot.addOns || [],
            isBooked: slot.isBooked || false,
        }));

        return NextResponse.json({
            exists: true,
            service: {
                id: String(existingService._id),
                businessId: String(existingService.businessId),
                category: existingService.category,
                subCategory: existingService.subCategory,
                serviceName: existingService.serviceName,
                description: existingService.description || "",
                address: existingService.address,
                addOns: existingService.addOns || [],
                timeSlots: transformedTimeSlots,
                defaultStaffIds: (existingService.defaultStaffIds || []).map((id: any) => String(id)),
                status: existingService.status,
            },
        });
    } catch (error: any) {
        console.error("[API /api/services/by-subcategory GET] Error:", error.message);
        return handleError(error, {
            endpoint: '/api/services/by-subcategory',
            method: 'GET',
        });
    }
}
