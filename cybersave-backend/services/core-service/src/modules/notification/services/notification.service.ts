import nodemailer from 'nodemailer';
import { Response } from 'express';
import { getModels } from '../../../config/models';
import { config } from '../../../config';

export type SSEClient = {
  id: string; // operator ID
  res: Response;
};

export type NotificationType = 'system_update' | 'document_upload' | 'expiry_reminder' | 'support_ticket';

class NotificationService {
  private clients: SSEClient[] = [];
  private mailTransporter: nodemailer.Transporter;

  constructor() {
    this.mailTransporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
  }

  addSSEClient(id: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send an initial connected ping
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    this.clients.push({ id, res });
    res.on('close', () => {
      this.clients = this.clients.filter(c => c.res !== res);
    });
  }

  async dispatchAdminAlert(type: NotificationType, title: string, body: string, meta?: any) {
    const { Operator, Notification } = getModels();

    const notification = await Notification.create({
      citizenId: 'admin',
      title,
      body,
      type,
      read: false,
      meta
    });

    const admins = await Operator.find({ role: { $in: ['admin', 'super_admin'] } }).lean();

    for (const admin of admins) {
      const prefs = (admin as any).notificationPreferences || {};
      const adminId = (admin as any)._id.toString();

      // Check if they opted into this specific type of alert
      let isOptedIn = false;
      if (type === 'document_upload' && prefs.documentUploadAlerts !== false) isOptedIn = true;
      if (type === 'expiry_reminder' && prefs.expiryReminders !== false) isOptedIn = true;
      if (type === 'system_update' && prefs.systemUpdates !== false) isOptedIn = true;
      if (type === 'support_ticket') isOptedIn = true; // default true

      if (!isOptedIn) continue;

      // Push Notifications (SSE)
      if (prefs.pushNotifications) {
        const connectedClients = this.clients.filter(c => c.id === adminId);
        for (const client of connectedClients) {
          client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
        }
      }

      // Email Notifications
      const targetEmail = config.smtp.testReceiver || admin.email;
      if (prefs.emailNotifications && targetEmail) {
        console.log(`[EMAIL DISPATCHED] To: ${targetEmail} | Subject: ${title}`);
        this.mailTransporter.sendMail({
          from: '"CyberSave Admin" <no-reply@cybersave.gov>',
          to: targetEmail,
          subject: title,
          text: body,
          html: `<h3>${title}</h3><p>${body}</p>`
        }).catch(err => console.error('Email send failed:', err));
      }
    }
  }
}

export const notificationService = new NotificationService();
