import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { connectDB } from './config/db';
import { redis } from './config/redis';
import authRoutes from './routes/auth.routes';
import { logger } from './utils/logger';

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────────────────────
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

// ── DB + Redis: lazy init for Vercel serverless ───────────────────────────────────────────
// On Vercel the function is stateless; connections are reused across warm invocations
// but we never block the import for them.
let initialized = false;
const ensureConnected = async () => {
  if (initialized) return;
  await connectDB();
  // @upstash/redis is HTTP-based — no connect() call needed
  initialized = true;
};

app.use(async (_req, _res, next) => {
  await ensureConnected();
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);

// ── Global error handler ─────────────────────────────────────────────────────────────────
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

// ── Local dev server (not used on Vercel) ─────────────────────────────────────────────
if (require.main === module) {
  ensureConnected().then(() => {
    app.listen(config.port, () => {
      logger.info(`auth-service listening on port ${config.port}`, { env: config.nodeEnv });
    });
  }).catch((err) => {
    logger.error('Failed to start auth-service', { error: err });
    process.exit(1);
  });
}

// ── Export for Vercel serverless (api/index.ts re-exports this) ─────────────────────
export default app;
