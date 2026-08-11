import { Router } from 'express';
import { authenticateGateway } from '../../../middleware/auth';
import {
  createOrder,
  createTopupOrder,
  handleWebhook,
  listTransactions,
  getWallet,
  listAdminTransactions,
} from '../controllers/payment.controller';

const router = Router();

// Webhook is public (Razorpay hits it directly)
router.post('/webhook', handleWebhook);

// Protected routes (require citizen authentication forwarded by gateway)
router.get('/wallet', authenticateGateway, getWallet);
router.post('/orders', authenticateGateway, createOrder);
router.post('/wallet/topup', authenticateGateway, createTopupOrder);
router.get('/transactions', authenticateGateway, listTransactions);

// Admin/Operator endpoints
router.get('/admin/transactions', authenticateGateway, listAdminTransactions);

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'ops-service/payment', status: 'ok' } })
);

export default router;
