/**
 * Comprehensive debug endpoint for service location filtering
 * 
 * GET /api/debug/geo-audit
 * 
 * Query params:
 * - latitude: Search latitude
 * - longitude: Search longitude
 * - category: Category filter (optional)
 * 
 * Returns:
 * - All services with their coordinates
 * - Which services match the geo query
 * - Why services are being filtered out
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const latitude = searchParams.get('latitude');
        const longitude = searchParams.get('longitude');
        const category = searchParams.get('category');
        const radius = parseFloat(searchParams.get('radius') || '15'); // km

        // Step 1: Get ALL services (no geo filter)
        const allServicesQuery: any = { status: 'listed' };
        if (category) allServicesQuery.category = category;

        const allServices = await Service.find(allServicesQuery)
            .select('serviceName category address timeSlots status')
            .lean();

        // Step 2: Analyze each service's location data
        const serviceAnalysis = allServices.map((s: any) => {
            const coords = s.address?.location?.coordinates;
            const hasLocation = !!s.address?.location;
            const hasCoords = Array.isArray(coords) && coords.length === 2;
            const hasValidCoords = hasCoords && (coords[0] !== 0 || coords[1] !== 0);
            const isWithinLngRange = hasCoords && coords[0] >= -180 && coords[0] <= 180;
            const isWithinLatRange = hasCoords && coords[1] >= -90 && coords[1] <= 90;

            // Count available slots
            const now = new Date();
            const futureSlots = (s.timeSlots || []).filter((slot: any) => {
                const slotDate = new Date(slot.date);
                return slotDate >= now && !slot.isBooked;
            });

            return {
                serviceName: s.serviceName,
                category: s.category,
                street: s.address?.street || 'NO_STREET',
                coordinates: hasCoords ? coords : 'MISSING',
                status: s.status,
                diagnostics: {
                    hasLocation,
                    hasCoords,
                    hasValidCoords,
                    isWithinLngRange,
                    isWithinLatRange,
                    coordinatesAreZeroZero: hasCoords && coords[0] === 0 && coords[1] === 0,
                    futureAvailableSlots: futureSlots.length,
                },
                verdict: !hasLocation ? 'MISSING_LOCATION' :
                    !hasCoords ? 'MISSING_COORDINATES' :
                        !hasValidCoords ? 'COORDINATES_ARE_ZERO' :
                            !isWithinLngRange || !isWithinLatRange ? 'COORDINATES_OUT_OF_RANGE' :
                                futureSlots.length === 0 ? 'NO_FUTURE_SLOTS' :
                                    'OK'
            };
        });

        // Step 3: If lat/lng provided, run the geo query
        let geoQueryResult: any = null;
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
                const filter: any = { status: 'listed' };
                if (category) filter.category = category;

                // Raw geo query with NO slot filtering
                const rawGeoResults = await Service.aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: 'Point',
                                coordinates: [lng, lat],
                            },
                            distanceField: 'distance',
                            maxDistance: radius * 1000,
                            spherical: true,
                            query: filter,
                        },
                    },
                ]);

                geoQueryResult = {
                    searchLocation: { latitude: lat, longitude: lng },
                    radiusKm: radius,
                    radiusMeters: radius * 1000,
                    matchingServices: rawGeoResults.map((s: any) => ({
                        serviceName: s.serviceName,
                        coordinates: s.address?.location?.coordinates,
                        distanceMeters: Math.round(s.distance),
                        distanceKm: (s.distance / 1000).toFixed(2),
                    })),
                    totalMatching: rawGeoResults.length,
                };
            }
        }

        // Summary
        const summary = {
            totalServices: allServices.length,
            withValidCoords: serviceAnalysis.filter((s: any) => s.verdict === 'OK').length,
            withZeroCoords: serviceAnalysis.filter((s: any) => s.diagnostics.coordinatesAreZeroZero).length,
            withMissingCoords: serviceAnalysis.filter((s: any) => s.verdict === 'MISSING_COORDINATES' || s.verdict === 'MISSING_LOCATION').length,
            withNoFutureSlots: serviceAnalysis.filter((s: any) => s.verdict === 'NO_FUTURE_SLOTS').length,
            geoMatchCount: geoQueryResult?.totalMatching ?? 'N/A (no lat/lng provided)',
        };

        return NextResponse.json({
            summary,
            geoQueryResult,
            services: serviceAnalysis,
        });
    } catch (error: any) {
        console.error('Geo audit error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
