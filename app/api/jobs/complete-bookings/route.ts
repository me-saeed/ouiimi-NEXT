/**
 * API Route: Complete Bookings Job
 * Manually trigger the booking completion job
 * Can be called by cron services like Vercel Cron
 */

import { NextRequest, NextResponse } from "next/server";
import { BookingJobs } from "@/lib/jobs/booking-jobs";
import { successResponse } from "@/lib/api-response";

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
            return NextResponse.json(
                { error: "Unauthorized", code: "UNAUTHORIZED" },
                { status: 401 }
            );
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

        return NextResponse.json(
            {
                error: error.message || "Failed to run booking jobs",
                code: "JOB_EXECUTION_ERROR"
            },
            { status: 500 }
        );
    }
}
