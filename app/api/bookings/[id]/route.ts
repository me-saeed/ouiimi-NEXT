import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import User from "@/lib/models/User";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";
import { verifyToken } from "@/lib/jwt";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";
import { sendEmail, sendBookingCancellationToBusiness } from "@/lib/services/mailjet";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const bookingUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "refunded"]).optional(),
  paymentStatus: z.enum(["pending", "deposit_paid", "fully_paid", "refunded"]).optional(),
  businessNotes: z.string().optional(),
  cancellationReason: z.string().optional(),
  cancelledBy: z.enum(["customer", "business"]).optional(),
  timeSlot: z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  }).optional(),
});

async function getBookingHandler(
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

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Ensure all models are registered before populate
    const mongoose = (await import("mongoose")).default;
    if (!mongoose.models.Business) {
      await import("@/lib/models/Business");
    }
    if (!mongoose.models.Service) {
      await import("@/lib/models/Service");
    }
    if (!mongoose.models.User) {
      await import("@/lib/models/User");
    }
    if (!mongoose.models.Staff) {
      await import("@/lib/models/Staff");
    }

    const booking = await Booking.findById(params.id)
      .populate("userId", "fname lname email contactNo")
      .populate("businessId", "businessName logo address email phone")
      .populate("serviceId", "serviceName category baseCost duration description")
      .populate("staffId", "name photo")
      .lean();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    let userIdData: any;
    if (booking.userId && typeof booking.userId === 'object' && 'fname' in booking.userId) {
      const user = booking.userId as any;
      userIdData = {
        id: user._id?.toString() || user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        contactNo: user.contactNo,
      };
    } else {
      userIdData = booking.userId?.toString() || booking.userId;
    }

    let businessIdData: any;
    if (booking.businessId && typeof booking.businessId === 'object' && 'businessName' in booking.businessId) {
      const business = booking.businessId as any;
      businessIdData = {
        id: business._id?.toString() || business._id,
        businessName: business.businessName,
        logo: business.logo,
        address: business.address,
        email: business.email,
        phone: business.phone,
      };
    } else {
      businessIdData = booking.businessId?.toString() || booking.businessId;
    }

    let serviceIdData: any;
    if (booking.serviceId && typeof booking.serviceId === 'object' && 'serviceName' in booking.serviceId) {
      const service = booking.serviceId as any;
      serviceIdData = {
        id: service._id?.toString() || service._id,
        serviceName: service.serviceName,
        category: service.category,
        baseCost: service.baseCost,
        duration: service.duration,
        description: service.description,
      };
    } else {
      serviceIdData = booking.serviceId?.toString() || booking.serviceId;
    }

    let staffIdData: any = null;
    if (booking.staffId) {
      if (typeof booking.staffId === 'object' && 'name' in booking.staffId) {
        const staff = booking.staffId as any;
        staffIdData = {
          id: staff._id?.toString() || staff._id,
          name: staff.name,
          photo: staff.photo,
        };
      } else {
        staffIdData = booking.staffId.toString();
      }
    }

    return NextResponse.json(
      {
        booking: {
          id: booking._id?.toString() || booking._id,
          _id: booking._id?.toString() || booking._id,
          userId: userIdData,
          businessId: businessIdData,
          serviceId: serviceIdData,
          staffId: staffIdData,
          timeSlot: booking.timeSlot,
          addOns: booking.addOns || [],
          totalCost: booking.totalCost,
          depositAmount: booking.depositAmount,
          remainingAmount: booking.remainingAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          customerNotes: booking.customerNotes,
          businessNotes: booking.businessNotes,
          cancelledAt: booking.cancelledAt,
          cancellationReason: booking.cancellationReason,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

async function updateBookingHandler(
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

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = bookingUpdateSchema.parse(body);

    await dbConnect();

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const oldStatus = booking.status;

    if (validatedData.status) {
      const oldStatus = booking.status;
      booking.status = validatedData.status;
      if (validatedData.status === "cancelled") {
        booking.cancelledAt = new Date();
        if (validatedData.cancellationReason) {
          booking.cancellationReason = validatedData.cancellationReason;
        }
        booking.paymentStatus = "refunded";

        // Free up the time slot in the service when booking is cancelled
        if (oldStatus !== "cancelled") {
          const service = await Service.findById(booking.serviceId);
          if (service) {
            const timeSlot = service.timeSlots.find((ts: any) => {
              const tsDate = new Date(ts.date);
              tsDate.setHours(0, 0, 0, 0);
              const bookingDate = new Date(booking.timeSlot.date);
              bookingDate.setHours(0, 0, 0, 0);
              return (
                tsDate.getTime() === bookingDate.getTime() &&
                ts.startTime === booking.timeSlot.startTime &&
                ts.endTime === booking.timeSlot.endTime &&
                String(ts.bookingId) === String(booking._id)
              );
            });
            if (timeSlot) {
              timeSlot.isBooked = false;
              timeSlot.bookingId = undefined;
              await service.save();
            }
          }
        }
      } else if (validatedData.status === "completed") {
        booking.paymentStatus = "fully_paid";
      }
    }

    if (validatedData.paymentStatus) {
      booking.paymentStatus = validatedData.paymentStatus;
    }

    // Handle rescheduling
    if (validatedData.timeSlot) {
      booking.timeSlot = {
        date: new Date(validatedData.timeSlot.date),
        startTime: validatedData.timeSlot.startTime,
        endTime: validatedData.timeSlot.endTime,
      };
    }

    await booking.save();

    // Send email notifications for status changes
    try {
      // Ensure models are registered before populate
      const mongooseForEmail = (await import("mongoose")).default;
      if (!mongooseForEmail.models.User) {
        await import("@/lib/models/User");
      }
      if (!mongooseForEmail.models.Business) {
        await import("@/lib/models/Business");
      }
      if (!mongooseForEmail.models.Service) {
        await import("@/lib/models/Service");
      }

      const populatedBooking = await Booking.findById(booking._id)
        .populate("userId", "fname lname email")
        .populate("businessId", "businessName email")
        .populate("serviceId", "serviceName")
        .lean();

      if (populatedBooking && populatedBooking.userId && typeof populatedBooking.userId === 'object') {
        const user = populatedBooking.userId as any;
        const business = populatedBooking.businessId as any;
        const service = populatedBooking.serviceId as any;
        const date = new Date(populatedBooking.timeSlot.date).toLocaleDateString("en-GB");
        const time = `${populatedBooking.timeSlot.startTime} - ${populatedBooking.timeSlot.endTime}`;

        if (oldStatus !== "cancelled" && booking.status === "cancelled") {
          const isShopper = (validatedData.cancelledBy || "customer") === "customer";
          const emailData = {
            fname: user.fname || "Customer",
            email: user.email,
            businessName: business?.businessName || "Business",
            serviceName: service?.serviceName || "Service",
            date,
            time,
            bookingId: String(booking._id).slice(-8),
            depositAmount: populatedBooking.depositAmount,
            payoutAmount: populatedBooking.depositAmount && (populatedBooking.depositAmount / 2).toFixed(2), // 50% split assumption from templates
            cancelledBy: validatedData.cancelledBy || "customer",
          };

          if (isShopper) {
            // 1. Notify Shopper: "You cancelled"
            await sendEmail(
              [user.email],
              "Booking Cancelled - ouiimi",
              emailData,
              "booking_cancellation_shopper"
            );

            // 2. Notify Business: "Shopper cancelled"
            if (business?.email) {
              console.log(`[Email] Sending booking cancellation to BUSINESS: ${business.email}`);

              // Ensure customerName is passed
              const cancellationData = {
                ...emailData,
                customerName: `${user.fname} ${user.lname}`.trim()
              };

              const sent = await sendBookingCancellationToBusiness(
                business.email,
                business.businessName || "Business", // Addressed to business
                cancellationData
              );

              if (sent) console.log(`[Email] Business cancellation email sent successfully.`);
              else console.error(`[Email] Business cancellation email failed.`);
            } else {
              console.warn(`[Email] Skipping business cancellation email - No business email found.`);
            }

            // 3. (Optional) Cancellation Payout Email?
            // If payout is automated, we might send 'cancellation_payout' here too, 
            // but user said "Deposit Payout Confirmation" - usually this comes after the payout is actually processed.
            // I will leave it out for now unless I see payout logic here. 
            // Logic above says: booking.paymentStatus = "refunded"; 
            // Actually, if shopper cancels, business gets 50%.
            // If business has payout logic, maybe we trigger email. 
            // For now, these 2 are the critical ones.

          } else {
            // 3. Notify Shopper: "Business cancelled"
            await sendEmail(
              [user.email],
              "Booking Cancelled by Business - ouiimi",
              emailData,
              "booking_cancellation_by_business"
            );
          }

        } else if (oldStatus !== "completed" && booking.status === "completed") {
          // Send completion email to Shopper
          await sendEmail(
            [user.email],
            "Service Completed - ouiimi",
            {
              fname: user.fname || "Customer",
              email: user.email,
              businessName: business?.businessName || "Business",
              serviceName: service?.serviceName || "Service",
              date,
              totalCost: populatedBooking.totalCost,
              paymentAmount: populatedBooking.totalCost,
              bookingId: String(booking._id).slice(-8),
            },
            "booking_complete"
          );

          // Send Payment Receipt/Payout Email to Business (Completion)
          if (business?.email) {
            await sendEmail(
              [business.email],
              "Payment Receipt - ouiimi",
              {
                fname: user.fname || "Customer",
                email: business.email, // Sent to business
                businessName: business?.businessName || "Business",
                serviceName: service?.serviceName || "Service",
                date,
                bookingId: String(booking._id).slice(-8),
                totalDeposit: populatedBooking.depositAmount,
                payoutAmount: (populatedBooking.depositAmount ? populatedBooking.depositAmount * 0.5 : 0).toFixed(2)
              },
              "payment_receipt"
            );
          }
        }
      }
    } catch (emailError) {
      console.error("Error sending booking status email:", emailError);
      // Don't fail the update if email fails
    }

    if (validatedData.businessNotes !== undefined) {
      booking.businessNotes = validatedData.businessNotes;
    }

    await booking.save();

    // Ensure models are registered (already done above, but ensure for safety)
    const mongooseForPopulate = (await import("mongoose")).default;
    if (!mongooseForPopulate.models.User) {
      await import("@/lib/models/User");
    }
    if (!mongooseForPopulate.models.Business) {
      await import("@/lib/models/Business");
    }
    if (!mongooseForPopulate.models.Service) {
      await import("@/lib/models/Service");
    }
    if (!mongooseForPopulate.models.Staff) {
      await import("@/lib/models/Staff");
    }

    const savedBooking = await Booking.findById(booking._id)
      .populate("userId", "fname lname email contactNo")
      .populate("businessId", "businessName logo address email phone")
      .populate("serviceId", "serviceName category baseCost duration")
      .populate("staffId", "name photo")
      .lean();

    if (!savedBooking) {
      return NextResponse.json(
        { error: "Failed to save booking update" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Booking updated successfully",
        booking: {
          id: String(savedBooking._id),
          status: savedBooking.status,
          paymentStatus: savedBooking.paymentStatus,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update booking error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

async function deleteBookingHandler(
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

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    await dbConnect();

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user owns the booking or is the business owner
    const userId = String(decoded.userId);
    const bookingUserId = String(booking.userId);

    if (userId !== bookingUserId) {
      // Check if user is the business owner
      const business = await Business.findById(booking.businessId);
      if (!business || String(business.userId) !== userId) {
        return NextResponse.json(
          { error: "Unauthorized - You can only delete your own bookings" },
          { status: 403 }
        );
      }
    }

    // Free up the time slot in the service before deleting
    const service = await Service.findById(booking.serviceId);
    if (service) {
      const timeSlot = service.timeSlots.find((ts: any) => {
        const tsDate = new Date(ts.date);
        tsDate.setHours(0, 0, 0, 0);
        const bookingDate = new Date(booking.timeSlot.date);
        bookingDate.setHours(0, 0, 0, 0);
        return (
          tsDate.getTime() === bookingDate.getTime() &&
          ts.startTime === booking.timeSlot.startTime &&
          ts.endTime === booking.timeSlot.endTime &&
          String(ts.bookingId) === String(booking._id)
        );
      });
      if (timeSlot) {
        timeSlot.isBooked = false;
        timeSlot.bookingId = undefined;
        await service.save();
        console.log(`[Delete Booking] Released time slot for service ${service._id}`);
      }
    }

    await Booking.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: "Booking deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete booking error:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimitDynamic(getBookingHandler);
export const PUT = withRateLimitDynamic(updateBookingHandler);
export const DELETE = withRateLimitDynamic(deleteBookingHandler);

