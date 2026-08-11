import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

// ── POST /api/v1/auth/audit/log  (internal: called by other services) ────────
export const createAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, userName, userRole, action, category, resource, ipAddress, status, meta } = req.body;
    const log = await AuditLog.create({
      userId,
      userName: userName || 'System',
      userRole: userRole || 'system',
      action,
      category,
      resource,
      ipAddress: ipAddress || req.ip || 'Unknown',
      status,
      meta,
    });
    res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/v1/auth/admin/audit-logs ────────────────────────────────────────
export const listAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '8',
      category,
      userId,
      dateRange,
      search,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (category && category !== 'all') {
      filter.category = category;
    }
    if (userId && userId !== 'all') {
      filter.userId = userId;
    }
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
      ];
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let fromDate: Date | null = null;
      if (dateRange === '24h') {
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (dateRange === '7d') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (fromDate) {
        filter.timestamp = { $gte: fromDate };
      }
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limitNum).lean(),
      AuditLog.countDocuments(filter),
    ]);

    // Aggregate stats
    const [loginCount, documentCount, systemCount] = await Promise.all([
      AuditLog.countDocuments({ category: 'login' }),
      AuditLog.countDocuments({ category: 'document' }),
      AuditLog.countDocuments({ category: 'system' }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        stats: {
          totalEvents: total,
          loginActivities: loginCount,
          documentActions: documentCount,
          systemChanges: systemCount,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
