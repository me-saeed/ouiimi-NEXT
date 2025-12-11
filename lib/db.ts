/**
 * =============================================================================
 * DATABASE CONNECTION - lib/db.ts
 * =============================================================================
 * 
 * This file handles the MongoDB connection using Mongoose ODM.
 * It implements connection pooling and caching for optimal performance.
 * 
 * HOW IT WORKS:
 * 1. First call to dbConnect() creates a new MongoDB connection
 * 2. Connection is cached in global variable (survives hot reloads in dev)
 * 3. Subsequent calls return the cached connection (no new connections)
 * 4. Connection pool maintains 2-10 simultaneous connections
 * 
 * USAGE IN API ROUTES:
 *   import dbConnect from "@/lib/db";
 *   await dbConnect();  // Always call this before any DB operation
 *   const users = await User.find();  // Now you can query
 */

import mongoose from "mongoose";
import { logger } from "./logger";

// Get MongoDB connection string from environment variables
// This should be set in .env.local file like:
// MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
const MONGODB_URI = process.env.MONGODB_URI;

// Throw error immediately if no connection string is configured
// This prevents the app from starting with broken database config
if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Interface for caching the MongoDB connection
 * - conn: The actual mongoose connection object
 * - promise: A promise that resolves to the connection (for async handling)
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Extend the global namespace to include our mongoose cache
 * This allows the connection to persist across hot reloads in development
 * Without this, Next.js would create a new connection on every file change
 */
declare global {
  var mongoose: MongooseCache | undefined;
}

// Initialize cache from global (if exists) or create empty cache
// This is the key to connection reuse!
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Store in global for persistence across hot reloads
if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * =============================================================================
 * dbConnect() - Main Database Connection Function
 * =============================================================================
 * 
 * This is the ONLY function you need to call before any database operation.
 * It returns the mongoose instance which you can use to check connection status.
 * 
 * FEATURES:
 * - Connection pooling (2-10 simultaneous connections)
 * - Automatic reconnection on disconnect
 * - Timeout handling (10 second initial connection timeout)
 * - Event monitoring for connection state changes
 * 
 * HOW CONNECTION POOLING WORKS:
 * - minPoolSize: 2  → Always keep 2 connections ready
 * - maxPoolSize: 10 → Never exceed 10 connections
 * - When a query runs, it uses an available connection from the pool
 * - After query completes, connection returns to pool (not closed)
 * - This is MUCH faster than opening/closing connections for each query
 * 
 * @returns Promise<typeof mongoose> - The mongoose instance
 */
async function dbConnect(): Promise<typeof mongoose> {
  // STEP 1: Check if we already have a connection
  // If cached.conn exists, we're already connected - just return it!
  if (cached.conn) {
    return cached.conn;
  }

  // STEP 2: Check if a connection is currently being established
  // If not, start creating a new connection
  if (!cached.promise) {
    // MongoDB connection options for optimal performance
    // Optimized for 5,000+ concurrent users
    const opts = {
      bufferCommands: false,           // Don't buffer commands if disconnected (fail fast)
      maxPoolSize: 50,                 // Maximum 50 connections in pool (was 10)
      minPoolSize: 10,                 // Always keep 10 connections ready (was 2)
      socketTimeoutMS: 45000,          // Close inactive connections after 45 seconds
      serverSelectionTimeoutMS: 10000, // Give up initial connection after 10 seconds
      heartbeatFrequencyMS: 10000,     // Check server status every 10 seconds
      maxIdleTimeMS: 30000,            // Close idle connections after 30 seconds
    };

    // Start the connection process
    // mongoose.connect() returns a Promise that resolves when connected
    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        // Connection successful! Log the details
        logger.info('Database connected successfully', {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        });

        // Set up event listeners to monitor connection health
        // These help with debugging and monitoring in production

        // 'disconnected' - Connection was lost (network issue, server down)
        mongoose.connection.on('disconnected', () => {
          logger.warn('Database disconnected');
        });

        // 'reconnected' - Connection was restored automatically
        mongoose.connection.on('reconnected', () => {
          logger.info('Database reconnected');
        });

        // 'error' - An error occurred on the connection
        mongoose.connection.on('error', (error) => {
          logger.error('Database connection error', error);
        });

        return mongoose;
      })
      .catch((error) => {
        // Connection failed! Log error and reset promise
        // Resetting promise allows retry on next dbConnect() call
        logger.error('Failed to connect to database', error);
        cached.promise = null;
        throw error;
      });
  }

  // STEP 3: Wait for the connection promise to resolve
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If connection fails, reset promise for retry
    cached.promise = null;
    throw e;
  }

  // Return the connected mongoose instance
  return cached.conn;
}

export default dbConnect;
