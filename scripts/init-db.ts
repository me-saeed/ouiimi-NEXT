/**
 * Database Initialization Script
 * Creates all collections and indexes explicitly
 * Run: npx tsx scripts/init-db.ts
 */

import mongoose from "mongoose";

// Environment variables are loaded automatically by Next.js
// For standalone script, ensure MONGODB_URI is set in environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function initializeDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database instance not available");
    }

    console.log(`📊 Database: ${db.databaseName}\n`);

    // Import all models to register them
    console.log("📦 Registering models...");
    await import("../lib/models/User");
    await import("../lib/models/Business");
    await import("../lib/models/Staff");
    await import("../lib/models/Service");
    await import("../lib/models/Booking");
    await import("../lib/models/ForgetPass");
    console.log("✅ All models registered\n");

    // Create collections explicitly
    const collections = [
      { name: "users", model: mongoose.models.User },
      { name: "businesses", model: mongoose.models.Business },
      { name: "staffs", model: mongoose.models.Staff },
      { name: "services", model: mongoose.models.Service },
      { name: "bookings", model: mongoose.models.Booking },
      { name: "forgetpasses", model: mongoose.models.ForgetPass },
    ];

    console.log("🗂️  Creating collections...");
    for (const { name, model } of collections) {
      try {
        // Check if collection exists
        const collectionsList = await db.listCollections({ name }).toArray();
        
        if (collectionsList.length === 0) {
          // Create collection explicitly
          await db.createCollection(name);
          console.log(`  ✅ Created collection: ${name}`);
        } else {
          console.log(`  ℹ️  Collection already exists: ${name}`);
        }

        // Create indexes if model exists
        if (model) {
          try {
            await model.createIndexes();
            const indexes = await db.collection(name).indexes();
            console.log(`  📇 Indexes: ${indexes.length} (${indexes.map((i: any) => Object.keys(i.key || {}).join(", ")).join(", ")})`);
          } catch (indexError: any) {
            console.log(`  ⚠️  Index creation warning: ${indexError.message}`);
          }
        }
      } catch (error: any) {
        console.error(`  ❌ Error with ${name}: ${error.message}`);
      }
    }

    console.log("\n📊 Collection Summary:");
    const allCollections = await db.listCollections().toArray();
    for (const col of allCollections) {
      const count = await db.collection(col.name).countDocuments();
      const indexes = await db.collection(col.name).indexes();
      console.log(`  ${col.name}: ${count} documents, ${indexes.length} indexes`);
    }

    console.log("\n✅ Database initialization complete!");
    console.log("\n💡 You can now view these collections in MongoDB Compass:");
    console.log(`   ${MONGODB_URI.replace(/\/\/.*@/, "//***@")}`);

    await mongoose.connection.close();
    console.log("\n🔌 Connection closed");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Database initialization failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

initializeDatabase();

