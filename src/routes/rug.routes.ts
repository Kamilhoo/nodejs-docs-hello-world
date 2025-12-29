import { FastifyInstance } from 'fastify';
import {
  createRug,
  updateRug,
  deleteRug,
  getAllRugs,
  getAllRugsAdmin,
  getRugById,
} from '../controllers/rug.controller';
import { authGuard, adminGuard } from '../middlewares/auth.middleware';
import {
  createRugSchema,
  updateRugSchema,
  deleteRugSchema,
  getRugSchema,
  getAllRugsSchema,
  getAllRugsAdminSchema,
} from '../schemas/rug.schemas';

export async function rugRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get('/rugs', {
    schema: getAllRugsSchema,
  }, getAllRugs);

  fastify.get('/rugs/:id', {
    schema: getRugSchema,
  }, getRugById);

  // Admin routes - require authentication + admin guard
  fastify.post('/rugs', {
    schema: createRugSchema,
    preHandler: [authGuard, adminGuard],
  }, createRug);

  fastify.put('/rugs/:id', {
    schema: updateRugSchema,
    preHandler: [authGuard, adminGuard],
  }, updateRug);

  fastify.delete('/rugs/:id', {
    schema: deleteRugSchema,
    preHandler: [authGuard, adminGuard],
  }, deleteRug);

  fastify.get('/admin/rugs', {
    schema: getAllRugsAdminSchema,
    preHandler: [authGuard, adminGuard],
  }, getAllRugsAdmin);
}

