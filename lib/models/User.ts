/**
 * =============================================================================
 * USER MODEL - lib/models/User.ts
 * =============================================================================
 * 
 * This model represents a user account in the system.
 * Users can be shoppers (customers) who book services.
 * 
 * KEY RELATIONSHIPS:
 * - User → Business (a user can own one business via Business.userId)
 * - User → Booking (users create bookings)
 * 
 * AUTHENTICATION FLOW:
 * 1. Signup: Create user with hashed password, generate JWT token
 * 2. Signin: Verify password, generate new JWT token
 * 3. All subsequent requests: JWT token in Authorization header
 * 
 * HOW USERS ARE FETCHED:
 *   // Find by ID
 *   const user = await User.findById(userId);
 * 
 *   // Find by email or username (for login)
 *   const user = await User.findOne({
 *     $or: [
 *       { email: inputEmail.toLowerCase() },
 *       { username: inputUsername.toLowerCase() }
 *     ]
 *   });
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * IUser - User document interface
 * All fields that a user document can have
 */
export interface IUser extends Document {
  fname: string;              // First name
  lname: string;              // Last name
  email: string;              // Email (unique, used for login)
  username: string;           // Username (unique, used for login)
  password: string;           // Hashed password (never store plain text!)
  address?: string;           // Optional address
  contactNo?: string;         // Optional phone number
  pic?: string;               // Profile picture URL
  isEnable: string;           // "yes" or "no" - account enabled status
  Roles: string[];            // User roles (e.g., ["user"], ["admin"])
  token?: string;             // Current JWT token (optional)
  following?: number;         // Number of users following (social feature)
  follower?: number;          // Number of followers (social feature)
  sellerPoints?: number;      // Points for sellers (rewards feature)
  expotoken?: string;         // Expo push notification token
  verify: string;             // "yes" or "no" - email verified
  counterId: number;          // Unique counter ID
  date: Date;                 // Registration date
  oauthProvider?: string;     // OAuth provider (e.g., "google", "facebook")
  oauthId?: string;           // OAuth provider's user ID
  location?: {
    type: "Point";
    coordinates: number[];
  };
}

/**
 * User Schema - Defines document structure in MongoDB
 */
const userSchema = new Schema<IUser>(
  {
    // Required fields
    fname: { type: String, required: true },
    lname: { type: String, required: true },

    // Email is required, unique, and always stored lowercase
    email: {
      type: String,
      required: true,
      unique: true,     // Creates unique index automatically
      lowercase: true   // Converts to lowercase before saving
    },

    // Username is unique but sparse (allows null for OAuth users)
    username: {
      type: String,
      unique: true,
      sparse: true,     // Allows multiple null values (for OAuth)
      lowercase: true
    },

    // Password - can be null for OAuth users
    password: { type: String },

    // Optional profile fields
    address: { type: String, default: null },
    contactNo: { type: String, default: null },
    pic: { type: String, default: "avatar.png" },

    // Account status
    isEnable: { type: String, default: "yes" },   // "yes" = active
    Roles: { type: [String], default: ["user"] }, // Default role is "user"

    // JWT token for authentication
    token: { type: String },

    // Social features (not actively used in current version)
    following: { type: Number, default: 0 },
    follower: { type: Number, default: 0 },
    sellerPoints: { type: Number, default: 0 },

    // Push notifications
    expotoken: { type: String, default: null },

    // Email verification status
    verify: { type: String, default: "yes" },  // Auto-verified for now

    // Counter for unique user IDs
    counterId: { type: Number },

    // Registration timestamp
    date: { type: Date, default: Date.now },

    // OAuth fields for Google/Facebook login
    oauthProvider: { type: String },  // "google" or "facebook"
    oauthId: { type: String },        // Provider's unique user ID

    // GeoJSON location for geospatial queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
  },
  {
    timestamps: true,  // Adds createdAt and updatedAt automatically
  }
);

// =============================================================================
// INDEXES
// =============================================================================

/**
 * Unique compound index for OAuth users
 * This ensures the same OAuth user doesn't get duplicate accounts
 * sparse: true allows multiple users with null oauthProvider/oauthId
 */
userSchema.index(
  { oauthProvider: 1, oauthId: 1 },
  { unique: true, sparse: true }
);

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * User Model
 * The || pattern prevents model recompilation on hot reload
 */
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
