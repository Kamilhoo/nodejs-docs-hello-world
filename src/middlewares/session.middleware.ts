import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { LiteUser } from '../models/liteUser.model';
import { AuthRequest } from '../types';

export const sessionMiddleware = async (
  request: AuthRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    // Priority 1: Get sessionId from header (frontend sends it)
    let sessionId = request.headers['sessionid'] as string || request.headers['Sessionid'] as string;

    // Priority 2: Get sessionId from cookie if header not present
    if (!sessionId && request.cookies?.session_id) {
      sessionId = request.cookies.session_id;
    }

    // Priority 3: If no sessionId, create a new one and set cookie
    // NOTE: We don't create LiteUser here - that's done via POST /auth/session API
    if (!sessionId) {
      sessionId = uuidv4();
      
      // Set cookie only - guest user will be created via API call
      reply.setCookie('session_id', sessionId, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
        path: '/',
      });
    }

    // Attach sessionId to request (from header, cookie, or newly created)
    request.sessionId = sessionId;
  } catch (error) {
    console.error('Session middleware error:', error);
    // Don't block request, just log error
  }
};

