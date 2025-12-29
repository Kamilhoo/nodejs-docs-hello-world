import { FastifyInstance } from 'fastify';
import {
  createOrUpdateShippingFee,
  getShippingFee,
} from '../controllers/shippingFee.controller';
import { authGuard, adminGuard } from '../middlewares/auth.middleware';
import {
  createOrUpdateShippingFeeSchema,
  getShippingFeeSchema,
} from '../schemas/shippingFee.schemas';

export async function shippingFeeRoutes(fastify: FastifyInstance) {
  // Public route - Get shipping fee for a country (used on checkout page)
  fastify.get(
    '/shipping-fee',
    {
      schema: getShippingFeeSchema,
    },
    getShippingFee
  );

  // Admin routes - require authentication + admin guard
  fastify.post(
    '/admin/shipping-fee',
    {
      schema: createOrUpdateShippingFeeSchema,
      preHandler: [authGuard, adminGuard],
    },
    createOrUpdateShippingFee
  );
}


