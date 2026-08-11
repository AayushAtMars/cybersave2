import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import axios from 'axios';

// ── Fire-and-forget audit emit ───────────────────────────────────────────────
const emitAuditLog = (payload: {
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  category: string;
  resource: string;
  ipAddress: string;
  status: string;
}) => {
  const authUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  axios.post(`${authUrl}/api/v1/auth/audit/log`, payload).catch(() => {});
};

// ── Citizen: POST /support/tickets ────────────────────────────────────────────
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const { subject, description, category, priority, attachmentUrl, assignedOperatorName } = req.body as {
    subject: string;
    description: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    attachmentUrl?: string;
    assignedOperatorName?: string;
  };

  const ticket = await Ticket.create({
    citizenId,
    subject,
    description,
    category,
    priority: priority || 'medium',
    attachmentUrl,
    assignedOperatorName: assignedOperatorName || 'Unassigned',
    messages: [
      { senderId: citizenId, senderRole: 'citizen', message: description, timestamp: new Date() },
    ],
  });

  // Dynamic chatbot helper replies (simulation)
  let autoReply = '';
  const text = (subject + ' ' + description).toLowerCase();
  if (text.includes('otp')) {
    autoReply = "🤖 Chatbot: If you aren't receiving OTP, please check your network connection or verify that the mobile number entered is correct. OTPs are stubbed in local dev console logs.";
  } else if (text.includes('refund') || text.includes('wallet')) {
    autoReply = "🤖 Chatbot: Wallet top-up payments take up to 5-10 minutes to verify. Refund balances will reflect on your Wallet transactions logs once processed by operators.";
  } else if (text.includes('aadhaar')) {
    autoReply = "🤖 Chatbot: For Aadhaar Address updates, please ensure you upload a clear utility bill, bank statement, or passport as proof of address.";
  }

  if (autoReply) {
    ticket.messages.push({
      senderId: 'chatbot',
      senderRole: 'system',
      message: autoReply,
      timestamp: new Date(),
    });
    await ticket.save();
  }

  res.status(201).json({ success: true, data: { ticket } });

  // Emit audit log for ticket creation
  emitAuditLog({
    userId: citizenId,
    userName: 'Citizen User',
    userRole: 'citizen',
    action: 'Support Ticket Raised',
    category: 'support',
    resource: `Ticket #${(ticket as any)._id.toString().slice(-6).toUpperCase()}`,
    ipAddress: String(req.ip || req.headers['x-forwarded-for'] || 'Unknown'),
    status: 'success',
  });
};

// ── Citizen: GET /support/tickets — own list ──────────────────────────────────
export const listCitizenTickets = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const tickets = await Ticket.find({ citizenId }).sort({ updatedAt: -1 }).lean();
  res.json({ success: true, data: { items: tickets } });
};

// ── Citizen & Operator: GET /support/tickets/:id ──────────────────────────────
export const getTicketDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const ticket = await Ticket.findById(id).lean();
  if (!ticket) {
    res.status(404).json({ success: false, error: 'Ticket not found', errorCode: 'TICKET_NOT_FOUND' });
    return;
  }
  res.json({ success: true, data: { ticket } });
};

// ── Citizen & Operator: POST /support/tickets/:id/reply ───────────────────────
export const replyToTicket = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { message } = req.body as { message: string };
  const senderId = req.user!.id;
  const senderRole = req.user!.role as 'citizen' | 'operator';

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    res.status(404).json({ success: false, error: 'Ticket not found', errorCode: 'TICKET_NOT_FOUND' });
    return;
  }

  ticket.messages.push({
    senderId,
    senderRole,
    message,
    timestamp: new Date(),
  });
  ticket.status = senderRole === 'operator' ? 'in_progress' : 'open';
  await ticket.save();

  res.json({ success: true, data: { ticket } });
};

// ── Operator: GET /support/operator/tickets — queue ───────────────────────────
export const listOperatorTickets = async (req: Request, res: Response): Promise<void> => {
  const tickets = await Ticket.find({ status: { $ne: 'closed' } }).sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: { items: tickets } });
};

// ── Operator: PATCH /support/operator/tickets/:id/status ───────────────────────
export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body as { status: 'in_progress' | 'resolved' | 'closed' };
  const operatorId = req.user!.id;

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    res.status(404).json({ success: false, error: 'Ticket not found', errorCode: 'TICKET_NOT_FOUND' });
    return;
  }

  ticket.status = status;
  if (!ticket.assignedOperatorId) {
    ticket.assignedOperatorId = operatorId;
  }
  await ticket.save();

  res.json({ success: true, data: { ticket } });
};

