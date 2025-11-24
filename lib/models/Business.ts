import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBusiness extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  email: string;
  phone?: string;
  address: string;
  logo?: string;
  story?: string;
  status: "pending" | "approved" | "rejected";
  bankDetails?: {
    name?: string;
    bsb?: string;
    accountNumber?: string;
    contactNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    story: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    bankDetails: {
      name: { type: String, trim: true },
      bsb: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      contactNumber: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

businessSchema.index({ userId: 1 }, { unique: true });
businessSchema.index({ businessName: 1 });
businessSchema.index({ status: 1 });

const Business: Model<IBusiness> =
  mongoose.models.Business || mongoose.model<IBusiness>("Business", businessSchema);

export default Business;

