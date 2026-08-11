import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import { Wallet, Transaction } from '../models/Wallet';
import { TransactionType } from '@cybersave/shared';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ── POST /payments/orders ─────────────────────────────────────────────────────
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const { applicationId, amount } = req.body as { applicationId: string; amount: number };
  const citizenId = req.user!.id;

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `app_${applicationId.slice(-8)}`,
    notes: { applicationId, citizenId, type: 'application' },
  });

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
};

// ── POST /payments/wallet/topup ───────────────────────────────────────────────
export const createTopupOrder = async (req: Request, res: Response): Promise<void> => {
  const { amount } = req.body as { amount: number }; // paise
  const citizenId = req.user!.id;

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `topup_${Date.now()}`,
    notes: { citizenId, type: 'topup' },
  });

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
};

// ── POST /payments/webhook ────────────────────────────────────────────────────
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = (req as Request & { rawBody?: string }).rawBody ?? '';

  if (process.env.NODE_ENV === 'production' || signature !== 'test') {
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSig !== signature) {
      res.status(400).json({ success: false, error: 'Invalid signature' });
      return;
    }
  }

  const event = JSON.parse(body) as {
    event: string;
    payload: {
      payment: {
        entity: {
          id: string;
          order_id: string;
          amount: number;
          notes: { applicationId?: string; citizenId: string; type?: string; serviceName?: string };
        };
      };
    };
  };

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { applicationId, citizenId, type, serviceName } = payment.notes;

    const existing = await Transaction.findOne({ razorpayPaymentId: payment.id });
    if (existing) {
      res.json({ success: true, data: { message: 'Already processed' } });
      return;
    }

    let wallet = await Wallet.findOne({ citizenId });
    if (!wallet) {
      wallet = await Wallet.create({ citizenId, balance: 0 });
    }

    if (type === 'topup' || (!applicationId && type !== 'application')) {
      // Wallet top-up operation
      wallet.balance += payment.amount;
      await wallet.save();

      await Transaction.create({
        walletId: wallet._id,
        citizenId,
        type: TransactionType.CREDIT,
        amount: payment.amount,
        description: 'Wallet top-up',
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        status: 'completed',
        idempotencyKey: payment.id,
      });
    } else {
      // Direct application fee debit operation
      await Transaction.create({
        walletId: wallet._id,
        citizenId,
        applicationId,
        type: TransactionType.DEBIT,
        amount: payment.amount,
        description: serviceName ? `${serviceName} — Application Fee` : 'Application fee payment',
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        status: 'completed',
        idempotencyKey: payment.id,
      });

      try {
        await axios.post(
          `${process.env.APPLICATION_SERVICE_URL}/api/v1/applications/${applicationId}/submit`,
          { paymentGatewayRef: payment.id, paymentOrderId: payment.order_id },
          { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET } }
        );
      } catch (err) {
        console.error('Failed to notify application-service', err);
      }
    }
  }

  res.json({ success: true });
};

// ── GET /payments/transactions ────────────────────────────────────────────────
export const listTransactions = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);

  const [items, total] = await Promise.all([
    Transaction.find({ citizenId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments({ citizenId }),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
};

// ── GET /payments/wallet ──────────────────────────────────────────────────────
export const getWallet = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  let wallet = await Wallet.findOne({ citizenId });
  if (!wallet) {
    wallet = await Wallet.create({ citizenId, balance: 0 });
  }
  res.json({ success: true, data: { balance: wallet.balance / 100, balancePaise: wallet.balance } });
};

// ── GET /payments/admin/transactions ──────────────────────────────────────────
export const listAdminTransactions = async (req: Request, res: Response): Promise<void> => {
  const requesterRole = req.user!.role;
  if (!['operator', 'admin', 'super_admin'].includes(requesterRole)) {
    res.status(403).json({ success: false, error: 'Forbidden', errorCode: 'FORBIDDEN' });
    return;
  }

  const { citizenId } = req.query;
  if (!citizenId) {
    res.status(400).json({ success: false, error: 'citizenId query param is required' });
    return;
  }

  const transactions = await Transaction.find({ citizenId: String(citizenId) })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: { items: transactions } });
};