// ── Admin: GET /support/admin/tickets — list all tickets ───────────────────────
export const listAdminTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await Ticket.countDocuments();
    if (count === 0) {
      const mockTickets = [
        {
          citizenId: 'seed_citizen_1',
          subject: 'Login Authentication Issue',
          description: 'Cannot authenticate using mobile OTP on the Android application.',
          category: 'Technical',
          priority: 'high',
          status: 'open',
          assignedOperatorName: 'Amit S.',
          createdAt: new Date('2024-10-01T10:00:00.000Z'),
          updatedAt: new Date('2024-10-03T14:30:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_1', senderRole: 'citizen', message: 'Cannot authenticate using mobile OTP on the Android application.', timestamp: new Date('2024-10-01T10:00:00.000Z') }
          ]
        },
        {
          citizenId: 'seed_citizen_2',
          subject: 'Payment Gateway Error',
          description: 'Transaction failed but amount was debited from bank account.',
          category: 'Billing',
          priority: 'critical',
          status: 'in_progress',
          assignedOperatorName: 'Priya M.',
          createdAt: new Date('2024-09-26T11:20:00.000Z'),
          updatedAt: new Date('2024-10-02T15:45:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_2', senderRole: 'citizen', message: 'Transaction failed but amount was debited from bank account.', timestamp: new Date('2024-09-26T11:20:00.000Z') }
          ]
        },
        {
          citizenId: 'seed_citizen_3',
          subject: 'Profile Update Not Saving',
          description: 'Getting 500 error when trying to save profile changes.',
          category: 'Account',
          priority: 'medium',
          status: 'resolved',
          assignedOperatorName: 'Rahul K.',
          createdAt: new Date('2024-09-25T09:15:00.000Z'),
          updatedAt: new Date('2024-09-30T16:00:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_3', senderRole: 'citizen', message: 'Getting 500 error when trying to save profile changes.', timestamp: new Date('2024-09-25T09:15:00.000Z') }
          ]
        },
        {
          citizenId: 'seed_citizen_4',
          subject: 'Dashboard Loading Slowly',
          description: 'It takes more than 10 seconds to load the applications dashboard list.',
          category: 'Performance',
          priority: 'medium',
          status: 'open',
          assignedOperatorName: 'Sneha D.',
          createdAt: new Date('2024-09-22T08:00:00.000Z'),
          updatedAt: new Date('2024-09-28T12:00:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_4', senderRole: 'citizen', message: 'It takes more than 10 seconds to load the applications dashboard list.', timestamp: new Date('2024-09-22T08:00:00.000Z') }
          ]
        },
        {
          citizenId: 'seed_citizen_5',
          subject: 'Data Export Failing',
          description: 'PDF download option results in network timeout error.',
          category: 'Technical',
          priority: 'high',
          status: 'escalated',
          assignedOperatorName: 'Vikram P.',
          createdAt: new Date('2024-09-20T14:50:00.000Z'),
          updatedAt: new Date('2024-09-27T10:15:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_5', senderRole: 'citizen', message: 'PDF download option results in network timeout error.', timestamp: new Date('2024-09-20T14:50:00.000Z') }
          ]
        },
        {
          citizenId: 'seed_citizen_6',
          subject: 'Invoice Discrepancy',
          description: 'Billed amount is higher than transaction receipt shows.',
          category: 'Billing',
          priority: 'low',
          status: 'in_progress',
          assignedOperatorName: 'Meera J.',
          createdAt: new Date('2024-09-18T10:10:00.000Z'),
          updatedAt: new Date('2024-09-25T11:40:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_6', senderRole: 'citizen', message: 'Billed amount is higher than transaction receipt shows.', timestamp: new Date('2024-09-18T10:10:00.000Z') }
          ]
        },
        {
          citizenId: 'seed_citizen_7',
          subject: 'Email Notifications Delayed',
          description: 'Verification approval emails are delayed by a few hours.',
          category: 'Communication',
          priority: 'medium',
          status: 'resolved',
          assignedOperatorName: 'Arjun T.',
          createdAt: new Date('2024-09-15T09:00:00.000Z'),
          updatedAt: new Date('2024-09-22T14:15:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_7', senderRole: 'citizen', message: 'Verification approval emails are delayed by a few hours.', timestamp: new Date('2024-09-15T09:00:00.000Z') }
          ]
        },
        {
          citizenId: 'seed_citizen_8',
          subject: 'Certificate Generation Error',
          description: 'System throws cryptograhic signing error on certificate exports.',
          category: 'Technical',
          priority: 'high',
          status: 'open',
          assignedOperatorName: 'Kavita R.',
          createdAt: new Date('2024-09-12T11:00:00.000Z'),
          updatedAt: new Date('2024-09-20T17:30:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_8', senderRole: 'citizen', message: 'System throws cryptograhic signing error on certificate exports.', timestamp: new Date('2024-09-12T11:00:00.000Z') }
          ]
        },
        {
          citizenId: 'seed_citizen_9',
          subject: 'Password Reset Issue',
          description: 'Reset link expires instantly after being sent to email inbox.',
          category: 'Account',
          priority: 'low',
          status: 'resolved',
          assignedOperatorName: 'Deepak N.',
          createdAt: new Date('2024-09-10T14:12:00.000Z'),
          updatedAt: new Date('2024-09-18T16:22:00.000Z'),
          messages: [
            { senderId: 'seed_citizen_9', senderRole: 'citizen', message: 'Reset link expires instantly after being sent to email inbox.', timestamp: new Date('2024-09-10T14:12:00.000Z') }
          ]
        }
      ];
      await Ticket.insertMany(mockTickets);
    }

    const items = await Ticket.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { items } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
