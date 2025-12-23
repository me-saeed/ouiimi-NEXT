import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

/**
 * Centrally manages booking operations to ensure consistency and avoid race conditions.
 */
export class BookingService {
    /**
     * Atomically confirms a slot reservation for a booking.
     * This should be called AFTER successful payment.
     */
    static async confirmSlotReservation(bookingId: string) {
        await dbConnect();

        // 1. Fetch the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.status === "confirmed") {
            console.log(`[BookingService] Booking ${bookingId} already confirmed.`);
            return booking;
        }

        // 2. Atomically find and update the service slot
        // We use findOneAndUpdate on the Service model to ensure atomicity
        const serviceId = booking.serviceId;
        const staffId = booking.staffId;
        const { date, startTime, endTime } = booking.timeSlot;

        // Use a transaction or careful atomic update to avoid overbooking
        const service = await Service.findOneAndUpdate(
            {
                _id: serviceId,
                "timeSlots": {
                    $elemMatch: {
                        date: new Date(date),
                        startTime,
                        endTime,
                        "staffIds": {
                            $elemMatch: {
                                staffId: staffId,
                                isBooked: false
                            }
                        }
                    }
                }
            },
            {
                $set: {
                    "timeSlots.$[slot].staffIds.$[staff].isBooked": true
                }
            },
            {
                arrayFilters: [
                    { "slot.date": new Date(date), "slot.startTime": startTime, "slot.endTime": endTime },
                    { "staff.staffId": staffId }
                ],
                new: true
            }
        );

        if (!service) {
            console.error(`[BookingService] Failed to reserve slot for booking ${bookingId}. Slot may already be taken.`);
            throw new Error("Time slot is no longer available. Please contact support if you have already paid.");
        }

        // 3. Update booking status
        booking.status = "confirmed";
        booking.paymentStatus = "deposit_paid";
        await booking.save();

        console.log(`[BookingService] Successfully reserved slot and confirmed booking ${bookingId}`);
        return booking;
    }
}
