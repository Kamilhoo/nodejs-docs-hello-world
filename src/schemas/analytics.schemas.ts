import { FastifySchema } from 'fastify';

export const getOverviewAnalyticsSchema: FastifySchema = {
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
      time: {
        type: 'string',
        enum: [
          'today',
          'last_7_days',
          'last_month',
          'last_3_months',
          'last_year',
          'all_time',
        ],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        time: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            from: { type: ['string', 'null'], format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
          },
        },
        totalOrders: { type: 'integer' },
        totalRevenue: { type: 'number' },
        totalRugs: { type: 'integer' },
        completedOrders: { type: 'integer' },
        customerCount: { type: 'integer' },
        growthRatio: { type: 'number' },
        growth: {
          type: 'object',
          properties: {
            currentCompletedOrders: { type: 'integer' },
            previousCompletedOrders: { type: 'integer' },
          },
        },
      },
    },
  },
};


