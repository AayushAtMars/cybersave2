import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../modules/application/utils/logger';

export let dbApplication: mongoose.Connection;
export let dbDocument: mongoose.Connection;
export let dbPayment: mongoose.Connection;

let initialized = false;

export const connectAllDBs = async (): Promise<void> => {
  if (initialized) return;

  try {
    dbApplication = mongoose.createConnection(config.mongoUriApplication, {
      serverSelectionTimeoutMS: 5000,
    });
    await dbApplication.asPromise();
    logger.info('MongoDB (application) connected');

    dbDocument = mongoose.createConnection(config.mongoUriDocument, {
      serverSelectionTimeoutMS: 5000,
    });
    await dbDocument.asPromise();
    logger.info('MongoDB (document) connected');

    dbPayment = mongoose.createConnection(config.mongoUriPayment, {
      serverSelectionTimeoutMS: 5000,
    });
    await dbPayment.asPromise();
    logger.info('MongoDB (payment) connected');

    initialized = true;
  } catch (err) {
    logger.error('MongoDB connection failed in ops-service', { error: err });
    process.exit(1);
  }
};
