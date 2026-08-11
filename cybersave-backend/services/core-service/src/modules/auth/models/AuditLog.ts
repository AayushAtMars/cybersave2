import mongoose, { Document, Schema } from 'mongoose';

export type AuditCategory = 'login' | 'document' | 'system' | 'user' | 'support' | 'payment';
export type AuditStatus = 'success' | 'failed' | 'warning';

export interface IAuditLog extends Document {
  timestamp: Date;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  category: AuditCategory;
  resource: string;
  ipAddress: string;
  status: AuditStatus;
  meta?: Record<string, any>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: { type: Date, default: Date.now },
    userId: { type: String },
    userName: { type: String, required: true },
    userRole: { type: String, required: true, default: 'citizen' },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ['login', 'document', 'system', 'user', 'support', 'payment'],
      required: true,
    },
    resource: { type: String, required: true },
    ipAddress: { type: String, default: 'Unknown' },
    status: { type: String, enum: ['success', 'failed', 'warning'], required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: false }
);

// TTL index — keep audit logs for 1 year (365 days)
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ category: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
