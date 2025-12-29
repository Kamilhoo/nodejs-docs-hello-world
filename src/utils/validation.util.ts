// Sanitize string input
// Note: Validation is handled by Fastify schemas
// These utilities only handle sanitization (trim, normalize, etc.)
export const sanitizeString = (input: string | undefined, maxLength?: number): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove any null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

// Sanitize email
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

// Sanitize phone number (remove spaces, keep only digits and +)
export const sanitizePhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') return '';
  // Remove all spaces, dashes, parentheses, and keep only digits and +
  let sanitized = phoneNumber.replace(/[\s\-()]/g, '');
  // Ensure + is only at the start
  if (sanitized.includes('+')) {
    const parts = sanitized.split('+');
    sanitized = '+' + parts.filter(p => p).join('');
  }
  return sanitized;
};

// Extract username from email (everything before @)
export const extractUsernameFromEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  return parts[0] || '';
};