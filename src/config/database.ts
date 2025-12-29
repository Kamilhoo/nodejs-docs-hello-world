import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Please check:');
    console.error('  1. MongoDB Atlas IP whitelist settings (allow all IPs: 0.0.0.0/0)');
    console.error('  2. Internet connection');
    console.error('  3. MongoDB connection string in .env file');
    process.exit(1);
  }
};

