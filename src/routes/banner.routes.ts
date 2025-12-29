import { FastifyInstance } from 'fastify';
import {
  getBanner,
  addData,
  updateData,
  deleteData,
} from '../controllers/banner.controller';
import { authGuard, adminGuard } from '../middlewares/auth.middleware';
import {
  getBannerSchema,
  addDataSchema,
  updateDataSchema,
  deleteDataSchema,
} from '../schemas/banner.schemas';

export async function bannerRoutes(fastify: FastifyInstance) {
  // Public route
  fastify.get('/banner', {
    schema: getBannerSchema,
  }, getBanner);

  // Admin routes - require authentication + admin guard
  fastify.post('/admin/banner/data', {
    schema: addDataSchema,
    preHandler: [authGuard, adminGuard],
  }, addData);

  fastify.put('/admin/banner/data', {
    schema: updateDataSchema,
    preHandler: [authGuard, adminGuard],
  }, updateData);

  fastify.delete('/admin/banner/data', {
    schema: deleteDataSchema,
    preHandler: [authGuard, adminGuard],
  }, deleteData);
}

