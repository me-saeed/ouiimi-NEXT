import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  cost?: number;
  staffIds: mongoose.Types.ObjectId[];
  isBooked: boolean;
  bookingId?: mongoose.Types.ObjectId;
}

export interface IAddOn {
  name: string;
  cost: number;
}

export interface IService extends Document {
  businessId: mongoose.Types.ObjectId;
  category: string;
  subCategory?: string;
  serviceName: string;
  duration: string;
  baseCost: number;
  description?: string;
  address: string;
  addOns: IAddOn[];
  timeSlots: ITimeSlot[];
  defaultStaffIds: mongoose.Types.ObjectId[];
  status: "listed" | "booked" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const timeSlotSchema = new Schema<ITimeSlot>(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    cost: { type: Number },
    staffIds: [{ type: Schema.Types.ObjectId, ref: "Staff" }],
    isBooked: { type: Boolean, default: false },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
  },
  { _id: false }
);

const addOnSchema = new Schema<IAddOn>(
  {
    name: { type: String, required: true },
    cost: { type: Number, required: true },
  },
  { _id: false }
);

const serviceSchema = new Schema<IService>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
    },
    baseCost: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    addOns: {
      type: [addOnSchema],
      default: [],
    },
    timeSlots: {
      type: [timeSlotSchema],
      default: [],
    },
    defaultStaffIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Staff" }],
      default: [],
    },
    status: {
      type: String,
      enum: ["listed", "booked", "completed", "cancelled"],
      default: "listed",
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ businessId: 1, status: 1 });
serviceSchema.index({ category: 1, subCategory: 1 });
serviceSchema.index({ status: 1 });

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", serviceSchema);

export default Service;

