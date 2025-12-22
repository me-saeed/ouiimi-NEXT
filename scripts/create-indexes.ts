/**
 * =============================================================================
 * DATABASE INDEXES SETUP
 * =============================================================================
 * 
 * Usage: MONGODB_URI="your_connection_string" npx tsx scripts/create-indexes.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable is required');
    process.exit(1);
}

async function createIndex(collection: any, spec: any, options: any = {}) {
    try {
        await collection.createIndex(spec, options);
        return true;
    } catch (error: any) {
        if (error.code === 85 || error.message.includes('already exists')) {
            return false;
        }
        throw error;
    }
}

async function createIndexes() {
    console.log('🔧 Creating database indexes...\n');

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const db = mongoose.connection.db;
        if (!db) throw new Error('Database connection failed');

        let created = 0;
        let skipped = 0;

        // Bookings
        console.log('Booking indexes...');
        const Booking = db.collection('bookings');
        created += await createIndex(Booking, { userId: 1, status: 1 }, { name: 'booking_user_status' }) ? 1 : 0;
        created += await createIndex(Booking, { businessId: 1, status: 1 }, { name: 'booking_business_status' }) ? 1 : 0;
        created += await createIndex(Booking, { 'timeSlot.date': 1 }, { name: 'booking_timeslot_date' }) ? 1 : 0;
        created += await createIndex(Booking, { adminPaymentStatus: 1, updatedAt: -1 }, { name: 'booking_payment_updated' }) ? 1 : 0;
        console.log(`✅ ${created} indexes created/verified`);

        // Services
        console.log('\nService indexes...');
        const Service = db.collection('services');
        let sCreated = 0;
        sCreated += await createIndex(Service, { businessId: 1, status: 1 }, { name: 'service_business_status' }) ? 1 : 0;
        sCreated += await createIndex(Service, { category: 1, status: 1 }, { name: 'service_category_status' }) ? 1 : 0;
        console.log(`✅ ${sCreated} indexes created/verified`);
        created += sCreated;

        // Businesses  
        console.log('\nBusiness indexes...');
        const Business = db.collection('businesses');
        let bCreated = 0;
        bCreated += await createIndex(Business, { userId: 1 }, { name: 'business_user' }) ? 1 : 0;
        bCreated += await createIndex(Business, { status: 1, createdAt: -1 }, { name: 'business_status_created' }) ? 1 : 0;
        console.log(`✅ ${bCreated} indexes created/verified`);
        created += bCreated;

        // Users
        console.log('\nUser indexes...');
        const User = db.collection('users');
        let uCreated = 0;
        uCreated += await createIndex(User, { roles: 1 }, { name: 'user_roles' }) ? 1 : 0;
        console.log(`✅ ${uCreated} indexes created/verified`);
        created += uCreated;

        // Staff
        console.log('\nStaff indexes...');
        const Staff = db.collection('staff');
        let stCreated = 0;
        stCreated += await createIndex(Staff, { businessId: 1, isActive: 1 }, { name: 'staff_business_active' }) ? 1 : 0;
        console.log(`✅ ${stCreated} indexes created/verified`);
        created += stCreated;

        console.log(`\n✨ Complete! Created ${created} new indexes`);
        console.log('📊 Total performance indexes ready: 10\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createIndexes();
