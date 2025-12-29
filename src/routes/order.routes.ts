import { FastifyInstance } from 'fastify';
import {
  createOrder,
  getUserOrders,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatus,
  getOrderByIdAdmin,
} from '../controllers/order.controller';
import { authGuard, adminGuard } from '../middlewares/auth.middleware';
import {
  createOrderSchema,
  getUserOrdersSchema,
  cancelOrderSchema,
  getAllOrdersAdminSchema,
  updateOrderStatusSchema,
  getOrderByIdAdminSchema,
} from '../schemas/order.schemas';

export async function orderRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/orders',
    {
      schema: createOrderSchema,
    },
    createOrder
  );

  fastify.get(
    '/orders',
    {
      schema: getUserOrdersSchema,
    },
    getUserOrders
  );

  fastify.patch(
    '/orders/:id/cancel',
    {
      schema: cancelOrderSchema,
    },
    cancelOrder
  );

  fastify.get(
    '/admin/orders',
    {
      schema: getAllOrdersAdminSchema,
      preHandler: [authGuard, adminGuard],
    },
    getAllOrdersAdmin
  );

  fastify.patch(
    '/admin/orders/:id/status',
    {
      schema: updateOrderStatusSchema,
      preHandler: [authGuard, adminGuard],
    },
    updateOrderStatus
  );

  fastify.get(
    '/admin/orders/:id',
    {
      schema: getOrderByIdAdminSchema,
      preHandler: [authGuard, adminGuard],
    },
    getOrderByIdAdmin
  );
}


