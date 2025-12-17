/**
 * Database Migration Script: Set Admin Roles
 * 
 * This script updates specific users to have admin role in their Roles array.
 * 
 * Usage:
 *   node scripts/set-admin-role.js <email1> <email2> ...
 * 
 * Example:
 *   node scripts/set-admin-role.js admin@ouiimi.com saeed@ouiimi.com
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDB User schema (simplified for migration)
const UserSchema = new mongoose.Schema({
    email: String,
    fname: String,
    lname: String,
    Roles: [String],
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function setAdminRole(emails) {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully\n');

        const results = [];

        for (const email of emails) {
            console.log(`Processing: ${email}`);

            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                console.log(`  ❌ User not found: ${email}\n`);
                results.push({ email, status: 'not_found' });
                continue;
            }

            // Get current roles
            const currentRoles = user.Roles || ['user'];

            // Add admin role if not already present
            if (currentRoles.includes('admin')) {
                console.log(`  ℹ️  Already has admin role: ${user.fname} ${user.lname}`);
                console.log(`     Current roles: ${currentRoles.join(', ')}\n`);
                results.push({ email, status: 'already_admin', user: `${user.fname} ${user.lname}` });
                continue;
            }

            // Add admin role
            const newRoles = [...currentRoles, 'admin'];
            user.Roles = newRoles;
            await user.save();

            console.log(`  ✅ Admin role added: ${user.fname} ${user.lname}`);
            console.log(`     Previous roles: ${currentRoles.join(', ')}`);
            console.log(`     New roles: ${newRoles.join(', ')}\n`);

            results.push({
                email,
                status: 'updated',
                user: `${user.fname} ${user.lname}`,
                oldRoles: currentRoles,
                newRoles: newRoles
            });
        }

        console.log('\n=== SUMMARY ===');
        console.log(`Total processed: ${emails.length}`);
        console.log(`Updated: ${results.filter(r => r.status === 'updated').length}`);
        console.log(`Already admin: ${results.filter(r => r.status === 'already_admin').length}`);
        console.log(`Not found: ${results.filter(r => r.status === 'not_found').length}`);

        console.log('\n=== DETAILS ===');
        results.forEach(r => {
            if (r.status === 'updated') {
                console.log(`✅ ${r.email} (${r.user}) - Roles updated`);
            } else if (r.status === 'already_admin') {
                console.log(`ℹ️  ${r.email} (${r.user}) - Already admin`);
            } else {
                console.log(`❌ ${r.email} - User not found`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Parse command line arguments
const emails = process.argv.slice(2);

if (emails.length === 0) {
    console.log('Usage: node scripts/set-admin-role.js <email1> <email2> ...');
    console.log('\nExample:');
    console.log('  node scripts/set-admin-role.js admin@ouiimi.com saeed@ouiimi.com');
    process.exit(1);
}

console.log('=== Set Admin Role Script ===');
console.log(`Emails to process: ${emails.join(', ')}\n`);

setAdminRole(emails);
