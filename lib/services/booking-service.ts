import Booking from "@/lib/models/Booking";
import Service from "@/lib/models/Service";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

/**
 * Centrally manages booking operations to ensure consistency and avoid race conditions.
 * Implements a "Pessimistic Hold" pattern for time slots.
 */
export class BookingService {
    /**
     * Atomically acquires a hold on a slot during the pre-payment phase.
     * This prevents other users from booking the same slot while the current user is at Stripe checkout.
     */
    static async acquireHold(bookingId: string) {
        await dbConnect();

        const booking = await Booking.findById(bookingId);
        if (!booking) throw new Error("Booking not found");

        const serviceId = booking.serviceId;
        const staffId = booking.staffId;
        const { date, startTime, endTime } = booking.timeSlot;

        console.log(`[BookingService] Attempting to acquire hold for booking ${bookingId} on slot ${startTime}...`);

        // Atomic update: only succeeds if isBooked is false
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
                    "timeSlots.$[slot].staffIds.$[staff].isBooked": true,
                    "timeSlots.$[slot].staffIds.$[staff].bookingId": new mongoose.Types.ObjectId(bookingId)
                }
            },
            {
                arrayFilters: [
                    { "slot.date": new Date(date), "slot.startTime": startTime, "slot.endTime": endTime },
                    { "staff.staffId": staffId, "staff.isBooked": false }
                ],
                new: true
            }
        );

        if (!service) {
            console.error(`[BookingService] Hold acquisition failed for ${bookingId}. Slot already taken.`);
            throw new Error("This time slot was just taken by another customer. Please choose another time.");
        }

        console.log(`[BookingService] Hold acquired successfully for booking ${bookingId}`);
        return true;
    }

    /**
     * Atomically releases a hold on a slot.
     * Used when a pre-payment hold expires or is cancelled.
     */
    static async releaseHold(bookingId: string) {
        await dbConnect();

        // Find the service that has a slot held by this bookingId
        const service = await Service.findOneAndUpdate(
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

        if (service) {
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
        if (!booking) throw new Error("Booking not found");

        if (booking.status === "confirmed") return booking;

        // Verify the hold still exists for this booking
        const service = await Service.findOne({
            "timeSlots.staffIds.bookingId": new mongoose.Types.ObjectId(bookingId)
        });

        if (!service) {
            // CRITICAL EDGE CASE: Hold expired exactly when payment finished.
            // We should try to re-acquire the hold if it's still available.
            try {
                await this.acquireHold(bookingId);
            } catch (e) {
                console.error(`[BookingService] CRITICAL: Payment succeeded but hold was lost and slot re-booked for ${bookingId}`);
                throw new Error("Payment was successful, but your session expired and the slot was taken. A refund will be processed.");
            }
        }

        // Update booking status
        booking.status = "confirmed";
        booking.paymentStatus = "deposit_paid";
        await booking.save();

        console.log(`[BookingService] Booking ${bookingId} finalized and confirmed.`);
        return booking;
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
