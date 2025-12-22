/**
 * =============================================================================
 * DATABASE INDEXES SETUP
 * =============================================================================
 * 
 * Critical indexes for production performance at scale.
 * Run this script once during deployment to create indexes.
 * 
 * Usage: node scripts/create-indexes.js
 */

import mongoose from 'mongoose';
import dbConnect from '../lib/db';

async function createIndexes() {
    console.log('🔧 Creating database indexes...\n');

    try {
        await dbConnect();

        // =========================================================================
        // BOOKINGS INDEXES
        // =========================================================================
        const Booking = mongoose.connection.collection('bookings');

        await Booking.createIndex({ userId: 1, status: 1 });
        console.log('✅ Created index: bookings.userId + status');

        await Booking.createIndex({ businessId: 1, status: 1 });
        console.log('✅ Created index: bookings.businessId + status');

        await Booking.createIndex({ 'timeSlot.date': 1 });
        console.log('✅ Created index: bookings.timeSlot.date');

        await Booking.createIndex({ bookingNumber: 1 }, { unique: true });
        console.log('✅ Created index: bookings.bookingNumber (unique)');

        await Booking.createIndex({ adminPaymentStatus: 1, paymentReleasedAt: -1 });
        console.log('✅ Created index: bookings.adminPaymentStatus + paymentReleasedAt');

        // =========================================================================
        // SERVICES INDEXES
        // =========================================================================
        const Service = mongoose.connection.collection('services');

        await Service.createIndex({ businessId: 1, status: 1 });
        console.log('✅ Created index: services.businessId + status');

        await Service.createIndex({ category: 1, status: 1 });
        console.log('✅ Created index: services.category + status');

        await Service.createIndex({ 'address.location': '2dsphere' });
        console.log('✅ Created index: services.address.location (geospatial)');

        // =========================================================================
        // BUSINESSES INDEXES
        // =========================================================================
        const Business = mongoose.connection.collection('businesses');

        await Business.createIndex({ userId: 1 });
        console.log('✅ Created index: businesses.userId');

        await Business.createIndex({ status: 1, createdAt: -1 });
        console.log('✅ Created index: businesses.status + createdAt');

        // =========================================================================
        // USERS INDEXES
        // =========================================================================
        const User = mongoose.connection.collection('users');

        await User.createIndex({ email: 1 }, { unique: true });
        console.log('✅ Created index: users.email (unique)');

        await User.createIndex({ roles: 1 });
        console.log('✅ Created index: users.roles');

        // =========================================================================
        // STAFF INDEXES
        // =========================================================================
        const Staff = mongoose.connection.collection('staff');

        await Staff.createIndex({ businessId: 1, isActive: 1 });
        console.log('✅ Created index: staff.businessId + isActive');

        console.log('\n✨ All indexes created successfully!');
        console.log('\n📊 Index Summary:');
        console.log('   Bookings: 5 indexes');
        console.log('   Services: 3 indexes');
        console.log('   Businesses: 2 indexes');
        console.log('   Users: 2 indexes');
        console.log('   Staff: 1 index');
        console.log('   Total: 13 indexes\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createIndexes();
}

export default createIndexes;
