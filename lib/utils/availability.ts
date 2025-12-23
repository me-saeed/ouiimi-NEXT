import Booking from "@/lib/models/Booking";
import mongoose from "mongoose";

/**
 * Global Staff Availability Utility
 * 
 * Checks the 'bookings' collection to see if staff members are busy 
 * across ANY service at a specific date and time.
 */

export interface BusySlot {
    staffId: string;
    date: string; // YYYY-MM-DD
    startTime: string;
}

/**
 * Fetches all busy staff IDs for a specific date range.
 * Returns a Map where key is "staffId_date_startTime"
 */
export async function getGlobalBusyMap(staffIds: string[], startDate: Date, endDate: Date) {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Expire stale bookings first (proactive cleanup)
    const expiryTime = new Date(Date.now() - 15 * 60 * 1000);
    await Booking.updateMany(
        { status: "pending", createdAt: { $lt: expiryTime } },
        { $set: { status: "cancelled", cancellationReason: "Pre-payment hold expired" } }
    );

    const activeBookings = await Booking.find({
        staffId: { $in: staffIds.map(id => new mongoose.Types.ObjectId(id)) },
        status: { $in: ["confirmed", "pending"] },
        "timeSlot.date": { $gte: startOfDay, $lte: endOfDay }
    }).select("staffId timeSlot");

    const busyMap = new Set<string>();

    activeBookings.forEach(booking => {
        const dateStr = new Date(booking.timeSlot.date).toISOString().split('T')[0];
        const key = `${String(booking.staffId)}_${dateStr}_${booking.timeSlot.startTime}`;
        busyMap.add(key);
    });

    return busyMap;
}

/**
 * Checks if a specific staff member is busy at a specific time
 */
export function isStaffBusy(busyMap: Set<string>, staffId: string, date: Date | string, startTime: string): boolean {
    const dateStr = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
    const key = `${staffId}_${dateStr}_${startTime}`;
    return busyMap.has(key);
}
