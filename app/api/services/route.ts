import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import { serviceCreateSchema } from "@/lib/validation";
import mongoose from "mongoose";
import { authenticateRequest } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { APIError, asyncHandler } from "@/lib/api-response";
import { handleError } from "@/lib/errors/error-handler";
import { NotFoundError, DatabaseError } from "@/lib/errors/api-error";
import { logger } from "@/lib/logger";
import { cache, MemoryCache } from "@/lib/cache";
import { getGlobalBusyMap, isStaffBusy } from "@/lib/utils/availability";
import Booking from "@/lib/models/Booking";
import type {
  StaffIdEntry,
  TimeSlotEntry,
  AddOnEntry,
  ServiceFilterQuery,
  ProcessedTimeSlot,
  ServiceListItem
} from "@/lib/types/api";

export const dynamic = 'force-dynamic';

async function createServiceHandler(req: NextRequest) {
  try {
    // ==========================================================================
    // STEP 1: Rate Limiting (60 req/min for service creation - increased)
    // ==========================================================================
    const rateLimitResponse = applyRateLimit(req, 60);
    if (rateLimitResponse) return rateLimitResponse;

    // ==========================================================================
    // STEP 2: Session Authentication
    // ==========================================================================
    const session = await authenticateRequest(req);

    const body = await req.json();
    const validatedData = serviceCreateSchema.parse(body);

    await dbConnect();

    const business = await Business.findById(validatedData.businessId);
    if (!business) {
      throw new NotFoundError("Business not found");
    }

    // Check ownership - user must own the business
    if (String(business.userId) !== String(session.userId)) {
      throw new APIError(403, "You can only add services to your own business", "FORBIDDEN");
    }

    // Check business approval status - only approved businesses can create services
    if (business.status !== "approved") {
      const statusMessages = {
        pending: "Your business account is pending admin approval. You cannot create services until your account is approved.",
        rejected: "Cannot add services to a rejected business. Please contact support.",
        suspended: "Your business account has been suspended. You cannot create services at this time."
      };

      const message = statusMessages[business.status as keyof typeof statusMessages] || "Business must be approved to create services";
      throw new APIError(403, message, "BUSINESS_NOT_APPROVED");
    }

    // ========================================================================
    // DUPLICATE SERVICE CHECK
    // ========================================================================
    const { validateServiceDuplication } = await import("@/lib/utils/service-validator");

    await validateServiceDuplication({
      businessId: validatedData.businessId,
      category: validatedData.category,
      subCategory: validatedData.subCategory || "", // Ensure string
      timeSlots: validatedData.timeSlots || []      // Ensure array
    });
    // ========================================================================

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
        // ✅ FIXED: Store staffIds as {staffId, isBooked} objects
        staffIds: slot.staffIds
          ? slot.staffIds.map((id: any) => ({
            staffId: new mongoose.Types.ObjectId(id),
            isBooked: false // New slots start as not booked
          }))
          : [],
        addOns: slot.addOns || [], // Persist add-ons per slot
        isBooked: false,
      };
    });

    // ========================================================================
    // CROSS-SERVICE STAFF AVAILABILITY CHECK
    // REMOVED FOR DYNAMIC AVAILABILITY
    // We now allow staff to be assigned to overlapping slots.
    // Availability is checked strictly at BOOKING time, not Service Creation time.
    // ======================================================================== 

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

    // EXPLICIT LOGGING FOR GEOJSON VERIFICATION
    if (service.address && service.address.location) {
      console.log("[GeoAudit] Service Creation - Saving Location:", JSON.stringify(service.address.location, null, 2));
    } else {
      console.warn("[GeoAudit] Service Creation - NO LOCATION DATA being saved!");
    }

    // Verify service was saved
    const savedService = await Service.findById(service._id);
    if (!savedService) {
      throw new DatabaseError("Failed to save service. Please try again.");
    }

    logger.info('Service created successfully', {
      serviceId: String(savedService._id),
      businessId: String(savedService.businessId),
      userId: session.userId,
    });

    console.log("[API /api/services POST] Service created successfully:", String(savedService._id));

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
    console.error("[API /api/services POST] Error occurred:", error);
    console.error("[API /api/services POST] Error stack:", error.stack);
    console.error("[API /api/services POST] Error name:", error.name);
    console.timeEnd("[API /api/services POST] Total execution time");

    return handleError(error, {
      endpoint: '/api/services',
      method: 'POST',
    });
  }
}

