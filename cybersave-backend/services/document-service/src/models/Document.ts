import mongoose, { Document, Schema } from 'mongoose';
import { DocumentStatus } from '@cybersave/shared';

export interface IDocument extends Document {
  ownerId: string;           // citizenId
  ownerName?: string;
  applicationId?: string;
  storageKey: string;        // Key in Supabase bucket (never a public URL)
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  documentCategory: 'id_proof' | 'address_proof' | 'birth_proof' | 'income_proof' | 'proof' | 'certificate' | 'photo' | 'signature' | 'other';
  verifiedStatus: DocumentStatus;
  verifiedBy?: string;       // operatorId who verified
  verifiedAt?: Date;
  rejectionReason?: string;
  // Retention
  scheduledDeleteAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
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
    verifiedStatus: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.PENDING,
    },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    scheduledDeleteAt: { type: Date, index: true }, // used by retention cron
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

DocumentSchema.index({ ownerId: 1, documentCategory: 1 });
DocumentSchema.index({ applicationId: 1, verifiedStatus: 1 });

export const DocumentRecord = mongoose.model<IDocument>('Document', DocumentSchema);
