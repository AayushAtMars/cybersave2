import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

// ── GET /notifications — list citizen's own notifications ──────────────────────
export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const notifications = await Notification.find({ citizenId }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: { items: notifications } });
};

// ── POST /notifications/read — mark all or specific notifications as read ─────
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const citizenId = req.user!.id;
  const { ids } = req.body as { ids?: string[] };

  const query: Record<string, any> = { citizenId };
  if (ids && ids.length > 0) {
    query._id = { $in: ids };
  }

  await Notification.updateMany(query, { $set: { read: true } });
  res.json({ success: true, data: { message: 'Notifications marked as read' } });
};

// ── POST /notifications/send — trigger a notification (internal API) ──────────
// Called by application-service or payment-service to trigger a notification
export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  const { citizenId, title, body, type } = req.body as {
    citizenId: string;
    title: string;
    body: string;
    type: string;
  };

  const notification = await Notification.create({
    citizenId,
    title,
    body,
    type,
    read: false,
  });

  // Mocking FCM Push Dispatch
  console.log(`[MOCK FCM PUSH] Sending push to Citizen ${citizenId}:`);
  console.log(`Title: ${title} | Body: ${body}`);

  res.status(201).json({ success: true, data: { notification } });
};

// ── GET /notifications/admin ──────────────────────────────────────────────────
export const listAdminNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await Notification.find({ citizenId: 'admin' }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { items } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── PATCH /notifications/admin/:id/read ───────────────────────────────────────
export const markAdminAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, citizenId: 'admin' },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, data: { notification } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /notifications/admin/read-all ────────────────────────────────────────
export const markAllAdminAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ citizenId: 'admin' }, { $set: { read: true } });
    res.json({ success: true, data: { message: 'All alerts marked as read' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
