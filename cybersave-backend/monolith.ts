import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import winston from 'winston';

// Import consolidated services
import coreApp from './services/core-service/src/app';
import opsApp from './services/ops-service/src/app';

import { startDraftReminderCron } from './services/ops-service/src/modules/application/utils/draftReminder';

const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console()],
});

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Gateway Auth Middleware
const gatewayAuthenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized', errorCode: 'UNAUTHORIZED' });
    return;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_ACCESS_SECRET!) as {
      sub: string;
      role: string;
    };
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-role'] = payload.role;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token', errorCode: 'TOKEN_INVALID' });
  }
};

// Route security gate: run gatewayAuthenticate on non-public routes
app.use((req, res, next) => {
  const publicPaths = [
    '/api/v1/auth/send-otp',
    '/api/v1/auth/verify-otp',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/operator/login',
    '/api/v1/auth/health',
    '/api/v1/services/health',
    '/api/v1/documents/health',
    '/api/v1/payments/health',
    '/api/v1/notifications/health',
    '/api/v1/support/health',
    '/health',
  ];
  
  const isServicesPublic = req.path.startsWith('/api/v1/services') && req.method === 'GET';
  const isWebhook = req.path === '/api/v1/payments/webhook';

  if (publicPaths.includes(req.path) || isServicesPublic || isWebhook || req.path.endsWith('/health')) {
    return next();
  }

  gatewayAuthenticate(req, res, next);
});

// Mount consolidated services as sub-apps
app.use(coreApp);
app.use(opsApp);

// Root Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', service: 'monolith' });
});

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
  logger.error('Missing MONGO_URI environment variable');
  process.exit(1);
}

// Connect to MongoDB once globally and start the server + crons
mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('Monolith MongoDB connected successfully');
    
    // Start background jobs/crons
    startDraftReminderCron();
    
    app.listen(PORT, () => {
      logger.info(`Monolithic production server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB', { error: err });
    process.exit(1);
  });
