/**
 * API Route: Complete Bookings Job
 * Manually trigger the booking completion job
 * Can be called by cron services like Vercel Cron
 */

import { NextRequest } from "next/server";
import { BookingJobs } from "@/lib/jobs/booking-jobs";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/complete-bookings
 * Run the booking completion job
 * 
 * Usage:
 * - Vercel Cron: Schedule to run every 5-10 minutes
 * - Manual: Call this endpoint to trigger job manually
 */
export async function GET(req: NextRequest) {
    try {
        // Optional: Add API key authentication for security
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return errorResponse(401, "Unauthorized", "UNAUTHORIZED");
        }

        console.log('🔄 Booking completion job triggered via API');

        // Run all booking jobs
        const result = await BookingJobs.runAll();

        return successResponse({
            message: "Booking jobs completed successfully",
            ...result,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ Job execution error:', error);

        return errorResponse(
            500,
            error.message || "Failed to run booking jobs",
            "JOB_EXECUTION_ERROR"
        );
    }
}
