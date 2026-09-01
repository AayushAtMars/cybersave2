import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../modules/auth/utils/logger';

// each domain keeps its own MongoDB database
export let dbAuth: mongoose.Connection;
export let dbNotification: mongoose.Connection;
export let dbSupport: mongoose.Connection;

let initialized = false;

export const connectAllDBs = async (): Promise<void> => {
  if (initialized) return;

  try {
    dbAuth = mongoose.createConnection(config.mongoUriAuth, {
      serverSelectionTimeoutMS: 5000,
    });
    await dbAuth.asPromise();
    logger.info('MongoDB (auth) connected', { service: 'core-service' });

    dbNotification = mongoose.createConnection(config.mongoUriNotification, {
      serverSelectionTimeoutMS: 5000,
    });
    await dbNotification.asPromise();
    logger.info('MongoDB (notification) connected', { service: 'core-service' });

    dbSupport = mongoose.createConnection(config.mongoUriSupport, {
      serverSelectionTimeoutMS: 5000,
    });
    await dbSupport.asPromise();
    logger.info('MongoDB (support) connected', { service: 'core-service' });

    initialized = true;
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err });
    process.exit(1);
  }
};
