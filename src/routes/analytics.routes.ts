import { FastifyInstance } from 'fastify';
import { getOverviewAnalytics } from '../controllers/analytics.controller';
import { authGuard, adminGuard } from '../middlewares/auth.middleware';
import { getOverviewAnalyticsSchema } from '../schemas/analytics.schemas';

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/admin/analytics/overview',
    {
      schema: getOverviewAnalyticsSchema,
      preHandler: [authGuard, adminGuard],
    },
    getOverviewAnalytics
  );
}


