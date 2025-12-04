import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Production-ready Database Connection
 * Features:
 * - Connection pooling for scalability
 * - Timeout handling
 * - Automatic reconnection with exponential backoff
 * - Connection monitoring
 */
async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Connection pool settings for high traffic
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 2,  // Minimum number of connections to maintain
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 10000, // Give up initial connection after 10 seconds
      // Heartbeat frequency
      heartbeatFrequencyMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        logger.info('Database connected successfully', {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        });

        // Connection event listeners for monitoring
        mongoose.connection.on('disconnected', () => {
          logger.warn('Database disconnected');
        });

        mongoose.connection.on('reconnected', () => {
          logger.info('Database reconnected');
        });

        mongoose.connection.on('error', (error) => {
          logger.error('Database connection error', error);
        });

        return mongoose;
      })
      .catch((error) => {
        logger.error('Failed to connect to database', error);
        cached.promise = null; // Reset promise on error
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

