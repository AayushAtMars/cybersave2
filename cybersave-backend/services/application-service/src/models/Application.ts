import mongoose, { Document, Schema } from 'mongoose';
import { ApplicationStatus } from '@cybersave/shared';

export interface ITimelineEvent {
  event: string;
  actorId: string;
  actorRole: string;
  note?: string;
  timestamp: Date;
}

export interface IApplication extends Document {
  applicationRefNo: string;
  citizenId: string;
  serviceId: mongoose.Types.ObjectId;
  serviceName: string;
  status: ApplicationStatus;
  // Step data
  applicantName: string;
  applicantPhone: string;
  applicantDob?: string;
  applicantGender?: string;
  applicantAddress?: Record<string, unknown>;
  formData: Record<string, unknown>; // service-specific dynamic fields
  documentIds: string[];             // IDs from document-service
  reviewConfirmed: boolean;
  declarationAccepted: boolean;
  // Payment
  totalAmount: number;
  govtFee: number;
  convenienceFee: number;
  paymentOrderId?: string;
  paymentGatewayRef?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  // Operations
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  slaDeadline?: Date;
  rejectionReason?: string;
  verifiedDocuments: Array<{
    documentId: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
  }>;
  timeline: ITimelineEvent[];
  currentStep: number; // 1–5 for wizard tracking
  completedAt?: Date;
  certificateUrl?: string;   // URL of the generated/uploaded certificate (set by admin)
  department?: string;       // Department handling the application
  lastDraftReminderSentAt?: Date; // Last time a reminder was sent to complete this draft
  createdAt: Date;
  updatedAt: Date;
}


const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    event: { type: String, required: true },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    applicationRefNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Format: CS-YYYYMMDD-XXXXX (generated on create)
    },
    citizenId: { type: String, required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.DRAFT,
      index: true,
    },
    // Wizard steps
    applicantName: { type: String },
    applicantPhone: { type: String },
    applicantDob: { type: String },
    applicantGender: { type: String },
    applicantAddress: { type: Schema.Types.Mixed },
    formData: { type: Schema.Types.Mixed, default: {} },
    documentIds: { type: [String], default: [] },
    reviewConfirmed: { type: Boolean, default: false },
    declarationAccepted: { type: Boolean, default: false },
    // Payment
    totalAmount: { type: Number, required: true },
    govtFee: { type: Number, required: true },
    convenienceFee: { type: Number, required: true },
    paymentOrderId: { type: String },
    paymentGatewayRef: { type: String },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    // Operations
    assignedOperatorId: { type: String },
    assignedOperatorName: { type: String },
    slaDeadline: { type: Date },
    rejectionReason: { type: String },
    verifiedDocuments: [
      {
        documentId: { type: String, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        comments: { type: String },
      },
    ],
    timeline: { type: [TimelineEventSchema], default: [] },
    currentStep: { type: Number, default: 1, min: 1, max: 5 },
    completedAt: { type: Date },
    certificateUrl: { type: String },   // Supabase / S3 URL set by admin after approval
    department: { type: String },
    lastDraftReminderSentAt: { type: Date },
  },
  { timestamps: true }
);


// ── Indexes for common query patterns ─────────────────────────────────────────
ApplicationSchema.index({ citizenId: 1, status: 1 });
ApplicationSchema.index({ assignedOperatorId: 1, status: 1 });
ApplicationSchema.index({ slaDeadline: 1, status: 1 }); // SLA cron query

// ── Helper: append a timeline event ──────────────────────────────────────────
ApplicationSchema.methods.addTimelineEvent = function (
  event: string,
  actorId: string,
  actorRole: string,
  note?: string
) {
  this.timeline.push({ event, actorId, actorRole, note, timestamp: new Date() });
};

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
