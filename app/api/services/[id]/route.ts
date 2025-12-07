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
          description: service.description,
          address: typeof service.address === 'object' && service.address?.street 
            ? service.address.street 
            : (typeof service.address === 'string' ? service.address : ""),
          addressLocation: typeof service.address === 'object' && service.address?.location 
            ? service.address.location 
            : null,
          addOns: service.addOns || [],
          timeSlots: availableTimeSlots.map((ts: any) => ({
            date: ts.date,
            startTime: ts.startTime,
            endTime: ts.endTime,
            price: ts.price,
            duration: ts.duration,
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

    // Handle timeSlots update separately if provided
    if (body.timeSlots && Array.isArray(body.timeSlots)) {
      service.timeSlots = body.timeSlots.map((slot: any) => {
        // Calculate duration from start and end time
        const duration = slot.duration || calculateDuration(slot.startTime, slot.endTime);
        
        return {
          date: new Date(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price, // Required price for this time slot
          duration, // Computed duration in minutes
          staffIds: slot.staffIds ? slot.staffIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
          isBooked: slot.isBooked || false,
          bookingId: slot.bookingId || null,
        };
      });
    }

    // Update other fields (excluding duration which is computed)
    // Duration is computed from time slots, so we don't update it directly
    const fieldsToUpdate = { ...validatedData };
    if ('duration' in fieldsToUpdate) {
      delete fieldsToUpdate.duration;
    }
    Object.assign(service, fieldsToUpdate);
    
    // Handle address update if provided
    if (validatedData.address) {
      service.address = {
        street: validatedData.address.street,
        location: {
          type: "Point",
          coordinates: validatedData.address.location.coordinates, // [longitude, latitude]
        },
      };
    }
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
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Check if service has active (future) bookings
    // Only prevent deletion if there are future bookings that are confirmed or pending
    const Booking = (await import("@/lib/models/Booking")).default;
    const now = new Date();
    
    const activeBookings = await Booking.find({
      serviceId: new mongoose.Types.ObjectId(params.id),
      status: { $in: ["confirmed", "pending"] }, // Only check confirmed/pending bookings
    }).lean();

    // Check if any booking is in the future
    const hasFutureBookings = activeBookings.some((booking: any) => {
      const bookingDate = new Date(booking.timeSlot.date);
      const bookingEndTime = new Date(`${bookingDate.toISOString().split('T')[0]}T${booking.timeSlot.endTime}`);
      return bookingEndTime > now; // Booking hasn't ended yet
    });

    if (hasFutureBookings) {
      return NextResponse.json(
        { error: "Cannot delete service with active future bookings. Please cancel or wait for bookings to complete." },
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

