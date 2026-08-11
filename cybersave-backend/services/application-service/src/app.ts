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
app.use(express.json({ limit: '1mb' }));

let initialized = false;
const ensureConnected = async () => {
  if (initialized) return;
  await mongoose.connect(process.env.MONGO_URI!);
  logger.info('MongoDB connected', { service: 'application-service' });
  initialized = true;
};

app.use(async (_req, _res, next) => {
  await ensureConnected();
  next();
});

app.use('/api/v1', routes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ success: false, error: 'Internal server error', errorCode: 'INTERNAL_ERROR' });
});

import { startDraftReminderCron } from './utils/draftReminder';

if (require.main === module) {
  ensureConnected().then(() => {
    startDraftReminderCron();
    app.listen(parseInt(process.env.PORT ?? '3003', 10), () =>
      logger.info('application-service listening on port 3003')
    );
  });
}

export default app;
