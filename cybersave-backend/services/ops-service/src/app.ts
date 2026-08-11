import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { connectAllDBs } from './config/db';
import { registerModels } from './config/models';

import applicationRoutes from './modules/application/routes';
import documentRoutes from './modules/document/routes';
import paymentRoutes from './modules/payment/routes';

import { logger } from './modules/application/utils/logger';
import { startDraftReminderCron } from './modules/application/utils/draftReminder';

const app = express();

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
app.use(express.json({ limit: '5mb' }));

let initialized = false;
const ensureConnected = async () => {
  if (initialized) return;
  await connectAllDBs();
  registerModels();
  initialized = true;
};

app.use(async (_req, _res, next) => {
  try {
    await ensureConnected();
    next();
  } catch (err) {
    next(err);
  }
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/v1', applicationRoutes); // mounts /services, /applications
app.use('/api/v1', documentRoutes);    // mounts /documents
app.use('/api/v1/payments', paymentRoutes); // mounts /payments

// ── Global health check ────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'ops-service', status: 'ok', version: '1.0.0' } })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error('Unhandled error in ops-service', { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
);

// ── Server startup (Render long-running process) ───────────────────────────────
if (require.main === module) {
  ensureConnected()
    .then(() => {
      // Start background cron jobs (e.g., draft reminders)
      startDraftReminderCron();

      app.listen(config.port, () => {
        logger.info(`ops-service listening on port ${config.port}`, { env: config.nodeEnv });
      });
    })
    .catch((err) => {
      logger.error('Failed to start ops-service', { error: err });
      process.exit(1);
    });
}

export default app;
