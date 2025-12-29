import { FastifySchema } from 'fastify';
import { ORDER_STATUS_VALUES, PAYMENT_METHOD_VALUES } from '../models/order.model';

const objectIdPattern = '^[a-fA-F0-9]{24}$';

// Reusable schema for order items
const orderItemSchema = {
  type: 'object',
  properties: {
    productId: { type: 'string', pattern: objectIdPattern },
    title: { type: 'string' },
    image: { type: 'string' },
    size: { type: ['string', 'null'] },
    quantity: { type: 'integer' },
    unitPrice: { type: 'number' },
    lineTotal: { type: 'number' },
  },
};

const orderItemInputSchema = {
  type: 'object',
  required: ['productId', 'quantity'],
  properties: {
    productId: { type: 'string', pattern: objectIdPattern },
    quantity: { type: 'integer', minimum: 1 },
    size: { type: 'string', maxLength: 100 },
  },
};

export const createOrderSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'username', 'items'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 100,
      },
      username: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },
      phoneNumber: {
        type: 'string',
        minLength: 5,
        maxLength: 20,
      },
      // Multi‑product items array (also used for single‑product: just send one item)
      items: {
        type: 'array',
        items: orderItemInputSchema,
        minItems: 1,
      },
      address: {
        type: 'string',
        maxLength: 500,
      },
      country: {
        type: 'string',
        maxLength: 100,
      },
      city: {
        type: 'string',
        maxLength: 100,
      },
      postalCode: {
        type: 'string',
        maxLength: 20,
      },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            phoneNumber: { type: ['string', 'null'] },
            items: {
              type: 'array',
              items: orderItemSchema,
            },
            status: { type: 'string', enum: ORDER_STATUS_VALUES },
            paymentMethod: { type: 'string', enum: PAYMENT_METHOD_VALUES },
            totalPrice: { type: 'number' },
            shippingFee: { type: 'number' },
            currency: { type: 'string' },
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
    403: {
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

export const getUserOrdersSchema: FastifySchema = {
  querystring: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              items: {
                type: 'array',
                items: orderItemSchema,
              },
              totalPrice: { type: 'number' },
              shippingFee: { type: 'number' },
              status: { type: 'string', enum: ORDER_STATUS_VALUES },
              cancelReason: { type: ['string', 'null'] },
              trackingNumber: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
              paymentMethod: { type: 'string', enum: PAYMENT_METHOD_VALUES },
              currency: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const cancelOrderSchema: FastifySchema = {
  querystring: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
    },
    additionalProperties: false,
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        pattern: objectIdPattern,
      },
    },
  },
  body: {
    type: 'object',
    properties: {
      cancelReason: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
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
        order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ORDER_STATUS_VALUES },
            cancelReason: { type: ['string', 'null'] },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
};

export const getAllOrdersAdminSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
      status: {
        type: 'string',
        enum: ORDER_STATUS_VALUES,
      },
      paymentMethod: {
        type: 'string',
        enum: PAYMENT_METHOD_VALUES,
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string', enum: ORDER_STATUS_VALUES },
              paymentMethod: { type: 'string', enum: PAYMENT_METHOD_VALUES },
              totalPrice: { type: 'number' },
              shippingFee: { type: 'number' },
              currency: { type: 'string' },
              cancelReason: { type: ['string', 'null'] },
              trackingNumber: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  email: { type: ['string', 'null'] },
                  username: { type: ['string', 'null'] },
                  country: { type: ['string', 'null'] },
                  address: { type: ['string', 'null'] },
                  city: { type: ['string', 'null'] },
                  postalCode: { type: ['string', 'null'] },
                  phoneNumber: { type: ['string', 'null'] },
                },
              },
              items: {
                type: 'array',
                items: orderItemSchema,
              },
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
  },
};

export const updateOrderStatusSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: { type: 'string' },
    },
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        pattern: objectIdPattern,
      },
    },
  },
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['confirm', 'failed', 'cancelled', 'completed', 'delivered', 'refund'],
      },
      cancelReason: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
      },
      trackingNumber: {
        type: 'string',
        minLength: 1,
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
        order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ORDER_STATUS_VALUES },
            cancelReason: { type: ['string', 'null'] },
            trackingNumber: { type: ['string', 'null'] },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
};

export const getOrderByIdAdminSchema: FastifySchema = {
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: { type: 'string' },
    },
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        pattern: objectIdPattern,
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
            order: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string', enum: ORDER_STATUS_VALUES },
                paymentMethod: { type: 'string', enum: PAYMENT_METHOD_VALUES },
                totalPrice: { type: 'number' },
                shippingFee: { type: 'number' },
                currency: { type: 'string' },
                cancelReason: { type: ['string', 'null'] },
                trackingNumber: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                user: {
                  type: 'object',
                  properties: {
                    email: { type: ['string', 'null'] },
                    username: { type: ['string', 'null'] },
                    phoneNumber: { type: ['string', 'null'] },
                    address: { type: ['string', 'null'] },
                    country: { type: ['string', 'null'] },
                    city: { type: ['string', 'null'] },
                    postalCode: { type: ['string', 'null'] },
                  },
                },
                items: {
                  type: 'array',
                  items: orderItemSchema,
                },
              },
            },
      },
    },
  },
};