async function getServicesHandler(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[API /api/services GET] Request received [${requestId}]`);
  console.time(`[API /api/services GET] Execution time [${requestId}]`);

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");
    const radius = parseFloat(searchParams.get("radius") || "15"); // Default 15km
    const date = searchParams.get("date"); // Filter by specific date

    // ==========================================================================
    // CACHE CHECK: Cache public service listings for 30 seconds
    // Only cache requests without businessId (public homepage/browse requests)
    // Business dashboard requests (with businessId) always get fresh data
    // ==========================================================================
    const isCacheable = !businessId && !latitude && !longitude && !date;

    if (isCacheable) {
      const cacheKey = MemoryCache.generateKey('services', {
        category,
        subCategory,
        status: status || 'listed',
        limit,
        page,
      });

      // Try to get from cache first (returns in <1ms if cached!)
      const cachedData = cache.get<any>(cacheKey);
      if (cachedData) {
        console.log(`[Cache] HIT for ${cacheKey} - serving from memory`);
        console.timeEnd(`[API /api/services GET] Execution time [${requestId}]`);
        return NextResponse.json(cachedData, { status: 200 });
      }
    }
    // ==========================================================================

    await dbConnect();

    console.log("[API /api/services GET] Query params:", {
      category,
      subCategory,
      businessId,
      status,
      limit,
    });

    console.log("[API /api/services GET] Building filter with businessId:", businessId);

    const filter: Record<string, unknown> = {};

    // Only apply status filter if explicitly provided OR if no businessId (public listing)
    if (status) {
      filter.status = status;
    } else if (!businessId) {
      filter.status = "listed"; // Default for public listings
    }

    if (category) {
      console.log("[API /api/services GET] Filtering by category:", category);
      filter.category = category;
    }
    if (subCategory) {
      console.log("[API /api/services GET] Filtering by subCategory:", subCategory);
      filter.subCategory = subCategory;
    }
    if (businessId) {
      console.log("[API /api/services GET] Filtering by businessId:", businessId);
      filter.businessId = new mongoose.Types.ObjectId(businessId);
    }

    console.log("[API /api/services GET] Final filter:", JSON.stringify(filter));

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

    const now = new Date();
    const filterDateObj = date ? new Date(date) : null;

    // ================================================================================================
    // SHARED SLOT FILTERING LOGIC via Aggregation
    // Check if slots are available (future date/time + not booked)
    // ================================================================================================
    const availableTimeSlotsStage = {
      $filter: {
        input: "$timeSlots",
        as: "slot",
        cond: {
          $and: [
            // Check if slot has AT LEAST ONE staff who is NOT booked
            {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$$slot.staffIds",
                      as: "staff",
                      cond: {
                        $or: [
                          // Case 1: New format { staffId, isBooked: false }
                          { $eq: ["$$staff.isBooked", false] },
                          // Case 2: Legacy format (just a string ID) -> assume available
                          { $eq: [{ $type: "$$staff" }, "string"] },
                          { $eq: [{ $type: "$$staff" }, "objectId"] }
                        ]
                      }
                    }
                  }
                },
                0
              ]
            },
            // Date filtering with TIME check (not just date)
            filterDateObj
              ? {
                // For specific date filter, just check date match
                $eq: [
                  {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$slot.date",
                    },
                  },
                  {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: filterDateObj,
                    },
                  },
                ],
              }
              : {
                // For general listing, filter by date+time to exclude past slots
                $or: [
                  // Future dates (after today)
                  {
                    $gt: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$$slot.date",
                        },
                      },
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: now,
                        },
                      },
                    ],
                  },
                  // Today's date but check time hasn't passed
                  {
                    $and: [
                      // Same date as today
                      {
                        $eq: [
                          {
                            $dateToString: {
                              format: "%Y-%m-%d",
                              date: "$$slot.date",
                            },
                          },
                          {
                            $dateToString: {
                              format: "%Y-%m-%d",
                              date: now,
                            },
                          },
                        ],
                      },
                      // Time hasn't passed yet
                      {
                        $gt: [
                          {
                            $dateFromParts: {
                              year: { $year: "$$slot.date" },
                              month: { $month: "$$slot.date" },
                              day: { $dayOfMonth: "$$slot.date" },
                              hour: {
                                $toInt: {
                                  $arrayElemAt: [
                                    { $split: ["$$slot.startTime", ":"] },
                                    0,
                                  ],
                                },
                              },
                              minute: {
                                $toInt: {
                                  $arrayElemAt: [
                                    { $split: ["$$slot.startTime", ":"] },
                                    1,
                                  ],
                                },
                              },
                            },
                          },
                          now,
                        ],
                      },
                    ],
                  },
                ],
              },
          ],
        },
      },
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
          // ADD AVAILABLE SLOTS CALCULATION FOR GEOSPATIAL
          {
            $addFields: {
              availableTimeSlots: availableTimeSlotsStage
            }
          },
          // FILTER OUT FULLY BOOKED SERVICES (If public request)
          ...(businessId ? [] : [{
            $match: { "availableTimeSlots.0": { $exists: true } }
          }]),
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
              // Return available slots if public, else all
              timeSlots: businessId ? "$timeSlots" : "$availableTimeSlots",
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

        // Fix count to also respect the filter
        const countPipeline: any[] = [
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [lng, lat], // [longitude, latitude]
              },
              distanceField: "distance",
              maxDistance: radius * 1000,
              spherical: true,
              query: filter,
            },
          },
          {
            $addFields: {
              availableTimeSlots: availableTimeSlotsStage
            }
          }
        ];

        if (!businessId) {
          countPipeline.push({ $match: { "availableTimeSlots.0": { $exists: true } } });
        }

        countPipeline.push({ $count: "total" });

        const countResult = await Service.aggregate(countPipeline);

        const total = countResult.length > 0 ? countResult[0].total : 0;

        return NextResponse.json({
          services: services
            .filter((s: any) => s.businessId)
            .map((s: any) => {
              // Time slots are already filtered by server aggregation
              const slotsToUse = s.timeSlots || [];
              return {
                id: s._id?.toString() || s._id,
                _id: s._id?.toString() || s._id,
                businessId: s.businessId,
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
                timeSlots: slotsToUse.map((ts: any) => ({
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
                distance: s.distance ? (s.distance / 1000).toFixed(2) : null,
              };
            }),
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        });
        console.timeEnd(`[API /api/services GET] Execution time [${requestId}]`);
      }
    }

    // Non-geospatial query - Use aggregation for server-side filtering
    console.log("[API /api/services GET] Executing database query with filter:", filter);



    // Build aggregation pipeline for server-side slot filtering
    const aggregationPipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          availableTimeSlots: availableTimeSlotsStage
        },
      },
    ];

    // NEW: Filter out services with NO available slots (Fully Booked)
    // Only apply for public listings (not business dashboard)
    if (!businessId) {
      aggregationPipeline.push({
        $match: { "availableTimeSlots.0": { $exists: true } }
      });
    }

    // Continue with rest of pipeline
    aggregationPipeline.push(
      {
        $lookup: {
          from: "businesses",
          localField: "businessId",
          foreignField: "_id",
          as: "businessData",
        },
      },
      {
        $unwind: {
          path: "$businessData",
          preserveNullAndEmptyArrays: true,
        },
      },
      // ✅ Requirement: Only show services from APPROVED businesses and LISTED services
      // In development, also show PENDING businesses for easier testing
      {
        $match: businessId
          ? {} // Dashboard shows everything
          : (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true')
            ? {
              "businessData.status": { $in: ["approved", "pending"] },
              "status": "listed"
            }
            : {
              "businessData.status": "approved",
              "status": "listed"
            }
      },
      {
        $project: {
          _id: 1,
          businessId: {
            id: "$businessData._id",
            businessName: "$businessData.businessName",
            logo: "$businessData.logo",
            address: "$businessData.address",
            status: "$businessData.status"
          },
          category: 1,
          subCategory: 1,
          serviceName: 1,
          description: 1,
          address: 1,
          addOns: 1,
          // For business dashboard (with businessId), show ALL time slots
          // For public listings (no businessId), show only available slots
          timeSlots: businessId ? "$timeSlots" : "$availableTimeSlots",
          status: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    );

    const [services, totalResult] = await Promise.all([
      Service.aggregate(aggregationPipeline),
      Service.countDocuments(filter),
    ]);

    const total = totalResult || 0;


    console.log("[API /api/services GET] Query results - Total:", total, "Returned:", services.length);
    console.log(`[API /api/services GET] Server-filtered available slots [${requestId}]`);
    if (businessId && services.length > 0) {
      console.log(`[API /api/services GET] Business Dashboard - First service data:`, {
        serviceName: services[0].serviceName,
        timeSlots: services[0].timeSlots?.length || 0,
        firstSlot: services[0].timeSlots?.[0] || null
      });
    }
    console.timeEnd(`[API /api/services GET] Execution time [${requestId}]`);

    // ==========================================================================
    // GLOBAL AVAILABILITY: Filter slots by checking all bookings
    // ==========================================================================
    const allStaffIdsSet = new Set<string>();
    services.forEach((s: any) => {
      s.timeSlots?.forEach((ts: any) => {
        ts.staffIds?.forEach((staff: any) => {
          const sid = typeof staff === 'string' ? staff : String(staff.staffId || staff.id || staff);
          if (sid) allStaffIdsSet.add(sid);
        });
      });
    });
    const allStaffIds = Array.from(allStaffIdsSet);

    // Fetch global busy map for next 2 months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);
    const busyMap = await getGlobalBusyMap(allStaffIds, startDate, endDate);

    const responseData = {
      services: services
        .map((s: any) => {
          // Process slots with global busy check
          const processedSlots = (s.timeSlots || []).map((ts: any) => {
            const updatedStaffIds = ts.staffIds?.map((staff: any) => {
              const staffIdStr = typeof staff === 'string' ? staff : String(staff.staffId || staff.id || staff);
              const isGloballyBooked = isStaffBusy(busyMap, staffIdStr, ts.date, ts.startTime, ts.endTime);

              if (typeof staff === 'string' || !staff.staffId) {
                return {
                  staffId: staffIdStr,
                  isBooked: isGloballyBooked
                };
              }

              return {
                ...staff,
                isBooked: staff.isBooked || isGloballyBooked
              };
            }) || [];

            const isFullyBooked = updatedStaffIds.length > 0 && updatedStaffIds.every((ss: any) => ss.isBooked);

            return {
              ...ts,
              staffIds: updatedStaffIds,
              isBooked: ts.isBooked || isFullyBooked
            };
          }).filter((ts: any) => !ts.isBooked); // Hide booked slots from listings

          // Sort slots by date and time to find EARLIEST available
          processedSlots.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.startTime.localeCompare(b.startTime);
          });

          const earliestSlot = processedSlots[0] || null;

          return {
            id: s._id?.toString() || s._id,
            _id: s._id?.toString() || s._id,
            businessId: s.businessId,
            category: s.category,
            subCategory: s.subCategory,
            serviceName: s.serviceName,
            description: s.description,
            duration: earliestSlot?.duration || (s.timeSlots && s.timeSlots.length > 0 ? s.timeSlots[0].duration : 60),
            address:
              typeof s.address === "object" && s.address?.street
                ? s.address.street
                : typeof s.address === "string"
                  ? s.address
                  : "",
            addressLocation:
              typeof s.address === "object" && s.address?.location
                ? s.address.location
                : null,
            addOns: s.addOns || [],
            timeSlots: processedSlots.map((ts: any) => ({
              date: ts.date,
              startTime: ts.startTime,
              endTime: ts.endTime,
              price: ts.price,
              duration: ts.duration,
              staffIds: ts.staffIds,
              isBooked: ts.isBooked,
            })),
            // ✅ Requirement 4: Set earliest date/time for the card
            date: earliestSlot ? (typeof earliestSlot.date === 'string' ? earliestSlot.date.split('T')[0] : earliestSlot.date.toISOString().split('T')[0]) : null,
            time: earliestSlot ? earliestSlot.startTime : null,
            status: s.status,
            createdAt: s.createdAt,
          };
        })
        .filter((s: any) => {
          // If public listing (no businessId), only show if it has available slots
          if (!businessId && s.timeSlots.length === 0) return false;
          // Filter out services with missing business data
          return s.businessId?.id;
        }),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };

    // ==========================================================================
    // CACHE SET: Store results in memory for 30 seconds
    // Only cache public requests (not business dashboard)
    // ==========================================================================
    const shouldCache = !businessId && !latitude && !longitude && !date;
    if (shouldCache) {
      const cacheKey = MemoryCache.generateKey('services', {
        category,
        subCategory,
        status: status || 'listed',
        limit,
        page,
      });
      cache.set(cacheKey, responseData, 30); // Cache for 30 seconds
      console.log(`[Cache] SET: ${cacheKey} - cached for 30 seconds`);
    }
    // ==========================================================================

    console.timeEnd(`[API /api/services GET] Execution time [${requestId}]`);

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export const POST = asyncHandler(createServiceHandler);
export const GET = getServicesHandler; // GET is public, no auth needed
