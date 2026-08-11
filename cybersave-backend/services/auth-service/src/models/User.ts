import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '@cybersave/shared';

export interface IUser extends Document {
  phone: string;
  name: string;
  email?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  aadhaarMasked?: string;
  aadhaarNumber?: string;  // masked last 4 digits only
  panMasked?: string;
  state?: string;
  district?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  fcmToken?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  addresses?: Array<{
    id: string;
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }>;
  sessions?: Array<{
    id: string;
    device: string;
    location: string;
    ip: string;
    lastActive: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}


const UserSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Store phone as-is; mask only in logs (rules.md §2)
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    dob: { type: String },
    avatar: { type: String },

    gender: { type: String, enum: ['male', 'female', 'other'] },
    aadhaarMasked: { type: String }, // Only last 4 digits stored
    aadhaarNumber: { type: String },  // last 4 digits of aadhaar for display
    panMasked: { type: String },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CITIZEN,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    fcmToken: { type: String },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    addresses: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      }
    ],
    sessions: [
      {
        id: { type: String, required: true },
        device: { type: String, required: true },
        location: { type: String, required: true },
        ip: { type: String, required: true },
        lastActive: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
