import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt.util';
import { AuthRequest } from '../types';

export const authGuard = async (
  request: AuthRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        message: 'No token provided. Please login first.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);
      request.user = decoded;
    } catch (error: any) {
      // Check if token was revoked (blacklisted)
      if (error.message === 'Token has been revoked') {
        return reply.status(401).send({
          success: false,
          message: 'Token has been revoked. Please login again.',
        });
      }
      return reply.status(401).send({
        success: false,
        message: 'Invalid or expired token. Please login again.',
      });
    }
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Authentication error',
    });
  }
};

export const adminGuard = async (
  request: AuthRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!request.user.isAdmin) {
    return reply.status(403).send({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
};

