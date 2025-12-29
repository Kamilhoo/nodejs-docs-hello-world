import crypto from 'crypto';

/**
 * Generate a random token for email verification or password reset
 * @param length - Length of the token (default: 32)
 * @returns Hexadecimal token string
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate verification token with expiry
 * @param expiryHours - Hours until token expires (default: 24)
 * @returns Object with token and expiry date
 */
export function generateVerificationToken(expiryHours: number = 24): { token: string; expiry: Date } {
  const token = generateToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + expiryHours);
  
  return { token, expiry };
}

/**
 * Generate password reset token with expiry
 * @param expiryHours - Hours until token expires (default: 1)
 * @returns Object with token and expiry date
 */
export function generatePasswordResetToken(expiryHours: number = 1): { token: string; expiry: Date } {
  const token = generateToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + expiryHours);
  
  return { token, expiry };
}

/**
 * Check if token has expired
 * @param expiry - Expiry date to check
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(expiry: Date): boolean {
  return new Date() > expiry;
}

/**
 * Generate a 6-digit OTP code
 * @returns 6-digit OTP string
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate OTP with expiry
 * @param expiryMinutes - Minutes until OTP expires (default: 10)
 * @returns Object with OTP code and expiry date
 */
export function generateOTPWithExpiry(expiryMinutes: number = 10): { otpCode: string; expiry: Date } {
  const otpCode = generateOTP();
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
  
  return { otpCode, expiry };
}