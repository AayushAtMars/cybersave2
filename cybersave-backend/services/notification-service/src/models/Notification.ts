import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  citizenId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    citizenId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'application_update', 'payment', 'support', 'broadcast', 'system',
        'security_alert', 'expiry_warning', 'document_verification', 'document_upload',
        'payment_reminder', 'system_update', 'support_tickets', 'compliance_sync'
      ],
      default: 'system',
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
