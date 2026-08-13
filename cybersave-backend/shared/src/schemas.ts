import { z } from 'zod';
import {
  ApplicationStatus,
  DocumentStatus,
  TicketStatus,
  UserRole,
  TransactionType,
  NotificationType,
  OperatorStatus,
  ServiceCategory,
} from './enums';

// ─── API Response Envelope ────────────────────────────────────────────────────
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    errorCode: z.string().optional(),
  });

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  name: z.string().min(2).max(100),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const SendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});
export type SendOtpInput = z.infer<typeof SendOtpSchema>;

export const VerifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const OperatorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  captchaToken: z.string().optional(),
});
export type OperatorLoginInput = z.infer<typeof OperatorLoginSchema>;

// ─── Address ──────────────────────────────────────────────────────────────────
export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  country: z.string().default('India'),
});
export type Address = z.infer<typeof AddressSchema>;

// ─── Service / Catalog ────────────────────────────────────────────────────────
export const RequiredDocumentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  mandatory: z.boolean().default(true),
  acceptedFormats: z.array(z.string()).default(['pdf', 'jpg', 'jpeg', 'png']),
  maxSizeMb: z.number().default(5),
});
export type RequiredDocument = z.infer<typeof RequiredDocumentSchema>;

export const FormFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'select', 'date', 'aadhaar', 'email', 'phone', 'file', 'checkbox', 'radio']),
  placeholder: z.string().optional(),
  required: z.boolean().default(true),
  options: z.array(z.string()).optional(),
  maxLength: z.number().optional(),
});
export type FormField = z.infer<typeof FormFieldSchema>;

export const CreateServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.nativeEnum(ServiceCategory),
  department: z.string(),
  govtFee: z.number().min(0),
  convenienceFee: z.number().min(0),
  slaHours: z.number().int().min(1),
  requiredDocuments: z.array(RequiredDocumentSchema).min(1),
  formFields: z.array(FormFieldSchema).optional(),
  isActive: z.boolean().default(true),
});
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

// ─── Application Wizard ───────────────────────────────────────────────────────
export const WizardStep1Schema = z.object({
  // Personal details (citizen confirms their info)
  applicantName: z.string().min(2),
  applicantPhone: z.string().regex(/^[6-9]\d{9}$/),
  applicantDob: z.string(),
  applicantGender: z.enum(['male', 'female', 'other']),
  applicantAddress: AddressSchema,
});

export const WizardStep2Schema = z.object({
  // Service-specific form fields (dynamic — stored as key-value)
  formData: z.record(z.string(), z.unknown()),
});

export const WizardStep3Schema = z.object({
  // Document keys after upload
  documentIds: z.array(z.string()).min(1),
});

export const WizardStep4Schema = z.object({
  // Review confirmation — citizen acknowledges
  reviewConfirmed: z.literal(true),
  declarationAccepted: z.literal(true),
});

// ─── Payment ──────────────────────────────────────────────────────────────────
export const CreatePaymentOrderSchema = z.object({
  applicationId: z.string(),
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'wallet']).optional(),
});
export type CreatePaymentOrderInput = z.infer<typeof CreatePaymentOrderSchema>;

// ─── Support ──────────────────────────────────────────────────────────────────
export const CreateTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(['application', 'payment', 'document', 'account', 'other']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  applicationId: z.string().optional(),
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

// ─── Document Upload ──────────────────────────────────────────────────────────
export const RequestUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024), // 10 MB hard cap
  documentCategory: z.enum(['id_proof', 'address_proof', 'birth_proof', 'income_proof', 'proof', 'certificate', 'photo', 'signature', 'other']),
  applicationId: z.string().optional(),
});
export type RequestUploadUrlInput = z.infer<typeof RequestUploadUrlSchema>;
