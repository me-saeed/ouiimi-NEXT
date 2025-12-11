/**
 * =============================================================================
 * BOOKING MODEL - lib/models/Booking.ts
 * =============================================================================
 * 
 * This model represents a booking made by a customer for a service.
 * Bookings track the entire lifecycle from creation to completion/cancellation.
 * 
 * KEY RELATIONSHIPS:
 * - Booking → User (the customer who booked, via userId)
 * - Booking → Business (the business providing the service)
 * - Booking → Service (the actual service being booked)
 * - Booking → Staff (optional: specific staff member assigned)
 * 
 * BOOKING LIFECYCLE:
 * 1. Created → status: "pending", paymentStatus: "pending"
 * 2. Deposit paid → paymentStatus: "deposit_paid", status: "confirmed"
 * 3. Service completed → paymentStatus: "fully_paid", status: "completed"
 * 4. OR cancelled → status: "cancelled"
 * 
 * PAYMENT FLOW:
 * - totalCost = slot price + add-ons
 * - depositAmount = 10% of totalCost
 * - platformFee = $1.99 (ouiimi fee)
 * - remainingAmount = totalCost - depositAmount (paid at venue)
 * - Customer pays: depositAmount + platformFee online
 * - Customer pays: remainingAmount at venue
 * 
 * HOW BOOKINGS ARE FETCHED:
 *   // Get user's bookings
 *   const bookings = await Booking.find({ userId })
 *     .populate("serviceId")
 *     .populate("businessId")
 *     .sort({ createdAt: -1 });
 * 
 *   // Get business's bookings
 *   const bookings = await Booking.find({ businessId })
 *     .populate("userId", "fname lname email")
 *     .populate("serviceId");
 * 
 *   // Get booking by ID with all related data
 *   const booking = await Booking.findById(id)
 *     .populate("userId", "fname lname email")
 *     .populate("businessId", "businessName logo")
 *     .populate("serviceId", "serviceName category");
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * IBooking - Booking document interface
 */
export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;           // Customer who made the booking
  businessId: mongoose.Types.ObjectId;       // Business receiving the booking
  serviceId: mongoose.Types.ObjectId;        // Service being booked
  staffId?: mongoose.Types.ObjectId;         // Optional: specific staff assigned
  timeSlot: {                                // The booked time slot
    date: Date;
    startTime: string;
    endTime: string;
  };
  addOns?: Array<{                           // Selected add-ons
    name: string;
    cost: number;
  }>;
  totalCost: number;                         // Full service cost
  depositAmount: number;                     // 10% deposit (paid online)
  remainingAmount: number;                   // Amount due at venue
  status: "pending" | "confirmed" | "completed" | "cancelled" | "refunded";
  paymentStatus: "pending" | "deposit_paid" | "fully_paid" | "refunded";
  adminPaymentStatus?: "pending" | "released"; // For admin to release funds
  platformFee?: number;                      // ouiimi's fee ($1.99)
  serviceAmount?: number;                    // Amount after platform fee
  paymentIntentId?: string;                  // Stripe session/payment intent ID
  customerNotes?: string;                    // Notes from customer
  businessNotes?: string;                    // Notes from business
  cancelledAt?: Date;                        // When booking was cancelled
  cancellationReason?: string;               // Why it was cancelled
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking Schema
 */
const bookingSchema = new Schema<IBooking>(
  {
    // Reference to the customer (User)
    // This is indexed for fast "my bookings" queries
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,  // Create index for fast queries by userId
    },

    // Reference to the business
    // Indexed for business dashboard queries
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    // Reference to the service
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    // Optional: specific staff member
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },

    // The time slot that was booked
    // This is a snapshot of the slot at booking time
    timeSlot: {
      date: { type: Date, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },

    // Selected add-ons with their costs
    addOns: [
      {
        name: { type: String, required: true },
        cost: { type: Number, required: true, min: 0 },
      },
    ],

    // Total cost of service + add-ons
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },

    // Deposit = 10% of total (paid online via Stripe)
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Remaining = 90% of total (paid at venue)
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Booking status
    // "pending" → just created, waiting for payment
    // "confirmed" → deposit paid, booking is active
    // "completed" → service was delivered
    // "cancelled" → booking was cancelled
    // "refunded" → payment was refunded
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "refunded"],
      default: "pending",
      index: true,  // Indexed for filtering by status
    },

    // Payment status tracking
    paymentStatus: {
      type: String,
      enum: ["pending", "deposit_paid", "fully_paid", "refunded"],
      default: "pending",
    },

    // Admin payment release status
    // "pending" → funds held by platform
    // "released" → funds released to business
    adminPaymentStatus: {
      type: String,
      enum: ["pending", "released"],
      default: "pending",
    },

    // Platform fee (ouiimi's cut, e.g., $1.99)
    platformFee: {
      type: Number,
      default: 0,
    },

    // Service amount after deducting platform fee
    serviceAmount: {
      type: Number,
      default: 0,
    },

    // Stripe payment session/intent ID for verification
    paymentIntentId: {
      type: String,
      default: null,
    },

    // Customer notes (e.g., "I'm allergic to certain products")
    customerNotes: {
      type: String,
      default: null,
    },

    // Business notes (internal use)
    businessNotes: {
      type: String,
      default: null,
    },

    // Cancellation tracking
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,  // Adds createdAt, updatedAt
  }
);

// =============================================================================
// INDEXES - Optimize common queries
// =============================================================================

// For "my bookings" queries filtering by status
bookingSchema.index({ userId: 1, status: 1 });

// For business dashboard queries filtering by status
bookingSchema.index({ businessId: 1, status: 1 });

// For service-specific queries
bookingSchema.index({ serviceId: 1 });

// For date-based queries (e.g., "upcoming bookings")
bookingSchema.index({ "timeSlot.date": 1, status: 1 });

// For sorting by creation date (newest first)
bookingSchema.index({ createdAt: -1 });

// =============================================================================
// MODEL EXPORT
// =============================================================================

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
