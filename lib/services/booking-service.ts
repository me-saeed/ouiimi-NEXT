import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import { APIError } from "@/lib/api-response";

/**
 * Centrally manages booking operations to ensure consistency and avoid race conditions.
 * Implements a "Pessimistic Hold" pattern for time slots.
 */
export class BookingService {
    /**
     * Atomically acquires a hold on a slot during the pre-payment phase.
     * This prevents other users from booking the same slot while the current user is at Stripe checkout.
     */
    static async acquireHold(bookingId: string, session?: mongoose.ClientSession) {
        await dbConnect();

        const booking = await Booking.findById(bookingId).session(session || null);
        if (!booking) throw new APIError(404, "Booking not found", "NOT_FOUND");

        const serviceId = booking.serviceId;
        const staffId = booking.staffId;
        const { date, startTime, endTime } = booking.timeSlot;

        console.log(`[BookingService] Attempting to acquire hold for booking ${bookingId} on slot ${startTime}...`);

        // Find the service to get the exact slot date stored in database (handles any non-zero time/timezone discrepancies)
        const serviceDoc = await Service.findById(serviceId).session(session || null);
        if (!serviceDoc) throw new APIError(404, "Service not found", "SERVICE_NOT_FOUND");

        const bookingDateMidnight = new Date(date);
        bookingDateMidnight.setHours(0, 0, 0, 0);
        const bookingDateTimestamp = bookingDateMidnight.getTime();

        const matchingSlot = serviceDoc.timeSlots.find((slot: any) => {
            const slotDate = new Date(slot.date);
            slotDate.setHours(0, 0, 0, 0);
            return slotDate.getTime() === bookingDateTimestamp &&
                slot.startTime === startTime &&
                slot.endTime === endTime;
        });

        if (!matchingSlot) {
            console.error(`[BookingService] Slot not found in Service timeSlots for booking ${bookingId}. date=${date}, startTime=${startTime}`);
            throw new APIError(409, "This time slot no longer exists. Please choose another time.", "SLOT_UNAVAILABLE");
        }

        const exactSlotDate = matchingSlot.date;

        // Resolve staff selection
        let targetStaffId = staffId;

        // If no staffId was selected by the customer, assign the first available staff member in this slot
        if (!targetStaffId && matchingSlot.staffIds && matchingSlot.staffIds.length > 0) {
            const availableStaff = matchingSlot.staffIds.find((s: any) => !s.isBooked);
            if (availableStaff) {
                targetStaffId = availableStaff.staffId;
                
                // Update booking document with automatically assigned staff member
                booking.staffId = targetStaffId;
                await booking.save({ session });
                console.log(`[BookingService] Automatically assigned staff ${targetStaffId} to booking ${bookingId}`);
            }
        }

        let service;
        if (targetStaffId) {
            // Atomic update: only succeeds if isBooked is false for the targeted staff member
            service = await Service.findOneAndUpdate(
                {
                    _id: serviceId,
                    "timeSlots": {
                        $elemMatch: {
                            date: exactSlotDate,
                            startTime,
                            endTime,
                            "staffIds": {
                                $elemMatch: {
                                    staffId: targetStaffId,
                                    isBooked: false
                                }
                            }
                        }
                    }
                },
                {
                    $set: {
                        "timeSlots.$[slot].staffIds.$[staff].isBooked": true,
                        "timeSlots.$[slot].staffIds.$[staff].bookingId": new mongoose.Types.ObjectId(bookingId)
                    }
                },
                {
                    arrayFilters: [
                        { "slot.date": exactSlotDate, "slot.startTime": startTime, "slot.endTime": endTime },
                        { "staff.staffId": targetStaffId, "staff.isBooked": false }
                    ],
                    new: true,
                    session
                }
            );
        } else {
            // Slot-level atomic update (used if no staff are configured for this slot/service)
            service = await Service.findOneAndUpdate(
                {
                    _id: serviceId,
                    "timeSlots": {
                        $elemMatch: {
                            date: exactSlotDate,
                            startTime,
                            endTime,
                            isBooked: { $ne: true }
                        }
                    }
                },
                {
                    $set: {
                        "timeSlots.$[slot].isBooked": true,
                        "timeSlots.$[slot].bookingId": new mongoose.Types.ObjectId(bookingId)
                    }
                },
                {
                    arrayFilters: [
                        { "slot.date": exactSlotDate, "slot.startTime": startTime, "slot.endTime": endTime }
                    ],
                    new: true,
                    session
                }
            );
        }

        if (!service) {
            console.error(`[BookingService] Hold acquisition failed for ${bookingId}. Slot already taken.`);
            throw new APIError(409, "This time slot was just taken by another customer. Please choose another time.", "SLOT_UNAVAILABLE");
        }

        // ISSUE 3 FIX: Explicitly trigger pre-save hook to recalculate slot-level isBooked
        await service.save({ session });

        console.log(`[BookingService] Hold acquired successfully for booking ${bookingId}`);
        return true;
    }

