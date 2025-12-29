import { FastifyInstance } from 'fastify';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cart.controller';
import {
  getCartSchema,
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  clearCartSchema,
} from '../schemas/cart.schemas';

export async function cartRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/cart',
    {
      schema: getCartSchema,
    },
    getCart
  );

  fastify.post(
    '/cart',
    {
      schema: addToCartSchema,
    },
    addToCart
  );

  fastify.put(
    '/cart/item/:cartItemId',
    {
      schema: updateCartItemSchema,
    },
    updateCartItem
  );

  fastify.delete(
    '/cart/item/:cartItemId',
    {
      schema: removeCartItemSchema,
    },
    removeCartItem
  );

  fastify.delete(
    '/cart',
    {
      schema: clearCartSchema,
    },
    clearCart
  );
}


