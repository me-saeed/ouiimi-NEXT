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

// =============================================================================
// INDEXES - Speed up password reset token lookups
// =============================================================================

// For token verification queries (most common operation)
forgetPassSchema.index({ token: 1, email: 1 });

// For automatic expiration cleanup
forgetPassSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour

// =============================================================================
// MODEL EXPORT
// =============================================================================

const ForgetPass: Model<IForgetPass> =
  mongoose.models.ForgetPass ||
  mongoose.model<IForgetPass>("ForgetPass", forgetPassSchema);

export default ForgetPass;
