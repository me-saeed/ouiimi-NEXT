import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";
import { serviceUpdateSchema } from "@/lib/validation";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

async function getServiceHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Validate ObjectId format
    const mongoose = (await import("mongoose")).default;
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid service ID format" },
        { status: 400 }
      );
    }

    const service = await Service.findById(params.id)
      .populate("businessId", "businessName logo address email phone")
      .lean();

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Manually populate staffIds if they exist (avoiding nested populate issues)
    if (service.timeSlots && service.timeSlots.length > 0) {
      const Staff = (await import("@/lib/models/Staff")).default;
      const allStaffIds: string[] = [];
      
      // Collect all staff IDs from all time slots
      service.timeSlots.forEach((ts: any) => {
        if (ts.staffIds && Array.isArray(ts.staffIds)) {
          ts.staffIds.forEach((id: any) => {
            const idStr = typeof id === 'object' ? String(id._id || id) : String(id);
            if (idStr && !allStaffIds.includes(idStr)) {
              allStaffIds.push(idStr);
            }
          });
        }
      });

      // Fetch all staff members at once
      if (allStaffIds.length > 0) {
        try {
          const mongoose = (await import("mongoose")).default;
          const staffMembers = await Staff.find({
            _id: { $in: allStaffIds.map(id => new mongoose.Types.ObjectId(id)) }
          }).select("name photo").lean();

          // Create a map for quick lookup
          const staffMap = new Map();
          staffMembers.forEach((staff: any) => {
            staffMap.set(String(staff._id), {
              id: String(staff._id),
              name: staff.name,
              photo: staff.photo,
            });
          });

          // Replace staffIds with populated staff objects
          service.timeSlots.forEach((ts: any) => {
            if (ts.staffIds && Array.isArray(ts.staffIds)) {
              (ts as any).staffIds = ts.staffIds.map((id: any) => {
                const idStr = typeof id === 'object' ? String(id._id || id) : String(id);
                return staffMap.get(idStr) || id;
              });
            }
          });
        } catch (err) {
          console.error("Error populating staff:", err);
          // If staff population fails, just keep the IDs
        }
      }
    }

        // Filter available time slots (not booked and date is in the future)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const availableTimeSlots = (service.timeSlots || []).filter((ts: any) => {
          const slotDate = new Date(ts.date);
          slotDate.setHours(0, 0, 0, 0);
          return !ts.isBooked && slotDate >= now;
        });

    // Type-safe businessId handling
    let businessIdData: any;
    if (service.businessId && typeof service.businessId === 'object' && 'businessName' in service.businessId) {
      // Populated business object
      const business = service.businessId as any;
      businessIdData = {
        id: business._id?.toString() || business._id,
        businessName: business.businessName,
        logo: business.logo,
        address: business.address,
        email: business.email,
        phone: business.phone,
      };
    } else {
      // Just ObjectId
      businessIdData = service.businessId?.toString() || service.businessId;
    }

    return NextResponse.json(
      {
        service: {
          id: service._id?.toString() || service._id,
          _id: service._id?.toString() || service._id,
          businessId: businessIdData,
          category: service.category,
          subCategory: service.subCategory,
          serviceName: service.serviceName,
          duration: service.duration,
          baseCost: service.baseCost,
          description: service.description,
          address: service.address,
          addOns: service.addOns || [],
          timeSlots: availableTimeSlots.map((ts: any) => ({
            date: ts.date,
            startTime: ts.startTime,
            endTime: ts.endTime,
            cost: ts.cost,
            isBooked: ts.isBooked,
            staffIds: ts.staffIds || [],
          })),
          status: service.status,
          createdAt: service.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get service error:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

async function updateServiceHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = serviceUpdateSchema.parse(body);

    await dbConnect();

    const service = await Service.findById(params.id);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Handle timeSlots update separately if provided
    if (body.timeSlots && Array.isArray(body.timeSlots)) {
      service.timeSlots = body.timeSlots.map((slot: any) => ({
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        cost: slot.cost || service.baseCost,
        staffIds: slot.staffIds ? slot.staffIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
        isBooked: slot.isBooked || false,
        bookingId: slot.bookingId || null,
      }));
    }

    // Update other fields
    Object.assign(service, validatedData);
    await service.save();

    // Verify service was saved
    const savedService = await Service.findById(service._id);
    if (!savedService) {
      console.error("Service update was not saved to database!");
      return NextResponse.json(
        { error: "Failed to save service update. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Service updated successfully",
        service: {
          id: String(service._id),
          serviceName: service.serviceName,
          status: service.status,
        },
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

    console.error("Update service error:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

async function deleteServiceHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid service ID format" },
        { status: 400 }
      );
    }

    const service = await Service.findById(params.id);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Check if service has active bookings
    const hasActiveBookings = service.timeSlots?.some((slot: any) => slot.isBooked === true);
    if (hasActiveBookings) {
      return NextResponse.json(
        { error: "Cannot delete service with active bookings" },
        { status: 400 }
      );
    }

    // Actually delete the service
    await Service.findByIdAndDelete(params.id);

    return NextResponse.json(
      {
        message: "Service deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete service error:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimitDynamic(getServiceHandler);
export const PUT = withRateLimitDynamic(updateServiceHandler);
export const DELETE = withRateLimitDynamic(deleteServiceHandler);

