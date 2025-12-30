
import mongoose from "mongoose";
import Booking from "@/lib/models/Booking";

/**
 * Checks if a staff member is available for a specific time slot across ALL services.
 * Formula: (s1 < e2 && s2 < e1)
 */
export async function isStaffAvailable(
    staffId: string | mongoose.Types.ObjectId,
    date: Date | string,
    startTime: string,
    endTime: string
): Promise<boolean> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingBooking = await Booking.findOne({
        staffId: new mongoose.Types.ObjectId(String(staffId)),
        status: { $in: ["confirmed", "pending"] },
        "timeSlot.date": { $gte: startOfDay, $lte: endOfDay },
        "timeSlot.startTime": { $lt: endTime },
        "timeSlot.endTime": { $gt: startTime },
    });

    return !overlappingBooking;
}

/**
 * Higher-performance availability check for bulk processing.
 * Fetches all relevant bookings once and returns a map for quick lookup.
 */
export async function getGlobalBusyMap(
    staffIds: string[],
    startDate: Date,
    endDate: Date
): Promise<Record<string, Array<{ date: string; startTime: string; endTime: string }>>> {
    if (!staffIds || staffIds.length === 0) return {};

    const bookings = await Booking.find({
        staffId: { $in: staffIds.map(id => new mongoose.Types.ObjectId(id)) },
        status: { $in: ["confirmed", "pending"] },
        "timeSlot.date": { $gte: startDate, $lte: endDate },
    }).select("staffId timeSlot.date timeSlot.startTime timeSlot.endTime");

    const busyMap: Record<string, any[]> = {};

    bookings.forEach(b => {
        const sid = String(b.staffId);
        if (!busyMap[sid]) busyMap[sid] = [];

        busyMap[sid].push({
            date: new Date(b.timeSlot.date).toISOString().split('T')[0],
            startTime: b.timeSlot.startTime,
            endTime: b.timeSlot.endTime
        });
    });

    return busyMap;
}

/**
 * Checks if a staff member is busy based on a pre-fetched busy map.
 * Uses proper time overlap detection: (s1 < e2 && s2 < e1)
 */
export function isStaffBusy(
    busyMap: Record<string, any[]>,
    staffId: string,
    date: Date | string,
    startTime: string,
    endTime?: string // Optional: if provided, checks for any overlap
): boolean {
    const sid = String(staffId);
    const dateStr = new Date(date).toISOString().split('T')[0];
    const staffBookings = busyMap[sid];

    if (!staffBookings) return false;

    // Convert time strings to minutes for comparison
    const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const slotStart = timeToMinutes(startTime);
    // If no endTime provided, assume 1 hour duration for overlap check
    const slotEnd = endTime ? timeToMinutes(endTime) : slotStart + 60;

    // Check for ANY overlapping booking: (existingStart < slotEnd) && (existingEnd > slotStart)
    return staffBookings.some(b => {
        if (b.date !== dateStr) return false;

        const bookingStart = timeToMinutes(b.startTime);
        const bookingEnd = timeToMinutes(b.endTime);

        // Overlap formula: two ranges [s1, e1] and [s2, e2] overlap if s1 < e2 AND s2 < e1
        return bookingStart < slotEnd && bookingEnd > slotStart;
    });
}

/**
 * Gets all busy time slots for a staff member on a specific date.
 */
export async function getStaffBusySlots(
    staffId: string | mongoose.Types.ObjectId,
    date: Date | string
): Promise<Array<{ startTime: string; endTime: string }>> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const busyBookings = await Booking.find({
        staffId: new mongoose.Types.ObjectId(String(staffId)),
        status: { $in: ["confirmed", "pending"] },
        "timeSlot.date": { $gte: startOfDay, $lte: endOfDay },
    }).select("timeSlot.startTime timeSlot.endTime");

    return busyBookings.map(b => ({
        startTime: b.timeSlot.startTime,
        endTime: b.timeSlot.endTime,
    }));
}
