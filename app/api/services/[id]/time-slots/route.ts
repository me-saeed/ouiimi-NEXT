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

    const newTimeSlots = validatedData.timeSlots.map((slot) => ({
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: slot.price || 0, // Price from time slot
      duration: slot.duration || 0, // Duration in minutes
      staffIds: slot.staffIds
        ? slot.staffIds.map((id) => new mongoose.Types.ObjectId(id))
        : [],
      isBooked: false,
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

