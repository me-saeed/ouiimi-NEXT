/**
 * Booking Background Jobs
 * Auto-completes bookings and sends notifications
 */

import { Booking, Service, User, Business } from '@/lib/models';
import dbConnect from '@/lib/db';
import EmailService from '@/lib/email-service';
import { parseLocalDate } from '@/lib/utils/date-utils';

export class BookingJobs {
    /**
     * Mark confirmed bookings as completed after their end time has passed
     */
    static async markCompletedBookings() {
        try {
            await dbConnect();

            const now = new Date();
            console.log(`🔄 Running auto-completion job at ${now.toISOString()}`);

            // Find all confirmed bookings where end time has passed
            const bookingsToComplete = await Booking.find({
                status: "confirmed"
            })
                .populate('userId', 'fname lname email contactNo phone')
                .populate('businessId', 'businessName email phone address')
                .populate('serviceId', 'serviceName')
                .lean();

            let completedCount = 0;

            for (const booking of bookingsToComplete) {
                try {
                    // Parse booking end time using parseLocalDate for timezone safety
                    // This prevents UTC midnight interpretation issues
                    const bookingDate = parseLocalDate(booking.timeSlot.date);
                    const [endHour, endMinute] = booking.timeSlot.endTime.split(':');
                    const bookingEndDateTime = new Date(bookingDate);
                    bookingEndDateTime.setHours(parseInt(endHour, 10), parseInt(endMinute, 10), 0, 0);

                    // Check if end time has passed
                    if (now > bookingEndDateTime) {
                        // Mark as completed
                        await Booking.findByIdAndUpdate(booking._id, {
                            status: "completed",
                            completedAt: now
                        });

                        completedCount++;
                        console.log(`✅ Marked booking ${booking._id} as completed`);

                        // Send completion emails
                        if (booking.userId && booking.businessId && booking.serviceId) {
                            const emailPayload = {
                                booking: booking as any,
                                customer: booking.userId as any,
                                business: booking.businessId as any,
                                service: booking.serviceId as any
                            };

                            await EmailService.sendServiceCompletedToCustomer(emailPayload);
                            await EmailService.sendServiceCompletedToBusiness(emailPayload);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error completing booking ${booking._id}:`, error);
                    // Continue with next booking
                }
            }

            console.log(`✨ Completed ${completedCount} bookings`);
            return { success: true, completedCount };

        } catch (error) {
            console.error('❌ Error in markCompletedBookings job:', error);
            throw error;
        }
    }

    /**
     * Cancel expired pre_payment bookings (older than 15 minutes)
     */
    static async expireOldBookings() {
        try {
            await dbConnect();

            const expiryTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

            const result = await Booking.updateMany(
                {
                    status: { $in: ["pre_payment", "pending"] },
                    createdAt: { $lt: expiryTime }
                },
                {
                    $set: {
                        status: "cancelled",
                        cancellationReason: "Payment timeout - booking expired"
                    }
                }
            );

            console.log(`🗑️  Expired ${result.modifiedCount} old pre-payment bookings`);
            return { success: true, expiredCount: result.modifiedCount };

        } catch (error) {
            console.error('❌ Error in expireOldBookings job:', error);
            throw error;
        }
    }

    /**
     * Send reminder emails for bookings happening tomorrow
     * (Future enhancement)
     */
    static async sendReminders() {
        try {
            await dbConnect();

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const nextDay = new Date(tomorrow);
            nextDay.setDate(nextDay.getDate() + 1);

            const bookings = await Booking.find({
                status: "confirmed",
                "timeSlot.date": { $gte: tomorrow, $lt: nextDay }
            })
                .populate('userId businessId serviceId')
                .lean();

            console.log(`📬 Sending ${bookings.length} reminder emails`);

            for (const booking of bookings) {
                // TODO: Implement reminder email
                console.log(`  → Reminder for booking ${booking._id}`);
            }

            return { success: true, remindersSent: bookings.length };

        } catch (error) {
            console.error('❌ Error in sendReminders job:', error);
            throw error;
        }
    }

    /**
     * Run all jobs sequentially
     */
    static async runAll() {
        console.log('🚀 Running all booking jobs...\n');

        try {
            const [completed, expired] = await Promise.all([
                this.markCompletedBookings(),
                this.expireOldBookings()
            ]);

            console.log('\n✨ All jobs completed successfully');
            return {
                success: true,
                completed: completed.completedCount,
                expired: expired.expiredCount
            };
        } catch (error) {
            console.error('\n❌ Job execution failed:', error);
            throw error;
        }
    }
}

export default BookingJobs;