    /**
     * Atomically releases a hold on a slot.
     * Used when a pre-payment hold expires or is cancelled.
     */
    static async releaseHold(bookingId: string) {
        await dbConnect();

        // 1. Try to release staff-level hold
        let service = await Service.findOneAndUpdate(
            {
                "timeSlots.staffIds.bookingId": new mongoose.Types.ObjectId(bookingId)
            },
            {
                $set: {
                    "timeSlots.$[].staffIds.$[staff].isBooked": false,
                    "timeSlots.$[].staffIds.$[staff].bookingId": null
                }
            },
            {
                arrayFilters: [
                    { "staff.bookingId": new mongoose.Types.ObjectId(bookingId) }
                ],
                new: true
            }
        );

        // 2. If no staff hold was found, try to release slot-level hold
        if (!service) {
            service = await Service.findOneAndUpdate(
                {
                    "timeSlots.bookingId": new mongoose.Types.ObjectId(bookingId)
                },
                {
                    $set: {
                        "timeSlots.$[slot].isBooked": false,
                        "timeSlots.$[slot].bookingId": null
                    }
                },
                {
                    arrayFilters: [
                        { "slot.bookingId": new mongoose.Types.ObjectId(bookingId) }
                    ],
                    new: true
                }
            );
        }

        if (service) {
            // Trigger pre-save middleware to recalculate isBooked
            await service.save();
            console.log(`[BookingService] Released hold for booking ${bookingId}`);
        }
        return !!service;
    }

    /**
     * Finalizes a booking after successful payment.
     * This transitions the booking from "pre_payment" to "confirmed".
     */
    static async confirmSlotReservation(bookingId: string) {
        await dbConnect();

        const booking = await Booking.findById(bookingId);
        if (!booking) throw new APIError(404, "Booking not found", "NOT_FOUND");

        if (booking.status === "confirmed") {
            return { booking, justConfirmed: false };
        }

        // Verify the hold still exists for this booking (either staff-level or slot-level)
        const service = await Service.findOne({
            $or: [
                { "timeSlots.staffIds.bookingId": new mongoose.Types.ObjectId(bookingId) },
                { "timeSlots.bookingId": new mongoose.Types.ObjectId(bookingId) }
            ]
        });

        if (!service) {
            // CRITICAL EDGE CASE: Hold expired exactly when payment finished.
            // We should try to re-acquire the hold if it's still available.
            try {
                await this.acquireHold(bookingId);
            } catch (e) {
                console.error(`[BookingService] CRITICAL: Payment succeeded but hold was lost and slot re-booked for ${bookingId}`);
                throw new APIError(409, "Payment was successful, but your session expired and the slot was taken. A refund will be processed.", "SESSION_EXPIRED");
            }
        }

        // Update booking status
        // SANITIZATION LOGIC FOR ISSUE 5:
        const wasCancelled = booking.status === "cancelled";
        if (wasCancelled) {
            console.log(`[BookingService] Resurrecting expired/cancelled hold for booking ${bookingId}`);
            booking.cancelledAt = undefined;
            booking.cancelledBy = undefined;
            booking.cancellationReason = undefined;
        }

        booking.status = "confirmed";
        booking.paymentStatus = "deposit_paid";
        await booking.save();

        console.log(`[BookingService] Booking ${bookingId} finalized and confirmed.`);
        return { booking, justConfirmed: true };
    }

    /**
     * Cleans up expired pre-payment holds (older than 15 minutes).
     * This is the "Garbage Collector" for the booking system.
     */
    static async cleanupExpiredHolds() {
        await dbConnect();

        const expiryTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes

        // Find expired bookings
        const expiredBookings = await Booking.find({
            status: "pre_payment",
            createdAt: { $lt: expiryTime }
        });

        if (expiredBookings.length === 0) return 0;

        console.log(`[BookingService] Cleaning up ${expiredBookings.length} expired holds...`);

        for (const booking of expiredBookings) {
            try {
                // 1. Release the slot in Service model
                await this.releaseHold(String(booking._id));

                // 2. Mark booking as cancelled
                booking.status = "cancelled";
                booking.cancellationReason = "Pre-payment hold expired";
                await booking.save();
            } catch (error) {
                console.error(`[BookingService] Error cleaning up booking ${booking._id}:`, error);
            }
        }

        return expiredBookings.length;
    }
}
