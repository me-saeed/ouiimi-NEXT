/**
 * =============================================================================
 * STAFF MODEL - lib/models/Staff.ts
 * =============================================================================
 * 
 * This model represents a staff member who works at a business.
 * Staff members can be assigned to specific time slots in services.
 * 
 * KEY RELATIONSHIPS:
 * - Staff → Business (belongs to one business via businessId)
 * - Staff → Service.timeSlots (assigned to slots via staffIds array)
 * - Staff → Booking (optional assignment via staffId)
 * 
 * HOW STAFF ARE USED:
 * 1. Business creates staff members
 * 2. When creating services, staff are assigned to time slots
 * 3. Customers can see which staff will provide the service
 * 
 * HOW STAFF ARE FETCHED:
 *   // Get all staff for a business
 *   const staff = await Staff.find({ businessId, isActive: true })
 *     .sort({ createdAt: -1 });
 * 
 *   // Get specific staff member
 *   const staffMember = await Staff.findById(staffId);
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * IStaff - Staff document interface
 */
export interface IStaff extends Document {
  businessId: mongoose.Types.ObjectId;   // Business this staff belongs to
  name: string;                          // Staff member's name
  photo?: string;                        // Profile photo URL
  qualifications?: string;               // Qualifications/certifications
  about?: string;                        // Bio/about text
  isActive: boolean;                     // Is staff active/available?
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Staff Schema
 */
const staffSchema = new Schema<IStaff>(
  {
    // Reference to the business
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    // Staff member's display name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Profile photo URL (optional)
    photo: {
      type: String,
      default: null,
    },

    // Qualifications text (e.g., "Licensed Barber, 5 years experience")
    qualifications: {
      type: String,
      default: null,
    },

    // About/bio text
    about: {
      type: String,
      default: null,
    },

    // Active status - inactive staff don't appear in listings
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,  // Adds createdAt, updatedAt
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// For fetching active staff by business
staffSchema.index({ businessId: 1, isActive: 1 });

// =============================================================================
// MODEL EXPORT
// =============================================================================

const Staff: Model<IStaff> =
  mongoose.models.Staff || mongoose.model<IStaff>("Staff", staffSchema);

export default Staff;
