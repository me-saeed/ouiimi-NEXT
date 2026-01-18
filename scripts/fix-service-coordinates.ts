/**
 * Data Migration Script: Fix Service Coordinates
 * 
 * This script finds all services with [0, 0] coordinates and attempts
 * to geocode their addresses to get valid coordinates.
 * 
 * USAGE:
 *   NODE_ENV=production npx ts-node scripts/fix-service-coordinates.ts
 * 
 * IMPORTANT: 
 *   - This script requires the GOOGLE_MAPS_API_KEY environment variable
 *   - Run in dry-run mode first (DRY_RUN=true)
 *   - Back up your database before running
 */

import mongoose from 'mongoose';
import fetch from 'node-fetch';

// Load environment
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry run

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not set');
    process.exit(1);
}

if (!GOOGLE_MAPS_API_KEY) {
    console.error('ERROR: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set');
    process.exit(1);
}

// Geocode an address using Google Maps API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json() as any;

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }

        console.warn(`  ⚠️ Geocoding failed for "${address}": ${data.status}`);
        return null;
    } catch (error) {
        console.error(`  ❌ Geocoding error for "${address}":`, error);
        return null;
    }
}

async function main() {
    console.log('🔧 Service Coordinates Migration Script');
    console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : '⚠️ LIVE (will update database)'}`);
    console.log('');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Define a minimal schema for the migration
    const serviceSchema = new mongoose.Schema({
        serviceName: String,
        address: {
            street: String,
            location: {
                type: { type: String },
                coordinates: [Number],
            },
        },
    }, { strict: false });

    const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

    // Find services with [0, 0] coordinates
    const invalidServices = await Service.find({
        'address.location.coordinates': [0, 0],
    }).lean();

    console.log(`📊 Found ${invalidServices.length} services with [0, 0] coordinates`);
    console.log('');

    if (invalidServices.length === 0) {
        console.log('✅ No services need fixing!');
        await mongoose.disconnect();
        return;
    }

    let fixed = 0;
    let failed = 0;

    for (const service of invalidServices) {
        const s = service as any;
        console.log(`📍 ${s.serviceName}`);
        console.log(`   Address: ${s.address?.street || 'N/A'}`);

        if (!s.address?.street) {
            console.log('   ❌ No street address to geocode');
            failed++;
            continue;
        }

        // Geocode the address
        const coords = await geocodeAddress(s.address.street);

        if (!coords) {
            console.log('   ❌ Could not geocode address');
            failed++;
            continue;
        }

        console.log(`   ✅ Geocoded: [${coords.lng}, ${coords.lat}]`);

        if (!DRY_RUN) {
            // Update the service
            await Service.updateOne(
                { _id: s._id },
                {
                    $set: {
                        'address.location.coordinates': [coords.lng, coords.lat],
                    },
                }
            );
            console.log('   💾 Updated in database');
        } else {
            console.log('   🔍 DRY RUN - would update in database');
        }

        fixed++;
        console.log('');

        // Rate limit to avoid hitting Google API limits
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('═══════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   Total processed: ${invalidServices.length}`);
    console.log(`   Successfully fixed: ${fixed}`);
    console.log(`   Failed: ${failed}`);
    console.log('');

    if (DRY_RUN) {
        console.log('ℹ️  This was a DRY RUN. To apply changes, run with:');
        console.log('   DRY_RUN=false npx ts-node scripts/fix-service-coordinates.ts');
    }

    await mongoose.disconnect();
    console.log('');
    console.log('✅ Done');
}

main().catch(console.error);
