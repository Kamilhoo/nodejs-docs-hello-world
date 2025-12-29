import { FastifySchema } from 'fastify';

export const createOrUpdateShippingFeeSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['freeShippingThreshold', 'shippingFee', 'country'],
    properties: {
      freeShippingThreshold: {
        type: 'number',
        minimum: 0,
        description: 'Minimum order amount for free shipping',
      },
      shippingFee: {
        type: 'number',
        minimum: 0,
        description: 'Shipping fee amount if order is below threshold',
      },
      country: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Country name for shipping (required)',
      },
      isActive: {
        type: 'boolean',
        description: 'Enable/disable shipping fee rules',
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
        shippingFee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            freeShippingThreshold: { type: 'number' },
            shippingFee: { type: 'number' },
            country: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
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

export const getShippingFeeSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      country: {
        type: 'string',
        maxLength: 100,
        description: 'Country name (default: Pakistan)',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        shippingFee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            freeShippingThreshold: { type: 'number' },
            shippingFee: { type: 'number' },
            country: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    404: {
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



