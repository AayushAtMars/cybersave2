import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('MongoDB connected', { service: 'auth-service' });
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err });
    process.exit(1);
  }
};
