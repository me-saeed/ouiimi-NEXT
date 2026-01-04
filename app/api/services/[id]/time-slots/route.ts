import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import { timeSlotSchema } from "@/lib/validation";
import { z } from "zod";
import mongoose from "mongoose";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

export const dynamic = 'force-dynamic';

const timeSlotsUpdateSchema = z.object({
  timeSlots: z.array(timeSlotSchema),
});

async function updateTimeSlotsHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = timeSlotsUpdateSchema.parse(body);

    await dbConnect();

    const service = await Service.findById(params.id);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // ========================================================================
    // DUPLICATE SLOT CHECK
    // Only check the NEW slots being added against all exist services
    // ========================================================================
    const { validateServiceDuplication } = await import("@/lib/utils/service-validator");

    // We must validate that these new slots don't conflict with OTHER services.
    // They also shouldn't conflict with THIS service's existing slots (strictly speaking),
    // but the shared validator excludes "serviceIdToExclude". 
    // If we want to check for internal duplicates, we should NOT exclude self, 
    // OR we should trust the validator's logic which is primarily for Cross-Service duplication.
    // Let's check for cross-service duplication first.

    await validateServiceDuplication({
      businessId: String(service.businessId),
      category: service.category,
      subCategory: service.subCategory || "", // Ensure string
      timeSlots: validatedData.timeSlots,
      serviceIdToExclude: String(service._id) // Don't block adding slots to self
    });
    // ========================================================================

    // Map time slots to the correct format
    const newTimeSlots = validatedData.timeSlots.map((slot) => ({
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: slot.price,
      duration: slot.duration || 60,
      // ✅ NEW: Map staff IDs to new structure with isBooked flags
      staffIds: slot.staffIds
        ? slot.staffIds.map((id) => ({
          staffId: new mongoose.Types.ObjectId(id),
          isBooked: false  // All staff start as available
        }))
        : [],
      addOns: slot.addOns || [],
      isBooked: false,
      bookingId: undefined
    }));

    service.timeSlots = [...service.timeSlots, ...newTimeSlots];
    await service.save();

    return NextResponse.json(
      {
        message: "Time slots added successfully",
        timeSlots: service.timeSlots,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update time slots error:", error);
    return NextResponse.json(
      { error: "Failed to update time slots" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimitDynamic(updateTimeSlotsHandler);
export const PUT = withRateLimitDynamic(updateTimeSlotsHandler);

