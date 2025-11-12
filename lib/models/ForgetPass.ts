import mongoose, { Schema, Document, Model } from "mongoose";

export interface IForgetPass extends Document {
  email: string;
  createdAt: Date;
}

const forgetPassSchema = new Schema<IForgetPass>(
  {
    email: { type: String, required: true, lowercase: true },
    createdAt: { type: Date, default: Date.now, expires: 900 }, // 15 minutes (900 seconds)
  },
  {
    timestamps: true,
  }
);

const ForgetPass: Model<IForgetPass> =
  mongoose.models.ForgetPass ||
  mongoose.model<IForgetPass>("ForgetPass", forgetPassSchema);

export default ForgetPass;

