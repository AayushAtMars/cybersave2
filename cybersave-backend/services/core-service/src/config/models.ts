import mongoose, { Schema } from 'mongoose';
import { dbAuth, dbNotification, dbSupport } from './db';
import { UserRole } from '@cybersave/shared';

//auth-domain models

const UserSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    dob: { type: String },
    avatar: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    aadhaarMasked: { type: String },
    aadhaarNumber: { type: String },
    panMasked: { type: String },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.CITIZEN },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    fcmToken: { type: String },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    addresses: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    sessions: [
      {
        id: { type: String, required: true },
        device: { type: String, required: true },
        location: { type: String, required: true },
        ip: { type: String, required: true },
        type: { type: String, enum: ['login', 'logout'], default: 'login' },
        lastActive: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const OperatorSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    employeeId: { type: String, required: true, unique: true },
    department: { type: String, default: 'Operations' },
    status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'pending' },
    permissions: {
      type: [String],
      default: ['verify_documents', 'approve_applications'],
      enum: [
        'verify_documents', 'approve_applications', 'reject_applications',
        'escalate_to_admin', 'access_citizen_pii', 'view_transactions', 'manage_tickets',
      ],
    },
    role: { type: String, enum: ['operator', 'admin', 'super_admin'], default: 'operator' },
    twoFaEnabled: { type: Boolean, default: false },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: false },
      documentUploadAlerts: { type: Boolean, default: true },
      expiryReminders: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: false },
    },
    localizationPreferences: {
      language: { type: String, default: 'en-US' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      colorTheme: { type: String, default: 'system' },
    },
  },
  { timestamps: true }
);

const AuditLogSchema = new Schema(
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
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ category: 1 });

//notification-domain models

const NotificationSchema = new Schema(
  {
    citizenId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'application_update', 'payment', 'support', 'broadcast', 'system',
        'security_alert', 'expiry_warning', 'document_verification', 'document_upload',
        'payment_reminder', 'system_update', 'support_tickets', 'compliance_sync',
      ],
      default: 'system',
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//support-domain models

const MessageSchema = new Schema(
  {
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ['citizen', 'operator', 'admin', 'super_admin', 'system'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TicketSchema = new Schema(
  {
    citizenId: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', required: true },
    attachmentUrl: { type: String },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'escalated'],
      default: 'open',
      index: true,
    },
    messages: { type: [MessageSchema], default: [] },
    assignedOperatorId: { type: String, index: true },
    assignedOperatorName: { type: String },
  },
  { timestamps: true }
);

//register on named connections

let User: mongoose.Model<any>;
let Operator: mongoose.Model<any>;
let AuditLog: mongoose.Model<any>;
let Notification: mongoose.Model<any>;
let Ticket: mongoose.Model<any>;

export const registerModels = () => {
  User = dbAuth.model('User', UserSchema);
  Operator = dbAuth.model('Operator', OperatorSchema);
  AuditLog = dbAuth.model('AuditLog', AuditLogSchema);
  Notification = dbNotification.model('Notification', NotificationSchema);
  Ticket = dbSupport.model('Ticket', TicketSchema);
};

export const getModels = () => ({
  User,
  Operator,
  AuditLog,
  Notification,
  Ticket,
});
