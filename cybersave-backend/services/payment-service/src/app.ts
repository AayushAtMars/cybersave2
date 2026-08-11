import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes/index';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  credentials: true,
}));

// Webhook requires raw body for verification (rules.md §3)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/payments/webhook') {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      (req as any).rawBody = data;
      next();
    });
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});

let initialized = false;
const ensureConnected = async () => {
  if (initialized) return;
  await mongoose.connect(process.env.MONGO_URI!);
  logger.info('MongoDB connected', { service: 'payment-service' });
  initialized = true;
};

app.use(async (_req, _res, next) => {
  await ensureConnected();
  next();
});

app.use('/api/v1/payments', routes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error', errorCode: 'INTERNAL_ERROR' });
});

if (require.main === module) {
  ensureConnected().then(() =>
    app.listen(parseInt(process.env.PORT ?? '3005', 10), () =>
      logger.info('payment-service listening on port 3005')
    )
  );
}

export default app;
