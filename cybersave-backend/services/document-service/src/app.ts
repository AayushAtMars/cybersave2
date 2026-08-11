import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import {
  requestUploadUrl,
  confirmUpload,
  getDocumentDownloadUrl,
  deleteDocument,
  runRetentionCleanup,
  listDocuments,
  listAdminDocuments,
} from './controllers/document.controller';
import { authenticate } from './middleware/auth';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console()],
});

const app = express();

app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

let initialized = false;
const ensureConnected = async () => {
  if (initialized) return;
  await mongoose.connect(process.env.MONGO_URI!);
  logger.info('MongoDB connected');
  initialized = true;
};

app.use(async (_req, _res, next) => {
  await ensureConnected();
  next();
});

// Citizen document endpoints
app.get('/api/v1/documents', authenticate, listDocuments);
app.get('/api/v1/documents/admin/all', authenticate, listAdminDocuments);
app.post('/api/v1/documents/upload-url', authenticate, requestUploadUrl);
app.post('/api/v1/documents/confirm', authenticate, confirmUpload);
app.get('/api/v1/documents/:id/download-url', authenticate, getDocumentDownloadUrl);
app.delete('/api/v1/documents/:id', authenticate, deleteDocument);

// Cron retention endpoint
app.post('/api/v1/documents/cron/retention', runRetentionCleanup);

app.get('/api/v1/documents/health', (_req, res) => {
  res.json({ success: true, data: { service: 'document-service', status: 'ok' } });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Document service error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

if (require.main === module) {
  ensureConnected().then(() =>
    app.listen(parseInt(process.env.PORT ?? '3004', 10), () =>
      logger.info('document-service listening on port 3004')
    )
  );
}

export default app;
