import { FastifyInstance } from 'fastify';
import {
  googleLogin,
  getCurrentUser,
  updateProfile,
  logout,
  sendOTP,
  verifyOTP,
  getAllUsers,
} from '../controllers/auth.controller';
import { authGuard, adminGuard } from '../middlewares/auth.middleware';
import {
  googleLoginSchema,
  getCurrentUserSchema,
  updateProfileSchema,
  logoutSchema,
  sendOTPSchema,
  verifyOTPSchema,
  getAllUsersSchema,
} from '../schemas/auth.schemas';

export async function authRoutes(fastify: FastifyInstance) {
  // Google login
  fastify.post('/auth/google', {
    schema: googleLoginSchema,
  }, googleLogin);

  // Get current user - requires authentication
  fastify.get('/auth/me', {
    schema: getCurrentUserSchema,
    preHandler: [authGuard],
  }, getCurrentUser);

  // Update profile - After login, update address, country, and phoneNumber
  fastify.put('/auth/profile', {
    schema: updateProfileSchema,
    preHandler: [authGuard],
  }, updateProfile);

  // Logout
  fastify.post('/auth/logout', {
    schema: logoutSchema,
  }, logout);

  // Send OTP (for register/login)
  fastify.post('/auth/send-otp', {
    schema: sendOTPSchema,
  }, sendOTP);

  // Verify OTP (unified register/login)
  fastify.post('/auth/verify-otp', {
    schema: verifyOTPSchema,
  }, verifyOTP);

  // Get all users (Admin only) - with search and pagination
  fastify.get('/auth/admin/users', {
    schema: getAllUsersSchema,
    preHandler: [authGuard, adminGuard],
  }, getAllUsers);
}

