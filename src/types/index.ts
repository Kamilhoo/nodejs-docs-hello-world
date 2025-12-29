import { FastifyRequest, FastifyReply } from 'fastify';
import { Document } from 'mongoose';

export interface LiteUserDocument extends Document {
  username?: string;
  email?: string;
  password?: string; // Optional for backward compatibility
  address?: string;
  country?: string;
  city?: string;
  phoneNumber?: string;
  verified: boolean;
  isEmailVerified: boolean;
  otpCode?: string;
  otpExpiry?: Date;
  magicLinkToken?: string;
  magicLinkExpiry?: Date;
  verificationToken?: string; // Optional for backward compatibility
  verificationTokenExpiry?: Date; // Optional for backward compatibility
  resetPasswordToken?: string; // Optional for backward compatibility
  resetPasswordTokenExpiry?: Date; // Optional for backward compatibility
  sessionId?: string; // Optional for backward compatibility
  isGoogleLogin: boolean;
  isAdmin: boolean;
  currency: string;
  createdAt: Date;
}

export interface JWTPayload {
  id: string;
  isAdmin: boolean;
  currency?: string; // Currency code (e.g., 'PKR') - for both admin and regular users
}

export interface AuthRequest extends FastifyRequest {
  user?: JWTPayload;
  sessionId?: string;
  liteUser?: LiteUserDocument;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface GoogleLoginBody {
  idToken: string; // Google ID token from OAuth
}

export interface UpdateProfileBody {
  username?: string;
  address?: string;
  country?: string;
  city?: string;
  phoneNumber?: string;
}

export interface SendOTPBody {
  email: string;
}

export interface VerifyOTPBody {
  email: string;
  otpCode: string;
}


