import mongoose, { Schema } from 'mongoose';
import { dbApplication, dbDocument, dbPayment } from './db';
import { ApplicationStatus, DocumentStatus, TransactionType } from '@cybersave/shared';

// ── Application Module Schemas ──────────────────────────────────────────────

const TimelineEventSchema = new Schema(
  {
    event: { type: String, required: true },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ApplicationSchema = new Schema(
  {
    applicationRefNo: { type: String, required: true, unique: true, index: true },
    citizenId: { type: String, required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true },
    status: { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.DRAFT, index: true },
    applicantName: { type: String },
    applicantPhone: { type: String },
    applicantDob: { type: String },
    applicantGender: { type: String },
    applicantAddress: { type: Schema.Types.Mixed },
    formData: { type: Schema.Types.Mixed, default: {} },
    documentIds: { type: [String], default: [] },
    reviewConfirmed: { type: Boolean, default: false },
    declarationAccepted: { type: Boolean, default: false },
    totalAmount: { type: Number, required: true },
    govtFee: { type: Number, required: true },
    convenienceFee: { type: Number, required: true },
    paymentOrderId: { type: String },
    paymentGatewayRef: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
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
    certificateUrl: { type: String },
    department: { type: String },
    lastDraftReminderSentAt: { type: Date },
  },
  { timestamps: true }
);

ApplicationSchema.index({ citizenId: 1, status: 1 });
ApplicationSchema.index({ assignedOperatorId: 1, status: 1 });
ApplicationSchema.index({ slaDeadline: 1, status: 1 });

ApplicationSchema.methods.addTimelineEvent = function (
  event: string,
  actorId: string,
  actorRole: string,
  note?: string
) {
  this.timeline.push({ event, actorId, actorRole, note, timestamp: new Date() });
};

const RequiredDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    mandatory: { type: Boolean, default: true },
    acceptedFormats: { type: [String], default: ['pdf', 'jpg', 'jpeg', 'png'] },
    maxSizeMb: { type: Number, default: 5 },
  },
  { _id: false }
);

const FormFieldSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'select', 'date', 'aadhaar'], required: true },
    placeholder: { type: String },
    required: { type: Boolean, default: true },
    options: { type: [String] },
    maxLength: { type: Number },
  },
  { _id: false }
);

const ServiceSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    department: { type: String, required: true },
    govtFee: { type: Number, required: true, min: 0 },
    convenienceFee: { type: Number, required: true, min: 0 },
    slaHours: { type: Number, required: true, min: 1 },
    eligibility: { type: [String], default: [] },
    requiredDocuments: { type: [RequiredDocumentSchema], default: [] },
    formFields: { type: [FormFieldSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ServiceSchema.virtual('totalFee').get(function (this: any) {
  return this.govtFee + this.convenienceFee;
});

// ── Document Module Schemas ──────────────────────────────────────────────────

const DocumentSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String },
    applicationId: { type: String, index: true },
    storageKey: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    documentCategory: {
      type: String,
      enum: ['id_proof', 'address_proof', 'birth_proof', 'income_proof', 'proof', 'certificate', 'photo', 'signature', 'other'],
      required: true,
    },
    verifiedStatus: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.PENDING },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    scheduledDeleteAt: { type: Date, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

DocumentSchema.index({ ownerId: 1, documentCategory: 1 });
DocumentSchema.index({ applicationId: 1, verifiedStatus: 1 });

// ── Payment Module Schemas ────────────────────────────────────────────────────

const WalletSchema = new Schema(
  {
    citizenId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const TransactionSchema = new Schema(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    citizenId: { type: String, required: true, index: true },
    applicationId: { type: String },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ citizenId: 1, createdAt: -1 });

// ── Model registration ────────────────────────────────────────────────────────

let Application: mongoose.Model<any>;
let Service: mongoose.Model<any>;
let DocumentRecord: mongoose.Model<any>;
let Wallet: mongoose.Model<any>;
let Transaction: mongoose.Model<any>;

export const registerModels = () => {
  Application = dbApplication.model('Application', ApplicationSchema);
  Service = dbApplication.model('Service', ServiceSchema);
  DocumentRecord = dbDocument.model('Document', DocumentSchema);
  Wallet = dbPayment.model('Wallet', WalletSchema);
  Transaction = dbPayment.model('Transaction', TransactionSchema);
};

export const getModels = () => ({
  Application,
  Service,
  DocumentRecord,
  Wallet,
  Transaction,
});
