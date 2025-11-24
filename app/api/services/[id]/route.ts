import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import { serviceUpdateSchema } from "@/lib/validation";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

async function getServiceHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const service = await Service.findById(params.id)
      .populate("businessId", "businessName logo address email phone")
      .populate("timeSlots.staffIds", "name photo")
      .lean();

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const availableTimeSlots = service.timeSlots.filter(
      (ts: any) => !ts.isBooked && new Date(ts.date) >= new Date()
    );

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

    const service = await Service.findById(params.id);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    if (service.status === "booked") {
      return NextResponse.json(
        { error: "Cannot delete service with active bookings" },
        { status: 400 }
      );
    }

    service.status = "cancelled";
    await service.save();

    return NextResponse.json(
      {
        message: "Service removed successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete service error:", error);
    return NextResponse.json(
      { error: "Failed to remove service" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimitDynamic(getServiceHandler);
export const PUT = withRateLimitDynamic(updateServiceHandler);
export const DELETE = withRateLimitDynamic(deleteServiceHandler);

