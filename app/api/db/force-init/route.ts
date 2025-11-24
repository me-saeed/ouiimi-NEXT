import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

// Import all models to register them
import "@/lib/models/User";
import "@/lib/models/Business";
import "@/lib/models/Staff";
import "@/lib/models/Service";
import "@/lib/models/Booking";
import "@/lib/models/ForgetPass";

export async function POST(req: NextRequest) {
  try {
    console.log("🔌 Connecting to MongoDB...");
    const connection = await dbConnect();
    
    if (!connection || connection.connection.readyState !== 1) {
      return NextResponse.json(
        { error: "Database not connected", readyState: connection?.connection.readyState },
        { status: 503 }
      );
    }

    const db = connection.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: "Database instance not available" },
        { status: 503 }
      );
    }

    console.log(`📊 Database: ${db.databaseName}\n`);

    // Force create collections and indexes
    const collections = [
      { name: "users", model: mongoose.models.User },
      { name: "businesses", model: mongoose.models.Business },
      { name: "staffs", model: mongoose.models.Staff },
      { name: "services", model: mongoose.models.Service },
      { name: "bookings", model: mongoose.models.Booking },
      { name: "forgetpasses", model: mongoose.models.ForgetPass },
    ];

    const results: any[] = [];

    for (const { name, model } of collections) {
      try {
        // Force create collection by inserting and deleting a dummy document
        const collection = db.collection(name);
        
        // Check if collection exists
        const collectionsList = await db.listCollections({ name }).toArray();
        
        if (collectionsList.length === 0) {
          // Create collection by inserting a temporary document
          await collection.insertOne({ _temp: true, createdAt: new Date() });
          await collection.deleteOne({ _temp: true });
          results.push({ collection: name, status: "created" });
        } else {
          results.push({ collection: name, status: "exists" });
        }

        // Force create indexes if model exists
        if (model) {
          try {
            await model.createIndexes();
            const indexes = await collection.indexes();
            results[results.length - 1].indexes = indexes.length;
            results[results.length - 1].indexNames = indexes.map((i: any) => 
              Object.keys(i.key || {}).join("+")
            );
          } catch (indexError: any) {
            results[results.length - 1].indexError = indexError.message;
          }
        }
      } catch (error: any) {
        results.push({ collection: name, status: "error", error: error.message });
      }
    }

    // Get final collection summary
    const allCollections = await db.listCollections().toArray();
    const summary: Record<string, any> = {};
    for (const col of allCollections) {
      const count = await db.collection(col.name).countDocuments();
      const indexes = await db.collection(col.name).indexes();
      summary[col.name] = {
        documents: count,
        indexes: indexes.length,
      };
    }

    return NextResponse.json(
      {
        success: true,
        message: "Database collections force-initialized",
        database: db.databaseName,
        collections: results,
        summary,
        note: "Refresh MongoDB Compass to see the collections",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

