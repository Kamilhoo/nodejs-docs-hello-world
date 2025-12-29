import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyQs from 'fastify-qs';
import mongoose from 'mongoose';
import path from 'path';
import { connectDB } from './config/database';
import { sessionMiddleware } from './middlewares/session.middleware';
import { authRoutes } from './routes/auth.routes';
import { rugRoutes } from './routes/rug.routes';
import { orderRoutes } from './routes/order.routes';
import { uploadRoutes } from './routes/upload.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { cartRoutes } from './routes/cart.routes';
import { shippingFeeRoutes } from './routes/shippingFee.routes';
import { bannerRoutes } from './routes/banner.routes';

const server = Fastify({
  logger: false, // Disable Fastify logger so console.log works properly
});

// Register fastify-qs to properly parse array query parameters (colors[], sizes[], etc.)
server.register(fastifyQs);

// Register CORS plugin FIRST (must be before all other plugins)
server.register(fastifyCors, {
  origin: true, // Allow all origins in development (change to specific origins in production)
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Sessionid', // Custom header from frontend
    'sessionid', // Lowercase variant
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Set-Cookie'],
  preflight: true,
  strictPreflight: false,
});

// Register cookie plugin
server.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'your-cookie-secret-change-in-production',
});

// Register static file serving for uploaded images
// On Vercel, use /tmp/uploads (writable), otherwise use project root/uploads
const uploadsRoot = process.env.VERCEL 
  ? path.join('/tmp', 'uploads')
  : path.join(process.cwd(), 'uploads');

server.register(fastifyStatic, {
  root: uploadsRoot,
  prefix: '/uploads',
});

// Global session middleware (runs on all routes)
server.addHook('onRequest', async (request, reply) => {
  await sessionMiddleware(request as any, reply);
});

// Health check route
server.get('/health', async (request, reply) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return {
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  };
});

// Root route
server.get('/', async (request, reply) => {
  return {
    message: 'Dastkar Rugs Backend API is running!',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
  };
});

// Register routes
server.register(authRoutes);
server.register(uploadRoutes);
server.register(rugRoutes);
server.register(orderRoutes);
server.register(analyticsRoutes);
server.register(cartRoutes);
server.register(shippingFeeRoutes);
server.register(bannerRoutes);

// Export server for Vercel/serverless (if needed)
export default server;

// Start server (for Railway/Render/local development)
const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Fastify server
    const port = Number(process.env.PORT) || 5000;
    const host = '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 Server is running on http://localhost:${port}`);
  } catch (err: any) {
    console.error('Server error:', err);
    
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${process.env.PORT || 5000} is already in use.`);
      console.error(`   Solution: Change PORT in .env file or stop the process using that port`);
    }
    
    process.exit(1);
  }
};

// Start server (for Railway/Render/local - not for Vercel serverless)
// Vercel uses serverless functions, Railway/Render run this as a service
if (!process.env.VERCEL) {
  start();
}

