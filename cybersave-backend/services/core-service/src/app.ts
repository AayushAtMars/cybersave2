import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { connectAllDBs } from './config/db';
import { registerModels } from './config/models';
import authRoutes from './modules/auth/routes/auth.routes';
import notificationRoutes from './modules/notification/routes';
import supportRoutes from './modules/support/routes';
import { logger } from './modules/auth/utils/logger';

const app = express();

// security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// DB init
let initialized = false;
export const ensureConnected = async () => {
  if (initialized) return;
  await connectAllDBs();
  registerModels();
  initialized = true;
};

// middleware to ensure DB connections are ready before any request
app.use(async (_req, _res, next) => {
  try {
    await ensureConnected();
    next();
  } catch (err) {
    next(err);
  }
});

//Routes 
// all original prefixes preserved — gateway routes don't need to change
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', notificationRoutes);   // /api/v1/notifications/*
app.use('/api/v1/support', supportRoutes); // /api/v1/support/*

// global health check
app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'core-service', status: 'ok', version: '1.0.0' } })
);

// global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
);

// server startup
if (require.main === module) {
  ensureConnected()
    .then(() => {
      app.listen(config.port, () => {
        logger.info(`core-service listening on port ${config.port}`, { env: config.nodeEnv });
      });
    })
    .catch((err) => {
      logger.error('Failed to start core-service', { error: err });
      process.exit(1);
    });
}

export default app;
