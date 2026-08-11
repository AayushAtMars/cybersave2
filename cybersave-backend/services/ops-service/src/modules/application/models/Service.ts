import mongoose, { Document, Schema } from 'mongoose';
import { ApplicationStatus, ServiceCategory } from '@cybersave/shared';

// ─── Service Catalog ──────────────────────────────────────────────────────────
export interface IRequiredDocument {
  name: string;
  description?: string;
  mandatory: boolean;
  acceptedFormats: string[];
  maxSizeMb: number;
}

export interface IFormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'aadhaar';
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select type
  maxLength?: number;
}

export interface IService extends Document {
  name: string;
  description?: string;
  category: ServiceCategory;
  department: string;
  govtFee: number;
  convenienceFee: number;
  totalFee: number; // virtual: govtFee + convenienceFee
  slaHours: number;
  eligibility: string[];
  requiredDocuments: IRequiredDocument[];
  formFields: IFormField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RequiredDocumentSchema = new Schema<IRequiredDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    mandatory: { type: Boolean, default: true },
    acceptedFormats: { type: [String], default: ['pdf', 'jpg', 'jpeg', 'png'] },
    maxSizeMb: { type: Number, default: 5 },
  },
  { _id: false }
);

const FormFieldSchema = new Schema<IFormField>(
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

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, enum: Object.values(ServiceCategory), required: true },
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

ServiceSchema.virtual('totalFee').get(function (this: IService) {
  return this.govtFee + this.convenienceFee;
});

export const Service = mongoose.model<IService>('Service', ServiceSchema);
