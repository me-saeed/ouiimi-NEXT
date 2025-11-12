import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  fname: string;
  lname: string;
  email: string;
  username: string;
  password: string;
  address?: string;
  contactNo?: string;
  pic?: string;
  isEnable: string;
  Roles: string[];
  token?: string;
  following?: number;
  follower?: number;
  sellerPoints?: number;
  expotoken?: string;
  verify: string;
  counterId: number;
  date: Date;
  oauthProvider?: string;
  oauthId?: string;
}

const userSchema = new Schema<IUser>(
  {
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, unique: true, sparse: true, lowercase: true },
    password: { type: String },
    address: { type: String, default: null },
    contactNo: { type: String, default: null },
    pic: { type: String, default: "avatar.png" },
    isEnable: { type: String, default: "yes" },
    Roles: { type: [String], default: ["user"] },
    token: { type: String },
    following: { type: Number, default: 0 },
    follower: { type: Number, default: 0 },
    sellerPoints: { type: Number, default: 0 },
    expotoken: { type: String, default: null },
    verify: { type: String, default: "yes" },
    counterId: { type: Number },
    date: { type: Date, default: Date.now },
    oauthProvider: { type: String },
    oauthId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for OAuth users
userSchema.index({ oauthProvider: 1, oauthId: 1 }, { unique: true, sparse: true });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;

