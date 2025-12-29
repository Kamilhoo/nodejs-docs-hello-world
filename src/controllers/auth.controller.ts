import { FastifyReply } from 'fastify';
import { LiteUser } from '../models/liteUser.model';
import { generateToken, blacklistToken } from '../utils/jwt.util';
import { sanitizeString, sanitizeEmail, sanitizePhoneNumber } from '../utils/validation.util';
import { verifyGoogleToken, isValidTokenFormat } from '../utils/googleAuth.util';
import {
  AuthRequest,
  GoogleLoginBody,
  UpdateProfileBody,
} from '../types';
import {
  isTokenExpired,
  generateOTPWithExpiry,
} from '../utils/token.util';
import { sendOTPEmail } from '../services/email.service';
import { extractUsernameFromEmail } from '../utils/validation.util';
import {
  SendOTPBody,
  VerifyOTPBody,
} from '../types';

// Helper function to check if email is admin email
const isAdminEmail = (email: string): boolean => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email.toLowerCase().trim() === adminEmail.toLowerCase().trim();
};

export const googleLogin = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const body = request.body as GoogleLoginBody;
    
    const idToken = body.idToken;

    // Validate token format
    if (!isValidTokenFormat(idToken)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid Google token format',
      });
    }

    // Verify Google token and get user info
    let googleUserInfo;
    try {
      googleUserInfo = await verifyGoogleToken(idToken);
    } catch (verifyError: any) {
      return reply.status(401).send({
        success: false,
        message: verifyError.message || 'Google token verification failed',
      });
    }

    // Extract verified user information from Google
    const email = googleUserInfo.email;
    const username = sanitizeString(googleUserInfo.name, 50);

    // Verify sanitized username is valid
    if (!username || username.length < 2) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid username from Google account',
      });
    }

    // Validate email is verified by Google
    if (!googleUserInfo.email_verified) {
      return reply.status(400).send({
        success: false,
        message: 'Google email is not verified',
      });
    }

    // Check if email is admin email
    const isAdmin = isAdminEmail(email);

    // Check if user exists by email
    let user = await LiteUser.findOne({ email });

    if (user) {
        // Update existing user
        user.email = email;
        user.username = username;
        user.isGoogleLogin = true;
        user.verified = true;
        user.isEmailVerified = true;
        user.isAdmin = isAdmin; // Update isAdmin field

        try {
          await user.save();
        } catch (saveError: any) {
        if (saveError.code !== 11000) {
              throw saveError;
        }
      }
    } else {
      // Create new user
      try {
        user = await LiteUser.create({
          email,
          username,
          isGoogleLogin: true,
          verified: true,
          isEmailVerified: true,
          isAdmin: isAdmin, // Set isAdmin field
        });
      } catch (createError: any) {
        // Handle duplicate email on create (race condition)
        if (createError.code === 11000) {
          const raceConditionUser = await LiteUser.findOne({ email });
          if (raceConditionUser) {
            raceConditionUser.username = username;
            raceConditionUser.isGoogleLogin = true;
            raceConditionUser.verified = true;
            raceConditionUser.isEmailVerified = true;
            raceConditionUser.isAdmin = isAdmin; // Set isAdmin field
            user = await raceConditionUser.save();
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    }

    // Ensure user was created/updated successfully
    if (!user) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to complete Google login',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: (user._id as any).toString(),
      isAdmin: user.isAdmin,
      currency: user.currency || 'PKR',
    });

    return reply.send({
      success: true,
      message: 'Google login successful',
      token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address || null,
          phoneNumber: user.phoneNumber || null,
          country: user.country || null,
          city: user.city || null,
        role: user.isAdmin ? 'admin' : 'user',
        isAdmin: user.isAdmin,
          verified: user.verified,
          isGoogleLogin: user.isGoogleLogin,
          isEmailVerified: user.isEmailVerified,
          currency: user.currency || 'PKR',
        },
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Google login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getCurrentUser = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    // Edge Case 1: Check if user is authenticated
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: 'Not authenticated',
      });
    }

    // Edge Case 2: Validate user ID exists
    if (!request.user.id || typeof request.user.id !== 'string') {
      return reply.status(401).send({
        success: false,
        message: 'Invalid user token',
      });
    }

    // Fetch from LiteUser table (admin and regular users both stored here)
      const user = await LiteUser.findById(request.user.id);

    // Edge Case 3: User not found
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: 'User not found. Token may be invalid.',
        });
      }

    // Edge Case 4: Ensure user has required fields
      if (!user.email || !user.username) {
        return reply.status(500).send({
          success: false,
          message: 'User account data incomplete',
        });
      }

      return reply.send({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address || null,
          country: user.country || null,
        city: user.city || null,
          phoneNumber: user.phoneNumber || null,
        role: user.isAdmin ? 'admin' : 'user',
        isAdmin: user.isAdmin,
          verified: user.verified,
          isGoogleLogin: user.isGoogleLogin || false,
          isEmailVerified: user.isEmailVerified,
          currency: user.currency || 'PKR',
          createdAt: user.createdAt,
        },
      });
  } catch (error: any) {
    console.error('Get current user error:', error);
    
    // Edge Case 7: Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return reply.status(400).send({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    return reply.status(500).send({
      success: false,
      message: 'Failed to get user information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Update profile (after login - address, phoneNumber, country)
export const updateProfile = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    // Edge Case 1: Check if user is authenticated
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: 'Not authenticated. Please login first.',
      });
    }

    const body = request.body as UpdateProfileBody;
    
    // Edge Case 2: Check if any field is provided
    if (!body.username && !body.address && !body.country && !body.city && !body.phoneNumber) {
      return reply.status(400).send({
        success: false,
        message: 'At least one field (username, address, country, city, or phoneNumber) must be provided for update.',
      });
    }
    
    // Sanitize inputs
    const username = body.username ? sanitizeString(body.username, 100) : undefined;
    const address = body.address ? sanitizeString(body.address, 500) : undefined;
    const country = body.country ? sanitizeString(body.country, 100) : undefined;
    const city = body.city ? sanitizeString(body.city, 100) : undefined;
    const phoneNumber = body.phoneNumber ? sanitizePhoneNumber(body.phoneNumber) : undefined;

    // Check if admin or regular user
    if (request.user.isAdmin) {
      // Profile update not available for admin users
      return reply.status(400).send({
        success: false,
        message: 'Profile update not available for admin users.',
      });
    }

    // Fetch user from LiteUser table
    const user = await LiteUser.findById(request.user.id);

    // Edge Case 3: User not found
    if (!user) {
      return reply.status(404).send({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
    }

    // Edge Case 4: User must be verified
    if (!user.verified) {
      return reply.status(400).send({
        success: false,
        message: 'User not verified. Please complete registration first.',
      });
    }

    // Update profile fields (only if provided)
    if (username !== undefined) {
      // Validate username is not empty
      if (username && username.trim().length > 0) {
        user.username = username.trim();
      } else {
        return reply.status(400).send({
          success: false,
          message: 'Username cannot be empty.',
        });
      }
    }
    if (address !== undefined) {
      user.address = address || undefined;
    }
    if (country !== undefined) {
      user.country = country || undefined;
    }
    if (city !== undefined) {
      user.city = city || undefined;
    }
    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber || undefined;
    }

    try {
      await user.save();

      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address || null,
          country: user.country || null,
          city: user.city || null,
          phoneNumber: user.phoneNumber || null,
          verified: user.verified,
          isGoogleLogin: user.isGoogleLogin || false,
          isEmailVerified: user.isEmailVerified,
          currency: user.currency || 'PKR',
        },
      });
    } catch (saveError: any) {
      console.error('Profile update error:', saveError);
      return reply.status(500).send({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? saveError.message : undefined,
      });
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Logout - Clear session and blacklist token
export const logout = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    // Get token from authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      // Blacklist the token to expire it
      blacklistToken(token);
    }

    // Clear session cookie if exists
    // Use same options as setCookie to ensure proper deletion
    reply.clearCookie('session_id', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return reply.send({
      success: true,
      message: 'Logout successful. Token has been revoked.',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to logout',
    });
  }
};

