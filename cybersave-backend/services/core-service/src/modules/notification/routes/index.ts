import { Router } from 'express';
import { authenticateGateway } from '../../../middleware/auth';
import {
  listNotifications,
  markAsRead,
  sendNotification,
  listAdminNotifications,
  markAdminAsRead,
  markAllAdminAsRead,
} from '../controllers/notification.controller';

const router = Router();

// Citizen own routes (authenticated via gateway headers)
router.get('/notifications', authenticateGateway, listNotifications);
router.post('/notifications/read', authenticateGateway, markAsRead);

// Internal/Admin dispatch route (no auth required — called by ops-service)
router.post('/notifications/send', sendNotification);

// Admin / System notification center routes
router.get('/notifications/admin', authenticateGateway, listAdminNotifications);
router.patch('/notifications/admin/:id/read', authenticateGateway, markAdminAsRead);
router.post('/notifications/admin/read-all', authenticateGateway, markAllAdminAsRead);

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'core-service/notification', status: 'ok' } })
);

export default router;
