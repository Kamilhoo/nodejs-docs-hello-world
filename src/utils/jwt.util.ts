import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Token blacklist to store revoked tokens
const tokenBlacklist = new Set<string>();

/**
 * Add token to blacklist (for logout)
 */
export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Verify JWT token (checks blacklist first)
 */
export const verifyToken = (token: string): JWTPayload => {
  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    throw new Error('Token has been revoked');
  }

  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