// Send OTP to email (for register/login)
export const sendOTP = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const body = request.body as SendOTPBody;
    const email = sanitizeEmail(body.email);

    if (!email) {
      return reply.status(400).send({
        success: false,
        message: 'Valid email address is required.',
      });
    }

    // Check if email is admin email
    const isAdmin = isAdminEmail(email);

    // Find existing user (if any)
    let user = await LiteUser.findOne({ email });

    // Generate OTP
    const { otpCode, expiry } = generateOTPWithExpiry(1);

    if (user) {
      // Update existing user with new OTP and isAdmin
      user.otpCode = otpCode;
      user.otpExpiry = expiry;
      user.isAdmin = isAdmin; // Update isAdmin field
        await user.save();
    } else {
      // For new users, create minimal record with only email and OTP (not a full user yet)
      // User will be fully created only after OTP verification in verifyOTP
      const username = extractUsernameFromEmail(email);
      user = await LiteUser.create({
        email,
        username,
        otpCode,
        otpExpiry: expiry,
        verified: false,
        isEmailVerified: false,
        isGoogleLogin: false,
        isAdmin: isAdmin, // Set isAdmin field
      });
    }

    // Send OTP email
    try {
      await sendOTPEmail(email, otpCode);
    } catch (emailError: any) {
      console.error('Error sending OTP email:', emailError);
      return reply.status(500).send({
        success: false,
        message: 'Failed to send OTP email. Please try again later.',
      });
    }

    return reply.send({
      success: true,
      message: 'OTP sent to your email address.',
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Verify OTP and register/login (unified)
export const verifyOTP = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    const body = request.body as VerifyOTPBody;
    const email = sanitizeEmail(body.email);
    const otpCode = body.otpCode?.trim();

    if (!email || !otpCode) {
      return reply.status(400).send({
        success: false,
        message: 'Email and OTP code are required.',
      });
    }

    // Check if email is admin email
    const isAdmin = isAdminEmail(email);

    // Find user - must exist with OTP from sendOTP
    const user = await LiteUser.findOne({ email });

    if (!user) {
      return reply.status(400).send({
        success: false,
        message: 'No OTP found. Please request a new OTP.',
      });
    }

    // Verify OTP exists
    if (!user.otpCode || !user.otpExpiry) {
      return reply.status(400).send({
      success: false,
        message: 'No OTP found. Please request a new OTP.',
      });
    }

    // Check if OTP matches
    if (user.otpCode !== otpCode) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid OTP code.',
      });
    }

    // Check if OTP expired
    if (isTokenExpired(user.otpExpiry)) {
      return reply.status(400).send({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    // Extract username from email if not set
    if (!user.username) {
      user.username = extractUsernameFromEmail(email);
    }

    // Mark user as verified and update isAdmin
    user.verified = true;
    user.isEmailVerified = true;
    user.isAdmin = isAdmin; // Update isAdmin field
    user.otpCode = undefined;
    user.otpExpiry = undefined;

    try {
      await user.save();
    } catch (saveError: any) {
      console.error('Error saving user after OTP verification:', saveError);
      return reply.status(500).send({
        success: false,
        message: 'Failed to complete verification. Please try again.',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: (user._id as any).toString(),
      isAdmin: user.isAdmin,
      currency: user.currency || 'PKR',
    });

    return reply.send({
      success: true,
      message: 'OTP verified successfully.',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.isAdmin ? 'admin' : 'user',
        isAdmin: user.isAdmin,
        currency: user.currency || 'PKR',
      },
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to verify OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get all users (Admin only) - with search and pagination
export const getAllUsers = async (request: AuthRequest, reply: FastifyReply) => {
  try {
    // Edge Case 1: Check if user is authenticated
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: 'Not authenticated',
      });
    }

    // Edge Case 2: Check if user is admin
    if (!request.user.isAdmin) {
      return reply.status(403).send({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const query = request.query as {
      page?: number;
      limit?: number;
      search?: string;
    };

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20)); // Max 100, min 1, default 20
    const search = query.search?.trim();

    // Build filter query
    const filter: Record<string, any> = {};

    // Search by email or username
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } }, // Case-insensitive email search
        { username: { $regex: search, $options: 'i' } }, // Case-insensitive username search
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [users, total] = await Promise.all([
      LiteUser.find(filter)
        .select('-otpCode -otpExpiry -magicLinkToken -magicLinkExpiry -password -resetPasswordToken -resetPasswordTokenExpiry -verificationToken -verificationTokenExpiry -sessionId')
        .sort({ createdAt: -1 }) // Latest first
        .skip(skip)
        .limit(limit)
        .lean(),
      LiteUser.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    // Format users for response
    const formattedUsers = users.map((user: any) => ({
      id: user._id,
      username: user.username || null,
      email: user.email || null,
      address: user.address || null,
      country: user.country || null,
      city: user.city || null,
      phoneNumber: user.phoneNumber || null,
      verified: user.verified || false,
      isEmailVerified: user.isEmailVerified || false,
      isGoogleLogin: user.isGoogleLogin || false,
      isAdmin: user.isAdmin || false,
      role: user.isAdmin ? 'admin' : 'user',
      currency: user.currency || 'PKR',
      createdAt: user.createdAt,
    }));

    return reply.status(200).send({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

