// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Polyfill for Next.js Web APIs (Request, Response, etc.)
import { TextEncoder, TextDecoder } from "util";
import { fetch, Request, Response, Headers } from "undici";
import { MongoMemoryServer } from "mongodb-memory-server";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

// Setup in-memory MongoDB for tests
let mongoServer;
const mongoose = require("mongoose");

beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set MongoDB URI for tests
  process.env.MONGODB_URI = mongoUri;
  
  // Connect to the in-memory database
  const { default: dbConnect } = await import("@/lib/db");
  await dbConnect();
});

afterAll(async () => {
  // Close all mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Stop the in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  // Force close any remaining connections
  await mongoose.disconnect();
});

// Mock environment variables for tests
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-nextauth-secret";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
process.env.MAILJET_API_KEY = process.env.MAILJET_API_KEY || "test-key";
process.env.MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY || "test-secret";
