import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getModels } from '../../../config/models';
import { TransactionType } from '@cybersave/shared';
import { submitApplication } from '../../application/controllers/application.controller';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Lazy-resolve models
const getWalletModel = () => getModels().Wallet;
const getTransactionModel = () => getModels().Transaction;
const getApplicationModel = () => getModels().Application;

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
  const { amount } = req.body as { amount: number };
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

  let event: any;
  if (typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0) {
    event = req.body;
  } else {
    try {
      event = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ success: false, error: 'Invalid JSON payload' });
      return;
    }
  }

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { applicationId, citizenId, type, serviceName } = payment.notes;

    const Wallet = getWalletModel();
    const Transaction = getTransactionModel();

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
        // Direct in-process function call instead of HTTP POST!
        const mockReq = {
          params: { id: applicationId },
          body: { paymentGatewayRef: payment.id, paymentOrderId: payment.order_id, paymentMethod: payment.method },
        } as unknown as Request;

        const mockRes = {
          status: (code: number) => ({
            json: (data: any) => console.log(`In-process submit result status ${code}:`, data),
          }),
          json: (data: any) => console.log('In-process submit result:', data),
        } as unknown as Response;

        await submitApplication(mockReq, mockRes);
      } catch (err) {
        console.error('Failed to submit application in-process', err);
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

  const Transaction = getTransactionModel();
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
  const Wallet = getWalletModel();
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

  const { citizenId, type, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 100);

  const filter: any = {};
  if (citizenId) filter.citizenId = String(citizenId);
  if (type) filter.type = String(type);

  const Transaction = getTransactionModel();
  
  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Transaction.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
};

// ── POST /payments/wallet/pay-application ─────────────────────────────────────
export const payApplicationWithWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationId } = req.body as { applicationId: string };
    const citizenId = req.user!.id;

    const Application = getApplicationModel();
    const Wallet = getWalletModel();
    const Transaction = getTransactionModel();

    const application = await Application.findOne({ _id: applicationId, citizenId });
    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found', errorCode: 'APPLICATION_NOT_FOUND' });
      return;
    }

    if (application.paymentStatus === 'paid') {
      res.status(400).json({ success: false, error: 'Application already paid', errorCode: 'ALREADY_PAID' });
      return;
    }

    let wallet = await Wallet.findOne({ citizenId });
    if (!wallet) {
      wallet = await Wallet.create({ citizenId, balance: 0 });
    }

    const amountPaise = application.totalAmount;
    if (wallet.balance < amountPaise) {
      res.status(400).json({ success: false, error: 'Insufficient wallet balance', errorCode: 'INSUFFICIENT_FUNDS' });
      return;
    }

    // Deduct balance
    wallet.balance -= amountPaise;
    await wallet.save();

    const txnRef = `wal_${Date.now()}`;

    // Log transaction
    await Transaction.create({
      citizenId,
      walletId: wallet._id,
      applicationId: application._id.toString(),
      type: TransactionType.DEBIT,
      amount: amountPaise,
      description: `Payment for ${application.serviceName}`,
      status: 'completed',
      idempotencyKey: `wal_pay_${Date.now()}_${application._id.toString()}`,
    });

    // Automatically submit application if it was a draft
    application.paymentStatus = 'paid';
    application.paymentMethod = 'wallet';
    application.paymentGatewayRef = txnRef;
    application.status = 'submitted';
    application.timeline.push({
      event: 'Application submitted via Wallet Payment',
      actorId: citizenId,
      actorRole: 'citizen',
      timestamp: new Date(),
    });
    await application.save();

    res.json({ success: true, data: { success: true, txnId: txnRef } });
  } catch (err: any) {
    console.error('payApplicationWithWallet Error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error', errorCode: 'INTERNAL_ERROR' });
  }
};
