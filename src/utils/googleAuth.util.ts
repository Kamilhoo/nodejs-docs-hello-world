import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.warn('⚠️  GOOGLE_CLIENT_ID not set in environment variables. Google login verification will fail.');
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
  sub: string; // Google user ID
}

/**
 * Verify Google ID token and extract user information
 * @param idToken - Google ID token from frontend
 * @returns Google user information if token is valid
 * @throws Error if token is invalid or verification fails
 */
export const verifyGoogleToken = async (idToken: string): Promise<GoogleUserInfo> => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables.');
  }

  try {
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID, // Verify that the token was issued for our app
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google token: No payload received');
    }

    // Verify email is present and verified
    if (!payload.email) {
      throw new Error('Invalid Google token: No email in payload');
    }

    if (!payload.email_verified) {
      throw new Error('Google email not verified');
    }

    // Extract user information
    // Ensure name exists (fallback to email if no name)
    const name = payload.name || payload.given_name || payload.email?.split('@')[0] || 'User';
    
    const userInfo: GoogleUserInfo = {
      email: payload.email.toLowerCase(),
      name: name,
      picture: payload.picture,
      email_verified: payload.email_verified || false,
      sub: payload.sub, // Google user ID
    };

    return userInfo;
  } catch (error: any) {
    // Handle specific Google Auth errors
    if (error.message && error.message.includes('Token used too early')) {
      throw new Error('Google token is not yet valid');
    }
    if (error.message && error.message.includes('Token used too late')) {
      throw new Error('Google token has expired');
    }
    if (error.message && error.message.includes('Invalid token signature')) {
      throw new Error('Invalid Google token signature');
    }
    
    // Re-throw with clearer message
    throw new Error(`Google token verification failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Validate that the token format looks correct (basic check)
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Google ID tokens are JWT tokens, so they should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Basic length check (Google tokens are typically 800-2000 characters)
  if (token.length < 100 || token.length > 5000) {
    return false;
  }

  return true;
};

