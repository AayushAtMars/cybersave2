import { Router } from 'express';
import { authenticateGateway } from '../../../middleware/auth';
import {
  requestUploadUrl,
  confirmUpload,
  getDocumentDownloadUrl,
  deleteDocument,
  runRetentionCleanup,
  listDocuments,
  listAdminDocuments,
} from '../controllers/document.controller';

const router = Router();

// Citizen document endpoints
router.get('/documents', authenticateGateway, listDocuments);
router.get('/documents/admin/all', authenticateGateway, listAdminDocuments);
router.post('/documents/upload-url', authenticateGateway, requestUploadUrl);
router.post('/documents/confirm', authenticateGateway, confirmUpload);
router.get('/documents/:id/download-url', authenticateGateway, getDocumentDownloadUrl);
router.delete('/documents/:id', authenticateGateway, deleteDocument);

// Cron retention endpoint
router.post('/documents/cron/retention', runRetentionCleanup);

router.get('/documents/health', (_req, res) => {
  res.json({ success: true, data: { service: 'ops-service/document', status: 'ok' } });
});

export default router;
