import { FastifySchema } from 'fastify';

const base64ImageSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'string',
      description: 'Base64 encoded image data',
    },
    mimeType: {
      type: 'string',
      description: 'Optional mime type (e.g., image/jpeg, image/png)',
    },
  },
  required: ['data'],
};

export const uploadImageSchema: FastifySchema = {
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
  body: {
    type: 'object',
    required: ['image'],
    properties: {
      image: base64ImageSchema,
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        imageUrl: { type: 'string' },
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

export const deleteImageSchema: FastifySchema = {
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
  body: {
    type: 'object',
    required: ['imageUrl'],
    properties: {
      imageUrl: {
        type: 'string',
        description: 'Image URL to delete (e.g., "/uploads/rugs/abc123.webp")',
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

