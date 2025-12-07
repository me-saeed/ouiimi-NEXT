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



    // Calculate duration helper function
    const calculateDuration = (startTime: string, endTime: string): number => {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      // Handle case where end time is next day (e.g., 23:00 to 01:00)
      let duration = endTotalMinutes - startTotalMinutes;
      if (duration < 0) {
        duration += 24 * 60; // Add 24 hours
      }
      
      return duration;
    };

    const timeSlots = (validatedData.timeSlots || []).map((slot) => {
      // Calculate duration from start and end time
      const duration = slot.duration || calculateDuration(slot.startTime, slot.endTime);
      
      return {
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        price: slot.price, // Required price for this time slot
        duration, // Computed duration in minutes
        staffIds: slot.staffIds
          ? slot.staffIds.map((id) => new mongoose.Types.ObjectId(id))
          : [],
        isBooked: false,
      };
    });

    const service = await Service.create({
      businessId: validatedData.businessId,
      category: validatedData.category,
      subCategory: validatedData.subCategory || null,
      serviceName: validatedData.serviceName,
      description: validatedData.description || null,
      address: {
        street: validatedData.address.street,
        location: {
          type: "Point",
          coordinates: validatedData.address.location.coordinates, // [longitude, latitude]
        },
      },
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
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");
    const radius = parseFloat(searchParams.get("radius") || "15"); // Default 15km
    const date = searchParams.get("date"); // Filter by specific date

    const filter: any = { status };

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (businessId) filter.businessId = businessId;

    // Helper function to filter time slots by date
    const filterTimeSlotsByDate = (timeSlots: any[], filterDate: string | null) => {
      if (!filterDate) {
        // If no date filter, return all future available slots
        const now = new Date();
        return timeSlots.filter((ts: any) => {
          if (ts.isBooked) return false;
          const slotDate = typeof ts.date === 'string' ? new Date(ts.date) : new Date(ts.date);
          const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          if (slotDateOnly.getTime() === nowDateOnly.getTime()) {
            const [endHours, endMinutes] = ts.endTime.split(":").map(Number);
            const slotEndDateTime = new Date(slotDate);
            slotEndDateTime.setHours(endHours, endMinutes, 0, 0);
            return slotEndDateTime > now;
          }
          
          return slotDateOnly > nowDateOnly;
        });
      } else {
        // Filter by specific date
        const filterDateObj = new Date(filterDate);
        const filterDateOnly = new Date(filterDateObj.getFullYear(), filterDateObj.getMonth(), filterDateObj.getDate());
        
        return timeSlots.filter((ts: any) => {
          if (ts.isBooked) return false;
          const slotDate = typeof ts.date === 'string' ? new Date(ts.date) : new Date(ts.date);
          const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
          return slotDateOnly.getTime() === filterDateOnly.getTime();
        });
      }
    };

    // Geospatial query: Find services within radius (default 15km)
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Use $geoNear for geospatial queries with distance sorting
        const services = await Service.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [lng, lat], // [longitude, latitude]
              },
              distanceField: "distance",
              maxDistance: radius * 1000, // Convert km to meters
              spherical: true,
              query: filter,
            },
          },
          {
            $lookup: {
              from: "businesses",
              localField: "businessId",
              foreignField: "_id",
              as: "businessId",
            },
          },
          {
            $unwind: {
              path: "$businessId",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              businessId: {
                _id: "$businessId._id",
                businessName: "$businessId.businessName",
                logo: "$businessId.logo",
                address: "$businessId.address",
              },
              category: 1,
              subCategory: 1,
              serviceName: 1,
              description: 1,
              address: 1,
              addOns: 1,
              timeSlots: 1,
              status: 1,
              createdAt: 1,
              distance: 1,
            },
          },
          {
            $sort: { distance: 1 }, // Sort by distance (nearest first)
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ]);

        const total = await Service.countDocuments({
          ...filter,
          "address.location": {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              $maxDistance: radius * 1000,
            },
          },
        });

        return NextResponse.json({
          services: services.map((s: any) => ({
            id: s._id?.toString() || s._id,
            _id: s._id?.toString() || s._id,
            businessId: s.businessId || null,
            category: s.category,
            subCategory: s.subCategory,
            serviceName: s.serviceName,
            description: s.description,
            address: typeof s.address === 'object' && s.address?.street 
              ? s.address.street 
              : (typeof s.address === 'string' ? s.address : ""),
            addressLocation: typeof s.address === 'object' && s.address?.location 
              ? s.address.location 
              : null,
            addOns: s.addOns || [],
            timeSlots: filterTimeSlotsByDate(s.timeSlots || [], date).map((ts: any) => ({
              date: ts.date,
              startTime: ts.startTime,
              endTime: ts.endTime,
              price: ts.price,
              duration: ts.duration,
              staffIds: ts.staffIds,
              isBooked: ts.isBooked,
            })),
            status: s.status,
            createdAt: s.createdAt,
            distance: s.distance ? (s.distance / 1000).toFixed(2) : null, // Distance in km
          })),
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        });
      }
    }

    // Non-geospatial query (regular query)
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
          description: s.description,
          address: typeof s.address === 'object' && s.address?.street 
            ? s.address.street 
            : (typeof s.address === 'string' ? s.address : ""),
          addressLocation: typeof s.address === 'object' && s.address?.location 
            ? s.address.location 
            : null,
          addOns: s.addOns || [],
          timeSlots: filterTimeSlotsByDate(s.timeSlots || [], date).map((ts: any) => ({
            date: ts.date,
            startTime: ts.startTime,
            endTime: ts.endTime,
            price: ts.price,
            duration: ts.duration,
            staffIds: ts.staffIds,
            isBooked: ts.isBooked,
          })),
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

