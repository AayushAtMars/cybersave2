import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  senderId: string;
  senderRole: 'citizen' | 'operator' | 'system';
  message: string;
  timestamp: Date;
}

export interface ITicket extends Document {
  citizenId: string;
  subject: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attachmentUrl?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  messages: IMessage[];
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ['citizen', 'operator', 'system'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TicketSchema = new Schema<ITicket>(
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

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
