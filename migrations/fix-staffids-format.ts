#!/usr/bin/env ts-node

/**
 * Migration Script: Standardize StaffIds Format
 * 
 * Converts all timeSlots.staffIds to canonical format:
 * {staffId: ObjectId, isBooked: boolean}
 * 
 * Handles:
 * - Plain ObjectIds → {staffId: ObjectId, isBooked: false}
 * - {_id, isBooked} → {staffId, isBooked}
 * - {staffId, isBooked} → Keep as-is
 */

import mongoose from 'mongoose';

// Load environment variables

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.error('Please run: export MONGODB_URI="your_mongodb_connection_string"');
    process.exit(1);
}

async function migrateStaffIdsFormat() {
    console.log('🚀 Starting StaffIds Format Migration...\n');

    try {
        // Connect to database
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        const servicesCollection = db.collection('services');

        // Get all services
        const allServices = await servicesCollection.find({}).toArray();
        console.log(`📊 Found ${allServices.length} services to process\n`);

        let servicesUpdated = 0;
        let timeSlotsUpdated = 0;
        let errors = 0;

        for (const service of allServices) {
            let serviceModified = false;
            const updatedTimeSlots = [];

            if (!service.timeSlots || !Array.isArray(service.timeSlots)) {
                updatedTimeSlots.push(...(service.timeSlots || []));
                continue;
            }

            for (const slot of service.timeSlots) {
                if (!slot.staffIds || !Array.isArray(slot.staffIds)) {
                    updatedTimeSlots.push(slot);
                    continue;
                }

                const transformedStaffIds = [];
                let slotModified = false;

                for (const staff of slot.staffIds) {
                    // Check if it's already in canonical format
                    if (staff && typeof staff === 'object' && staff.staffId && typeof staff.isBooked === 'boolean') {
                        // Already canonical format
                        transformedStaffIds.push({
                            staffId: staff.staffId,
                            isBooked: staff.isBooked
                        });
                        continue;
                    }

                    // Check if it's MongoDB format with _id
                    if (staff && typeof staff === 'object' && staff._id) {
                        transformedStaffIds.push({
                            staffId: staff._id,
                            isBooked: staff.isBooked || false
                        });
                        slotModified = true;
                        continue;
                    }

                    // Check if it's plain ObjectId
                    if (staff && mongoose.Types.ObjectId.isValid(staff)) {
                        transformedStaffIds.push({
                            staffId: typeof staff === 'string' ? new mongoose.Types.ObjectId(staff) : staff,
                            isBooked: false
                        });
                        slotModified = true;
                        continue;
                    }

                    // Unknown format - log warning and skip
                    console.warn(`⚠️  Unknown staffIds format in service ${service._id}, slot ${slot.startTime}-${slot.endTime}:`, staff);
                    errors++;
                }

                if (slotModified) {
                    timeSlotsUpdated++;
                    serviceModified = true;
                }

                updatedTimeSlots.push({
                    ...slot,
                    staffIds: transformedStaffIds
                });
            }

            // Update service if modified
            if (serviceModified) {
                await servicesCollection.updateOne(
                    { _id: service._id },
                    { $set: { timeSlots: updatedTimeSlots } }
                );
                servicesUpdated++;
                console.log(`✓ Updated service: ${service.serviceName} (${service._id})`);
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   Services processed: ${allServices.length}`);
        console.log(`   Services updated: ${servicesUpdated}`);
        console.log(`   Time slots updated: ${timeSlotsUpdated}`);
        console.log(`   Errors/Warnings: ${errors}`);

        if (errors > 0) {
            console.log('\n⚠️  Migration completed with warnings. Please review the logs above.');
        } else {
            console.log('\n✅ Migration completed successfully!');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run migration
migrateStaffIdsFormat()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
