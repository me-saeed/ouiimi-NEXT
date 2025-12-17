// Simple admin user creation script
// Run with: node scripts/create-admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
    }
});

const ADMIN_EMAIL = "ouiimi@adminempire";
const ADMIN_USERNAME = "ouiimi@adminempire";
const ADMIN_PASSWORD = "HairCutforJhons";

async function createAdmin() {
    try {
        console.log('\n🔧 Starting admin user creation...\n');

        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in .env.local');
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Define User schema inline
        const userSchema = new mongoose.Schema({
            fname: String,
            lname: String,
            email: { type: String, lowercase: true },
            username: { type: String, lowercase: true },
            password: String,
            Roles: [String],
            isEnable: String,
            verify: String,
            counterId: Number,
            pic: String,
            following: Number,
            follower: Number,
            sellerPoints: Number,
            date: Date,
        }, { timestamps: true });

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Check if admin exists
        const existingAdmin = await User.findOne({
            $or: [
                { email: ADMIN_EMAIL.toLowerCase() },
                { username: ADMIN_USERNAME.toLowerCase() }
            ]
        });

        if (existingAdmin) {
            console.log('👤 Admin user found:', existingAdmin.email);
            console.log('🔄 Updating admin user...\n');

            // Hash new password
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

            // Update
            existingAdmin.password = hashedPassword;
            existingAdmin.Roles = ["user", "admin"];
            existingAdmin.isEnable = "yes";
            existingAdmin.verify = "yes";

            await existingAdmin.save();
            console.log('✅ Admin user updated successfully!\n');
        } else {
            console.log('👤 Admin user not found');
            console.log('🆕 Creating new admin user...\n');

            // Hash password
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

            // Get next counter ID
            const lastUser = await User.findOne().sort({ counterId: -1 });
            const nextCounterId = lastUser ? lastUser.counterId + 1 : 1;

            // Create admin
            const adminUser = new User({
                fname: "Admin",
                lname: "Empire",
                email: ADMIN_EMAIL.toLowerCase(),
                username: ADMIN_USERNAME.toLowerCase(),
                password: hashedPassword,
                Roles: ["user", "admin"],
                isEnable: "yes",
                verify: "yes",
                counterId: nextCounterId,
                pic: "avatar.png",
                following: 0,
                follower: 0,
                sellerPoints: 0,
                date: new Date(),
            });

            await adminUser.save();
            console.log('✅ Admin user created successfully!\n');
        }

        console.log('═══════════════════════════════════');
        console.log('  🎉 ADMIN CREDENTIALS  ');
        console.log('═══════════════════════════════════');
        console.log(`  Email/Username: ${ADMIN_EMAIL}`);
        console.log(`  Password: ${ADMIN_PASSWORD}`);
        console.log(`  Dashboard: /admin/dashboard`);
        console.log('═══════════════════════════════════\n');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        console.log('🎊 Admin setup complete!\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createAdmin();
