import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICounter extends Document {
  _id: string; // The counter identifier (e.g., "bookingNumber")
  seq: number; // The current sequence number
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 5000 },
});

const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", counterSchema);

export default Counter;
