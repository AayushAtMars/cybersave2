import mongoose, { Document, Schema } from 'mongoose';

export interface IOperator extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  avatar?: string;
  employeeId: string;
  department: string;
  status: 'active' | 'pending' | 'suspended';
  permissions: string[];
  role: 'operator' | 'admin' | 'super_admin';
  twoFaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OperatorSchema = new Schema<IOperator>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    employeeId: { type: String, required: true, unique: true },
    department: { type: String, default: 'Operations' },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'pending',
    },
    // CyberSave-relevant permissions only (rules.md §2 / design.md §8)
    permissions: {
      type: [String],
      default: ['verify_documents', 'approve_applications'],
      enum: [
        'verify_documents',
        'approve_applications',
        'reject_applications',
        'escalate_to_admin',
        'access_citizen_pii',
        'view_transactions',
        'manage_tickets',
      ],
    },
    role: {
      type: String,
      enum: ['operator', 'admin', 'super_admin'],
      default: 'operator',
    },
    twoFaEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Operator = mongoose.model<IOperator>('Operator', OperatorSchema);
