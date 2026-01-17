/**
 * Debug endpoint to check service coordinates
 * 
 * GET /api/debug/service-coords
 * 
 * This is a temporary debug endpoint - remove after fixing the issue
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const serviceName = searchParams.get('serviceName') || '';

        // Find all services and their coordinates
        const services = await Service.find(
            serviceName ? { serviceName: { $regex: serviceName, $options: 'i' } } : {}
        ).select('serviceName address.street address.location').lean();

        const report = services.map((s: any) => ({
            serviceName: s.serviceName,
            street: s.address?.street || 'N/A',
            coordinates: s.address?.location?.coordinates || 'MISSING',
            hasValidCoords: !!(
                s.address?.location?.coordinates &&
                s.address.location.coordinates.length === 2 &&
                (s.address.location.coordinates[0] !== 0 || s.address.location.coordinates[1] !== 0)
            )
        }));

        const summary = {
            total: services.length,
            withValidCoords: report.filter((r: any) => r.hasValidCoords).length,
            withInvalidCoords: report.filter((r: any) => !r.hasValidCoords).length,
        };

        return NextResponse.json({
            summary,
            services: report
        });
    } catch (error: any) {
        console.error('Debug endpoint error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
