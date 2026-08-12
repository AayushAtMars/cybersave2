import { Router } from 'express';
import { authenticateGateway } from '../../../middleware/auth';
import {
  createTicket,
  listCitizenTickets,
  getTicketDetails,
  replyToTicket,
  listOperatorTickets,
  updateTicketStatus,
  listAdminTickets,
  addInternalNote,
  reassignTicket,
} from '../controllers/support.controller';

const router = Router();

// Protected routes (require user header variables forwarded from API Gateway)
router.post('/tickets', authenticateGateway, createTicket);
router.get('/tickets', authenticateGateway, listCitizenTickets);
router.get('/tickets/:id', authenticateGateway, getTicketDetails);
router.post('/tickets/:id/reply', authenticateGateway, replyToTicket);

// Admin exclusive endpoints
router.get('/admin/tickets', authenticateGateway, listAdminTickets);

// Operator exclusive endpoints
router.get('/operator/tickets', authenticateGateway, listOperatorTickets);
router.patch('/operator/tickets/:id/status', authenticateGateway, updateTicketStatus);
router.post('/operator/tickets/:id/notes', authenticateGateway, addInternalNote);
router.patch('/operator/tickets/:id/reassign', authenticateGateway, reassignTicket);

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'core-service/support', status: 'ok' } })
);

export default router;
