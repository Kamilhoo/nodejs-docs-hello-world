import { FastifyInstance } from 'fastify';
import { uploadImage, deleteUploadedImage } from '../controllers/upload.controller';
import { authGuard, adminGuard } from '../middlewares/auth.middleware';
import { uploadImageSchema, deleteImageSchema } from '../schemas/upload.schemas';

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/upload/image', {
    schema: uploadImageSchema,
    preHandler: [authGuard, adminGuard],
  }, uploadImage);

  fastify.delete('/upload/image', {
    schema: deleteImageSchema,
    preHandler: [authGuard, adminGuard],
  }, deleteUploadedImage);
}

