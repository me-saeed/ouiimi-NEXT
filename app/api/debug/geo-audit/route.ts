import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const businesses = await Business.find({}).select('businessName address location');
        const services = await Service.find({}).select('serviceName address');

        const businessStats = {
            total: businesses.length,
            validGeoJSON: 0,
            missingGeoJSON: 0,
        };

        const serviceStats = {
            total: services.length,
            validGeoJSON: 0,
            missingGeoJSON: 0,
        };

        const businessDetails: any[] = [];
        const serviceDetails: any[] = [];

        businesses.forEach((b: any) => {
            const hasLocation = b.location && b.location.type === 'Point' && Array.isArray(b.location.coordinates) && b.location.coordinates.length === 2;

            if (hasLocation) {
                businessStats.validGeoJSON++;
            } else {
                businessStats.missingGeoJSON++;
                if (businessDetails.length < 50) { // Limit details
                    businessDetails.push({
                        id: b._id,
                        name: b.businessName,
                        hasAddressString: !!b.address,
                        locationField: b.location
                    });
                }
            }
        });

        services.forEach((s: any) => {
            const hasLocation = s.address && s.address.location && s.address.location.type === 'Point' && Array.isArray(s.address.location.coordinates) && s.address.location.coordinates.length === 2;

            if (hasLocation) {
                serviceStats.validGeoJSON++;
            } else {
                serviceStats.missingGeoJSON++;
                if (serviceDetails.length < 50) {
                    serviceDetails.push({
                        id: s._id,
                        name: s.serviceName,
                        addressField: s.address
                    });
                }
            }
        });

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            summary: {
                business: businessStats,
                service: serviceStats
            },
            invalidBusinesses: businessDetails,
            invalidServices: serviceDetails
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
