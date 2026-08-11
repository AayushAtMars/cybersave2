import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listNotifications,
  markAsRead,
  sendNotification,
  listAdminNotifications,
  markAdminAsRead,
  markAllAdminAsRead,
} from '../controllers/notification.controller';

const router = Router();

// Citizen own routes
router.get('/notifications', authenticate, listNotifications);
router.post('/notifications/read', authenticate, markAsRead);

// Internal/Admin dispatch route
router.post('/notifications/send', sendNotification);

// Admin / System notification center routes
router.get('/notifications/admin', authenticate, listAdminNotifications);
router.patch('/notifications/admin/:id/read', authenticate, markAdminAsRead);
router.post('/notifications/admin/read-all', authenticate, markAllAdminAsRead);

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'notification-service', status: 'ok' } })
);

export default router;
