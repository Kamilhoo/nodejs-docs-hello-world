import mongoose, { Schema } from 'mongoose';
import { LiteUserDocument } from '../types';

const liteUserSchema = new Schema<LiteUserDocument>({
  username: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    lowercase: true,
    trim: true,
  },
  address: {
    type: String,
  },
  country: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  otpCode: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  magicLinkToken: {
    type: String,
  },
  magicLinkExpiry: {
    type: Date,
  },
  isGoogleLogin: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
    index: true,
  },
  currency: {
    type: String,
    default: 'PKR',
    trim: true,
    uppercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Note: sessionId index is defined inline in schema
// Note: email index is automatically created by unique: true

export const LiteUser = mongoose.model<LiteUserDocument>('LiteUser', liteUserSchema);

