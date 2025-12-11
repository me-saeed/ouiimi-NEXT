/**
 * =============================================================================
 * BUSINESS MODEL - lib/models/Business.ts
 * =============================================================================
 * 
 * This model represents a business account that can offer services.
 * Each user can own one business (1:1 relationship enforced by unique index).
 * 
 * KEY RELATIONSHIPS:
 * - Business → User (owned by one user via userId)
 * - Business → Service (has many services)
 * - Business → Staff (has many staff members)
 * - Business → Booking (receives bookings)
 * 
 * APPROVAL FLOW:
 * 1. User registers business → status: "pending" (or "approved" for testing)
 * 2. Admin reviews → status: "approved" or "rejected"
 * 3. Only "approved" businesses can have their services listed
 * 
 * HOW BUSINESSES ARE FETCHED:
 *   // Find business by user ID (for dashboard)
 *   const business = await Business.findOne({ userId: userId });
 * 
 *   // Find by ID and include user info
 *   const business = await Business.findById(id).populate("userId", "fname lname email");
 * 
 *   // Find all approved businesses
 *   const businesses = await Business.find({ status: "approved" });
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * IBusiness - Business document interface
 */
export interface IBusiness extends Document {
  userId: mongoose.Types.ObjectId;    // Reference to User who owns this business
  businessName: string;               // Display name of the business
  email: string;                      // Business contact email
  phone?: string;                     // Optional phone number
  address: string;                    // Business address
  logo?: string;                      // Logo image URL
  story?: string;                     // About/description text
  status: "pending" | "approved" | "rejected";  // Approval status
  bankDetails?: {                     // Bank details for payment release
    name?: string;                    // Account holder name
    bsb?: string;                     // BSB number (Australia)
    accountNumber?: string;           // Bank account number
    contactNumber?: string;           // Contact phone
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Business Schema
 */
const businessSchema = new Schema<IBusiness>(
  {
    // Reference to the user who owns this business
    // 'ref: "User"' enables .populate("userId") to fetch user data
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Business name - must be unique (enforced by separate index)
    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    // Business email
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Optional contact number
    phone: {
      type: String,
      trim: true,
    },

    // Business address (full text)
    address: {
      type: String,
      required: true,
      trim: true,
    },

    // Logo URL (optional)
    logo: {
      type: String,
      default: null,
    },

    // Business story/about section
    story: {
      type: String,
      default: null,
    },

    // Approval status for the business
    // "pending" - Waiting for admin approval
    // "approved" - Can list services
    // "rejected" - Cannot use platform
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Bank details for receiving payments
    // Admin releases funds to this account after service completion
    bankDetails: {
      name: { type: String, trim: true },
      bsb: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      contactNumber: { type: String, trim: true },
    },
  },
  {
    timestamps: true,  // Adds createdAt, updatedAt
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Each user can only have ONE business (unique constraint)
businessSchema.index({ userId: 1 }, { unique: true });

// For searching by business name
businessSchema.index({ businessName: 1 });

// For filtering by status (admin dashboard)
businessSchema.index({ status: 1 });

// =============================================================================
// MODEL EXPORT
// =============================================================================

const Business: Model<IBusiness> =
  mongoose.models.Business || mongoose.model<IBusiness>("Business", businessSchema);

export default Business;
