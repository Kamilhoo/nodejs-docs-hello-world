import { FastifySchema } from 'fastify';

const objectIdPattern = '^[a-fA-F0-9]{24}$';

// Reusable product item schema structure
const cartProductItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    productId: { type: 'string' },
    quantity: { type: 'integer' },
    size: { type: ['string', 'null'] },
    available: { type: 'boolean' },
    stock: { type: 'number' },
    product: {
      type: ['object', 'null'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        images: { type: ['array', 'null'], items: { type: 'string' } },
        originalPrice: { type: 'number' },
        salePrice: { type: 'number' },
        isOnSale: { type: 'boolean' },
        currentPrice: { type: 'number' },
      },
    },
  },
};

export const getCartSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        cart: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sessionId: { type: 'string' },
            products: {
              type: 'array',
              items: cartProductItemSchema,
            },
            totalPrice: { type: 'number' },
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
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

export const addToCartSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['productId', 'quantity'],
    properties: {
      productId: {
        type: 'string',
        pattern: objectIdPattern,
      },
      quantity: {
        type: 'integer',
        minimum: 1,
        maximum: 1000,
      },
      size: {
        type: 'string',
        maxLength: 100,
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

export const updateCartItemSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['cartItemId'],
    properties: {
      cartItemId: {
        type: 'string',
        minLength: 1,
      },
    },
  },
  body: {
    type: 'object',
    required: ['quantity'],
    properties: {
      quantity: {
        type: 'integer',
        minimum: 1,
        maximum: 1000,
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
        cart: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sessionId: { type: 'string' },
            products: {
              type: 'array',
              items: cartProductItemSchema,
            },
            totalPrice: { type: 'number' },
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

export const removeCartItemSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['cartItemId'],
    properties: {
      cartItemId: {
        type: 'string',
        minLength: 1,
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        cart: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sessionId: { type: 'string' },
            products: {
              type: 'array',
              items: cartProductItemSchema,
            },
            totalPrice: { type: 'number' },
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

export const clearCartSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        cart: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            products: {
              type: 'array',
              items: cartProductItemSchema,
            },
            totalPrice: { type: 'number' },
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


