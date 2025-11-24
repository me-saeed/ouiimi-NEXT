import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStaff extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  photo?: string;
  qualifications?: string;
  about?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema<IStaff>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      default: null,
    },
    qualifications: {
      type: String,
      default: null,
    },
    about: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

staffSchema.index({ businessId: 1, isActive: 1 });

const Staff: Model<IStaff> =
  mongoose.models.Staff || mongoose.model<IStaff>("Staff", staffSchema);

export default Staff;

