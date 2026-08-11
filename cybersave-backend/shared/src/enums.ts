// ─── Application Status ─────────────────────────────────────────────────────
export const ApplicationStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

// ─── Document Status ─────────────────────────────────────────────────────────
export const DocumentStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

// ─── Ticket Status ────────────────────────────────────────────────────────────
export const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

// ─── User Roles ───────────────────────────────────────────────────────────────
export const UserRole = {
  CITIZEN: 'citizen',
  OPERATOR: 'operator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ─── Transaction Type ─────────────────────────────────────────────────────────
export const TransactionType = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  REFUND: 'refund',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

// ─── Notification Type ────────────────────────────────────────────────────────
export const NotificationType = {
  APPLICATION_UPDATE: 'application_update',
  PAYMENT: 'payment',
  SUPPORT: 'support',
  BROADCAST: 'broadcast',
  SYSTEM: 'system',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ─── Operator Status ──────────────────────────────────────────────────────────
export const OperatorStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const;
export type OperatorStatus = (typeof OperatorStatus)[keyof typeof OperatorStatus];

// ─── Service Category ─────────────────────────────────────────────────────────
export const ServiceCategory = {
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  CERTIFICATE: 'certificate',
  GOV_SCHEME: 'gov_scheme',
} as const;
export type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory];
