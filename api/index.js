// Vercel Serverless Function Handler
// Set VERCEL env before requiring to prevent auto-start
process.env.VERCEL = '1';

const fs = require('fs');
const path = require('path');
const { connectDB } = require('../dist/config/database.js');

// Try to create uploads directory (will fail gracefully on Vercel)
// Vercel serverless functions have read-only filesystem in /var/task/
try {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const rugsDir = path.join(uploadsDir, 'rugs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(rugsDir)) {
    fs.mkdirSync(rugsDir, { recursive: true });
  }
} catch (error) {
  // Ignore error - Vercel doesn't allow writing to /var/task/
  // This is expected behavior on Vercel serverless functions
  // fastifyStatic plugin will handle this gracefully
  console.log('⚠️ Cannot create uploads directory (expected on Vercel)');
}

let isConnected = false;
let server = null;
let serverReady = false;

const connectIfNeeded = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('✅ MongoDB connected for Vercel');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      // Don't set isConnected to true, so it will retry on next request
    }
  }
};

const getServer = async () => {
  if (!server) {
    try {
      // Import server after setting VERCEL env
      const serverModule = require('../dist/index.js');
      server = serverModule.default || serverModule;
    } catch (error) {
      console.error('❌ Failed to load server:', error);
      throw error;
    }
  }
  return server;
};

const ensureServerReady = async () => {
  if (!serverReady) {
    const fastifyServer = await getServer();
    try {
      await fastifyServer.ready();
      serverReady = true;
      console.log('✅ Fastify server ready');
    } catch (error) {
      console.error('❌ Server ready error:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }
};

module.exports = async (req, res) => {
  try {
    // Connect to MongoDB
    await connectIfNeeded();
    
    // Ensure server is ready
    await ensureServerReady();
    
    // Get the server instance
    const fastifyServer = await getServer();
    
    // Use Fastify's underlying Node.js HTTP server to handle the request
    fastifyServer.server.emit('request', req, res);
  } catch (error) {
    console.error('❌ Vercel handler error:', error);
    console.error('Error stack:', error.stack);
    
    // Send error response if headers not sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message || 'Server error occurred'
      });
    }
  }
};

