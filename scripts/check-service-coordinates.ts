/**
 * Script to check and fix service coordinates in the database
 * 
 * Usage:
 *   npx ts-node scripts/check-service-coordinates.ts
 * 
 * This script:
 * 1. Finds all services with [0, 0] or missing coordinates
 * 2. Attempts to geocode their addresses
 * 3. Updates them with valid coordinates
 */

import mongoose from 'mongoose';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';

interface ServiceDoc {
    _id: mongoose.Types.ObjectId;
    serviceName: string;
    address: {
        street: string;
        location?: {
            type: string;
            coordinates: [number, number];
        };
    };
}

async function main() {
    console.log('🔍 Checking service coordinates...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Service = mongoose.model('Service');

    // Find services with invalid coordinates
    const invalidServices = await Service.find({
        $or: [
            { 'address.location': { $exists: false } },
            { 'address.location.coordinates': { $exists: false } },
            { 'address.location.coordinates': [0, 0] },
        ]
    }).lean() as unknown as ServiceDoc[];

    console.log(`Found ${invalidServices.length} services with invalid/missing coordinates:\n`);

    for (const service of invalidServices) {
        console.log(`  📍 ${service.serviceName}`);
        console.log(`     Address: ${service.address?.street || 'N/A'}`);
        console.log(`     Current coords: ${JSON.stringify(service.address?.location?.coordinates || 'N/A')}`);
        console.log('');
    }

    // Also check services that appear to be in Islamabad area
    const allServices = await Service.find({}).lean() as unknown as ServiceDoc[];
    console.log(`\n📊 All Services Coordinate Check:`);
    for (const service of allServices) {
        const coords = service.address?.location?.coordinates;
        const isValid = coords && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0);
        console.log(`  ${isValid ? '✅' : '❌'} ${service.serviceName} - [${coords?.[0] || 'N/A'}, ${coords?.[1] || 'N/A'}]`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
}

main().catch(console.error);
