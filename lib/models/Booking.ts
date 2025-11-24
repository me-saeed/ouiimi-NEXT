import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  timeSlot: {
    date: Date;
    startTime: string;
    endTime: string;
  };
  addOns?: Array<{
    name: string;
    cost: number;
  }>;
  totalCost: number;
  depositAmount: number; // 10% of totalCost
  remainingAmount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "refunded";
  paymentStatus: "pending" | "deposit_paid" | "fully_paid" | "refunded";
  paymentIntentId?: string; // Stripe payment intent ID
  customerNotes?: string;
  businessNotes?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    timeSlot: {
      date: { type: Date, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    addOns: [
      {
        name: { type: String, required: true },
        cost: { type: Number, required: true, min: 0 },
      },
    ],
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "deposit_paid", "fully_paid", "refunded"],
      default: "pending",
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    customerNotes: {
      type: String,
      default: null,
    },
    businessNotes: {
      type: String,
      default: null,
    },
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
    timestamps: true,
  }
);

// Indexes for efficient queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ businessId: 1, status: 1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ "timeSlot.date": 1, status: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;

