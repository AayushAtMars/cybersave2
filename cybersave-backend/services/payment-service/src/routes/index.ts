import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
router.get('/wallet', authenticate, getWallet);
router.post('/orders', authenticate, createOrder);
router.post('/wallet/topup', authenticate, createTopupOrder);
router.get('/transactions', authenticate, listTransactions);

// Admin/Operator endpoints
router.get('/admin/transactions', authenticate, listAdminTransactions);

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'payment-service', status: 'ok' } })
);

export default router;
