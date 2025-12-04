import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import { serviceCreateSchema } from "@/lib/validation";
import mongoose from "mongoose";
import { withRateLimit } from "@/lib/security/rate-limit";
import { verifyToken } from "@/lib/jwt";
import { handleError } from "@/lib/errors/error-handler";
import { AuthenticationError, AuthorizationError, NotFoundError, DatabaseError } from "@/lib/errors/api-error";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

async function createServiceHandler(req: NextRequest) {
  try {


    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("Authorization token required");
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError("Invalid or expired token");
    }



    const body = await req.json();

    const validatedData = serviceCreateSchema.parse(body);

    await dbConnect();

    const business = await Business.findById(validatedData.businessId);
    if (!business) {
      throw new NotFoundError("Business not found");
    }

    // Check if user owns this business
    if (String(business.userId) !== String(decoded.userId)) {
      throw new AuthorizationError("You can only add services to your own business");
    }

    // Allow services for pending or approved businesses (for testing)
    if (business.status === "rejected") {
      throw new AuthorizationError("Cannot add services to a rejected business");
    }



    const timeSlots = (validatedData.timeSlots || []).map((slot) => ({
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      cost: slot.cost || validatedData.baseCost,
      staffIds: slot.staffIds
        ? slot.staffIds.map((id) => new mongoose.Types.ObjectId(id))
        : [],
      isBooked: false,
    }));



    const service = await Service.create({
      businessId: validatedData.businessId,
      category: validatedData.category,
      subCategory: validatedData.subCategory || null,
      serviceName: validatedData.serviceName,
      duration: validatedData.duration,
      baseCost: validatedData.baseCost,
      description: validatedData.description || null,
      address: validatedData.address,
      addOns: validatedData.addOns || [],
      timeSlots,
      defaultStaffIds: validatedData.defaultStaffIds ? validatedData.defaultStaffIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
      status: "listed",
    });

    // Verify service was saved
    const savedService = await Service.findById(service._id);
    if (!savedService) {
      throw new DatabaseError("Failed to save service. Please try again.");
    }

    logger.info('Service created successfully', {
      serviceId: String(savedService._id),
      businessId: String(savedService.businessId),
      userId: decoded.userId,
    });


    return NextResponse.json(
      {
        message: "Service listed successfully",
        service: {
          id: String(service._id),
          businessId: String(service.businessId),
          category: service.category,
          serviceName: service.serviceName,
          baseCost: service.baseCost,
          status: service.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleError(error, {
      endpoint: '/api/services',
      method: 'POST',
    });
  }
}

async function getServicesHandler(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status") || "listed";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const filter: any = { status };

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (businessId) filter.businessId = businessId;

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate("businessId", "businessName logo address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        services: services.map((s: any) => ({
          id: s._id?.toString() || s._id,
          _id: s._id?.toString() || s._id,
          businessId: typeof s.businessId === 'object' ? {
            id: s.businessId._id?.toString() || s.businessId._id,
            businessName: s.businessId.businessName,
            logo: s.businessId.logo,
            address: s.businessId.address,
          } : s.businessId?.toString() || s.businessId,
          category: s.category,
          subCategory: s.subCategory,
          serviceName: s.serviceName,
          duration: s.duration,
          baseCost: s.baseCost,
          description: s.description,
          address: s.address,
          addOns: s.addOns || [],
          timeSlots: (s.timeSlots || []).filter((ts: any) => !ts.isBooked && new Date(ts.date) >= new Date()),
          status: s.status,
          createdAt: s.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(createServiceHandler);
export const GET = withRateLimit(getServicesHandler);

