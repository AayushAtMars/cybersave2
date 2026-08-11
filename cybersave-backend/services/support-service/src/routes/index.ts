import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTicket,
  listCitizenTickets,
  getTicketDetails,
  replyToTicket,
  listOperatorTickets,
  updateTicketStatus,
  listAdminTickets,
} from '../controllers/support.controller';

const router = Router();

// Protected routes (require user header variables forwarded from API Gateway)
router.post('/tickets', authenticate, createTicket);
router.get('/tickets', authenticate, listCitizenTickets);
router.get('/tickets/:id', authenticate, getTicketDetails);
router.post('/tickets/:id/reply', authenticate, replyToTicket);

// Admin exclusive endpoints
router.get('/admin/tickets', authenticate, listAdminTickets);

// Operator exclusive endpoints
router.get('/operator/tickets', authenticate, listOperatorTickets);
router.patch('/operator/tickets/:id/status', authenticate, updateTicketStatus);

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'support-service', status: 'ok' } })
);

export default router;
