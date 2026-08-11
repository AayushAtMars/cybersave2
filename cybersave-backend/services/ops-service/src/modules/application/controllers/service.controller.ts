import { Request, Response } from 'express';
import { getModels } from '../../../config/models';
import { ServiceCategory } from '@cybersave/shared';
import { triggerNotification } from '../utils/notification';

const getServiceModel = () => getModels().Service;

// ── GET /services ─────────────────────────────────────────────────────────────
export const listServices = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string ?? '1', 10);
  const limit = Math.min(parseInt(req.query.limit as string ?? '100', 10), 100);
  const category = req.query.category as ServiceCategory | undefined;

  const Service = getServiceModel();
  const filter: Record<string, unknown> = {};
  if (req.query.all !== 'true') {
    filter.isActive = true;
  }
  if (category) filter.category = category;

  const [items, total] = await Promise.all([
    Service.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Service.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
};

// ── GET /services/:id ─────────────────────────────────────────────────────────
export const getService = async (req: Request, res: Response): Promise<void> => {
  const Service = getServiceModel();
  const service = await Service.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!service) {
    res.status(404).json({ success: false, error: 'Service not found', errorCode: 'SERVICE_NOT_FOUND' });
    return;
  }
  res.json({ success: true, data: { service } });
};

// ── POST /services — admin only ───────────────────────────────────────────────
export const createService = async (req: Request, res: Response): Promise<void> => {
  const Service = getServiceModel();
  const service = await Service.create(req.body);
  
  triggerNotification(
    'admin',
    'New scheme/service added',
    `A new service "${service.name}" was registered under "${service.category}" category.`,
    'compliance_sync'
  ).catch((err: any) => console.error('Failed to trigger notification:', err.message));

  res.status(201).json({ success: true, data: { service } });
};

// ── PATCH /services/:id — admin only ─────────────────────────────────────────
export const updateService = async (req: Request, res: Response): Promise<void> => {
  const Service = getServiceModel();
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) {
    res.status(404).json({ success: false, error: 'Service not found', errorCode: 'SERVICE_NOT_FOUND' });
    return;
  }

  triggerNotification(
    'admin',
    'Scheme/service updated',
    `The service details for "${service.name}" were updated.`,
    'system_update'
  ).catch((err: any) => console.error('Failed to trigger notification:', err.message));

  res.json({ success: true, data: { service } });
};
