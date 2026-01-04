import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import { getAllCategories } from "@/lib/constants/categories";

// Enable revalidation for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = Math.random().toString(36).substring(7);
    console.time(`[API /api/services/featured GET] Execution time [${requestId}]`);

    try {
        await dbConnect();

        const categories = getAllCategories();
        const result: Record<string, any[]> = {};
        const now = new Date();
        // No specific date filter for featured services, we just want future availability
        const filterDateObj = null;

        // ================================================================================================
        // SHARED SLOT FILTERING LOGIC (Copied from /api/services/route.ts)
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
                                                    { $eq: ["$$staff.isBooked", false] },
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
                        // Future dates logic only (since filterDateObj is null)
                        {
                            $or: [
                                // Future dates (after today)
                                {
                                    $gt: [
                                        { $dateToString: { format: "%Y-%m-%d", date: "$$slot.date" } },
                                        { $dateToString: { format: "%Y-%m-%d", date: now } },
                                    ],
                                },
                                // Today's date but check time hasn't passed
                                {
                                    $and: [
                                        {
                                            $eq: [
                                                { $dateToString: { format: "%Y-%m-%d", date: "$$slot.date" } },
                                                { $dateToString: { format: "%Y-%m-%d", date: now } },
                                            ],
                                        },
                                        {
                                            $gt: [
                                                {
                                                    $dateFromParts: {
                                                        year: { $year: "$$slot.date" },
                                                        month: { $month: "$$slot.date" },
                                                        day: { $dayOfMonth: "$$slot.date" },
                                                        hour: {
                                                            $toInt: {
                                                                $arrayElemAt: [{ $split: ["$$slot.startTime", ":"] }, 0],
                                                            },
                                                        },
                                                        minute: {
                                                            $toInt: {
                                                                $arrayElemAt: [{ $split: ["$$slot.startTime", ":"] }, 1],
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

        // Dynamically build the $facet stage
        const facets: Record<string, any[]> = {};

        categories.forEach((cat) => {
            facets[cat.name] = [
                {
                    $match: {
                        category: cat.name,
                        status: "listed"
                    }
                },
                // Add business data to return images/names
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
                    }
                },
                // Filter approved businesses
                {
                    $match: (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true')
                        ? { "businessId.status": { $in: ["approved", "pending"] } }
                        : { "businessId.status": "approved" }
                },
                // Add Available Slots
                {
                    $addFields: {
                        availableTimeSlots: availableTimeSlotsStage
                    }
                },
                // Filter out fully booked
                {
                    $match: { "availableTimeSlots.0": { $exists: true } }
                },
                // Limit to 6
                { $limit: 6 },
                // Project needed fields
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
                        timeSlots: "$availableTimeSlots", // Return only available slots
                        status: 1,
                        createdAt: 1
                    }
                }
            ];
        });

        const pipeline = [
            { $facet: facets }
        ];

        const [facetResult] = await Service.aggregate(pipeline);

        // Format results
        const servicesData: Record<string, any[]> = {};

        // facetResult is an array with one object containing all keys
        const results = facetResult || {};

        Object.keys(results).forEach(key => {
            const services = results[key] || [];
            servicesData[key] = services.map((s: any) => ({
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
                timeSlots: (s.timeSlots || []).map((ts: any) => ({
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
            }));
        });

        console.timeEnd(`[API /api/services/featured GET] Execution time [${requestId}]`);
        return NextResponse.json({ services: servicesData });

    } catch (error) {
        console.timeEnd(`[API /api/services/featured GET] Execution time [${requestId}]`);
        console.error("[API /api/services/featured GET] Server error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
