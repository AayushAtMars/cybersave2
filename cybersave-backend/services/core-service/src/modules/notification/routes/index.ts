import { Router } from 'express';
import { authenticateGateway } from '../../../middleware/auth';
import {
  listNotifications,
  markAsRead,
  sendNotification,
  listAdminNotifications,
  markAdminAsRead,
  markAllAdminAsRead,
  streamAdminNotifications,
  broadcastSystemUpdate,
  internalAdminAlert,
} from '../controllers/notification.controller';

const router = Router();

// Citizen own routes (authenticated via gateway headers)
router.get('/notifications', authenticateGateway, listNotifications);
router.post('/notifications/read', authenticateGateway, markAsRead);

// Internal/Admin dispatch route (no auth required — called by ops-service)
router.post('/notifications/send', sendNotification);
router.post('/notifications/internal/admin-alert', internalAdminAlert);

// Admin / System notification center routes
router.get('/notifications/admin', authenticateGateway, listAdminNotifications);
router.get('/notifications/admin/stream', authenticateGateway, streamAdminNotifications);
router.patch('/notifications/admin/:id/read', authenticateGateway, markAdminAsRead);
router.post('/notifications/admin/read-all', authenticateGateway, markAllAdminAsRead);
router.post('/notifications/admin/broadcast', authenticateGateway, broadcastSystemUpdate);

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'core-service/notification', status: 'ok' } })
);

export default router;
