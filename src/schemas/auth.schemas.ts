import { FastifySchema } from 'fastify';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Google login schema
export const googleLoginSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['idToken'],
    properties: {
      idToken: {
        type: 'string',
        minLength: 100,
        maxLength: 5000,
        description: 'Google OAuth ID token from frontend',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            phoneNumber: { type: 'string', nullable: true },
            isAdmin: { type: 'boolean' },
            verified: { type: 'boolean' },
            isGoogleLogin: { type: 'boolean' },
            currency: { type: 'string', description: 'User currency (default: PKR)' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Get current user schema
export const getCurrentUserSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer token',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            phoneNumber: { type: 'string', nullable: true },
            isAdmin: { type: 'boolean' },
            role: { type: 'string', enum: ['user', 'admin'] },
            verified: { type: 'boolean', description: 'Only for regular users' },
            isGoogleLogin: { type: 'boolean', description: 'Only for regular users' },
            isEmailVerified: { type: 'boolean', description: 'Indicates if the user verified their email' },
            currency: { type: 'string', description: 'Currency code (default: PKR for both admin and users)' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Update profile schema
export const updateProfileSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer token',
      },
    },
    additionalProperties: true,
  },
  body: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Username (optional)',
      },
      address: {
        type: 'string',
        maxLength: 500,
        description: 'User address (optional)',
      },
      country: {
        type: 'string',
        maxLength: 100,
        description: 'Country name (optional)',
      },
      city: {
        type: 'string',
        maxLength: 100,
        description: 'City name (optional)',
      },
      phoneNumber: {
        type: 'string',
        pattern: '^[+]?[0-9]{10,15}$',
        maxLength: 20,
        description: 'Phone number (optional)',
      },
    },
    minProperties: 1, // At least one property must be provided
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            phoneNumber: { type: 'string', nullable: true },
            verified: { type: 'boolean' },
            isGoogleLogin: { type: 'boolean' },
            currency: { type: 'string', description: 'User currency (default: PKR)' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Logout schema
export const logoutSchema: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer token (optional - for logged in users)',
      },
    },
    additionalProperties: true,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Send OTP schema
export const sendOTPSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 100,
        description: 'Valid email address',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Verify OTP schema
export const verifyOTPSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'otpCode'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 100,
        description: 'Valid email address',
      },
      otpCode: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        description: '6-digit OTP code',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            isAdmin: { type: 'boolean' },
            currency: { type: 'string' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Get all users schema (Admin only)
export const getAllUsersSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer token',
      },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number (default: 1)',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Number of users per page (default: 20, max: 100)',
      },
      search: {
        type: 'string',
        maxLength: 200,
        description: 'Search by email or username (case-insensitive)',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: ['string', 'null'] },
              email: { type: ['string', 'null'] },
              address: { type: ['string', 'null'] },
              country: { type: ['string', 'null'] },
              city: { type: ['string', 'null'] },
              phoneNumber: { type: ['string', 'null'] },
              verified: { type: 'boolean' },
              isEmailVerified: { type: 'boolean' },
              isGoogleLogin: { type: 'boolean' },
              isAdmin: { type: 'boolean' },
              role: { type: 'string', enum: ['user', 'admin'] },
              currency: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
      },
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    403: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};


