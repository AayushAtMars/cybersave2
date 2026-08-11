import mongoose, { Document, Schema } from 'mongoose';
import { TransactionType } from '@cybersave/shared';

export interface IWallet extends Document {
  citizenId: string;
  balance: number; // in paise (smallest unit — avoids floating point issues)
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    citizenId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);

// ─── Transaction ──────────────────────────────────────────────────────────────
export interface ITransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  citizenId: string;
  applicationId?: string;
  type: TransactionType;
  amount: number;             // in paise
  description: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string; // gatewayRef — stored for reconciliation
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  idempotencyKey: string;     // prevents double-credit on webhook retry
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    citizenId: { type: String, required: true, index: true },
    applicationId: { type: String },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ citizenId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
