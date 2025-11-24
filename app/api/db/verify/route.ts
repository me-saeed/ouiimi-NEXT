import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

// Import all models to ensure they're registered
import "@/lib/models/User";
import "@/lib/models/Business";
import "@/lib/models/Staff";
import "@/lib/models/Service";
import "@/lib/models/Booking";
import "@/lib/models/ForgetPass";

export async function GET(req: NextRequest) {
  try {
    // Connect to database
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

    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    // Expected collections (Mongoose pluralizes model names)
    const expectedCollections = [
      "users",
      "businesses",
      "staffs",
      "services",
      "bookings",
      "forgetpasses",
    ];

    // Check which collections exist
    const existingCollections = expectedCollections.filter((name) =>
      collectionNames.includes(name)
    );
    const missingCollections = expectedCollections.filter(
      (name) => !collectionNames.includes(name)
    );

    // Get model schemas
    const models = mongoose.models;
    const modelNames = Object.keys(models);

    // Get collection stats
    const collectionStats: Record<string, any> = {};
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        const indexes = await collection.indexes();
        collectionStats[collectionName] = {
          count,
          indexes: indexes.length,
          indexNames: indexes.map((idx) => Object.keys(idx.key || {})).flat(),
        };
      } catch (err) {
        collectionStats[collectionName] = { error: "Failed to get stats" };
      }
    }

    return NextResponse.json(
      {
        connected: true,
        database: db.databaseName,
        readyState: connection.connection.readyState,
        collections: {
          all: collectionNames,
          expected: expectedCollections,
          existing: existingCollections,
          missing: missingCollections,
        },
        models: {
          registered: modelNames,
          count: modelNames.length,
        },
        stats: collectionStats,
        message: missingCollections.length === 0
          ? "All expected collections exist"
          : `Missing collections: ${missingCollections.join(", ")}. They will be created automatically when first document is inserted.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Database verification error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify database",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

