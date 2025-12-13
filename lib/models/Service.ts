/**
 * =============================================================================
 * SERVICE MODEL - lib/models/Service.ts
 * =============================================================================
 * 
 * This model represents a service offered by a business (e.g., "Haircut", "Massage").
 * Services are the core bookable items in the application.
 * 
 * KEY RELATIONSHIPS:
 * - Service → Business (belongs to one business via businessId)
 * - Service → Staff (many staff can be assigned via timeSlots.staffIds)
 * - Service → Booking (when booked, timeSlot.bookingId points to the booking)
 * 
 * HOW SERVICES ARE FETCHED:
 *   // Basic query - get all services for a category
 *   const services = await Service.find({ category: "Hair Services" });
 * 
 *   // With populated business data
 *   const services = await Service.find({ category: "Hair Services" })
 *     .populate("businessId", "businessName logo");
 * 
 *   // Geospatial query - find services within 15km
 *   const services = await Service.aggregate([
 *     { $geoNear: { near: [longitude, latitude], maxDistance: 15000 } }
 *   ]);
 */

import mongoose, { Schema, Document, Model } from "mongoose";

// =============================================================================
// INTERFACES - TypeScript types for type safety
// =============================================================================

/**
 * ITimeSlot - Represents an available time slot for booking
 * 
 * Each service can have multiple time slots (e.g., 9am-10am on Monday, 2pm-3pm on Tuesday)
 * When a customer books, we mark isBooked=true and store the bookingId
 */
export interface ITimeSlot {
  date: Date;                              // The date of this slot (e.g., 2024-12-15)
  startTime: string;                       // Start time in 24h format (e.g., "09:00")
  endTime: string;                         // End time in 24h format (e.g., "10:00")
  price: number;                           // Price for this slot (can vary by time/day)
  duration: number;                        // Duration in minutes (computed from start/end)
  staffIds: mongoose.Types.ObjectId[];     // Staff members assigned to this slot
  addOns?: IAddOn[];                       // specific add-ons for this slot
  isBooked: boolean;                       // TRUE when slot is reserved
  bookingId?: mongoose.Types.ObjectId;     // Reference to the Booking if booked
}

/**
 * IAddOn - Optional extras that can be added to a service
 * Example: "Deep conditioning treatment" +$15 for a haircut
 */
export interface IAddOn {
  name: string;    // Name of the add-on
  cost: number;    // Additional cost
}

/**
 * IService - Main service document interface
 * Extends Mongoose Document for database operations
 */
export interface IService extends Document {
  businessId: mongoose.Types.ObjectId;     // Which business owns this service
  category: string;                        // Main category (e.g., "Hair Services")
  subCategory?: string;                    // Sub-category (e.g., "Haircut", "Colouring")
  serviceName: string;                     // Name of the service
  description?: string;                    // Detailed description
  address: {
    street: string;                        // Full address text
    location: {
      type: "Point";                       // GeoJSON type for location
      coordinates: [number, number];       // [longitude, latitude] for geo queries
    };
  };
  addOns: IAddOn[];                        // Available add-ons
  timeSlots: ITimeSlot[];                  // All available time slots
  defaultStaffIds: mongoose.Types.ObjectId[]; // Default staff for new slots
  status: "listed" | "booked" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SCHEMAS - Define the structure of documents in MongoDB
// =============================================================================

/**
 * TimeSlot Sub-Schema
 * _id: false means time slots don't get their own _id (they're embedded)
 */
/**
 * AddOn Sub-Schema
 */
const addOnSchema = new Schema<IAddOn>(
  {
    name: { type: String, required: true },
    cost: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * TimeSlot Sub-Schema
 * _id: false means time slots don't get their own _id (they're embedded)
 */
const timeSlotSchema = new Schema<ITimeSlot>(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 0 },
    staffIds: [{ type: Schema.Types.ObjectId, ref: "Staff" }],
    addOns: { type: [addOnSchema], default: [] },
    isBooked: { type: Boolean, default: false },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
  },
  { _id: false }  // No separate _id for embedded documents
);

/**
 * Main Service Schema
 * This defines how service documents are stored in MongoDB
 */
const serviceSchema = new Schema<IService>(
  {
    // Reference to the owning business
    // 'ref: "Business"' enables .populate("businessId") to fetch business data
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    // Category for filtering (e.g., "Hair Services", "Massage & Wellness")
    category: {
      type: String,
      required: true,
      trim: true,  // Remove whitespace from both ends
    },

    // Optional sub-category for more specific filtering
    subCategory: {
      type: String,
      trim: true,
    },

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: null,
    },

    // Address with geospatial location for "services near me" queries
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      // GeoJSON Point for 2dsphere index (enables geo queries)
      location: {
        type: {
          type: String,
          enum: ["Point"],  // Only "Point" is allowed
          required: true,
        },
        coordinates: {
          type: [Number],   // [longitude, latitude]
          required: true,
          // Validate coordinates are within valid ranges
          validate: {
            validator: function (v: number[]) {
              return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
            },
            message: "Coordinates must be [longitude, latitude] with valid ranges",
          },
        },
      },
    },

    // Array of add-on options
    addOns: {
      type: [addOnSchema],
      default: [],
    },

    // Array of bookable time slots
    timeSlots: {
      type: [timeSlotSchema],
      default: [],
    },

    // Default staff assigned to new slots
    defaultStaffIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Staff" }],
      default: [],
    },

    // Service status
    status: {
      type: String,
      enum: ["listed", "booked", "completed", "cancelled"],
      default: "listed",
    },
  },
  {
    timestamps: true,  // Automatically add createdAt and updatedAt fields
  }
);

// =============================================================================
// INDEXES - Speed up common queries
// =============================================================================

/**
 * Indexes make queries MUCH faster (100x or more for large collections)
 * 
 * Example: Without index, finding services by category scans ALL documents
 *         With index, MongoDB jumps directly to matching documents
 */

// For finding services by business and status (e.g., business dashboard)
serviceSchema.index({ businessId: 1, status: 1 });

// For filtering by category and subcategory (e.g., browse services page)
serviceSchema.index({ category: 1, subCategory: 1 });

// For public listing queries (e.g., homepage)
serviceSchema.index({ status: 1 });

// 2dsphere index enables geospatial queries like "find services within 15km"
// This is REQUIRED for $geoNear aggregation to work
serviceSchema.index({ "address.location": "2dsphere" });

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * Export the Service model
 * 
 * mongoose.models.Service || ... - This pattern prevents model recompilation
 * during hot reloads in development. If model already exists, use it.
 */
const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", serviceSchema);

export default Service;
