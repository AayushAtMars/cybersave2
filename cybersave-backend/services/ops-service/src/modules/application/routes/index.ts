import { Request, Response, Router } from 'express';
import { getModels } from '../../../config/models';
import { authenticateGateway, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import {
  createApplication,
  listApplications,
  getApplication,
  saveWizardStep,
  submitApplication,
  listOperatorQueue,
  assignApplication,
  verifyDocument,
  updateApplicationStatus,
  getAdminStats,
  uploadCertificate,
  listAllApplications,
  createApplicationByAdmin,
  getOperatorStats,
  getDashboardStats,
} from '../controllers/application.controller';
import { listServices, getService, createService, updateService, deleteService } from '../controllers/service.controller';
import { CreateServiceSchema } from '@cybersave/shared';
import { z } from 'zod';

const router = Router();

// ── Service catalog (public read) ─────────────────────────────────────────────
router.get('/services', listServices);
router.get('/services/:id', getService);

// ── Service management (admin only) ──────────────────────────────────────────
router.post(
  '/services',
  authenticateGateway,
  requireRole('admin', 'super_admin'),
  validate(CreateServiceSchema),
  createService
);
router.patch(
  '/services/:id',
  authenticateGateway,
  requireRole('admin', 'super_admin'),
  updateService
);
router.delete(
  '/services/:id',
  authenticateGateway,
  requireRole('admin', 'super_admin'),
  deleteService
);

// ── Admin stats ──────────────────────────────────────────────────────────────
router.get(
  '/applications/admin/stats',
  authenticateGateway,
  requireRole('admin', 'super_admin'),
  getAdminStats
);

// ── Operator stats ────────────────────────────────────────────────────────────
router.get(
  '/applications/operator/stats',
  authenticateGateway,
  requireRole('operator', 'admin', 'super_admin'),
  getOperatorStats
);

// ── Admin: list all applications ─────────────────────────────────────────────
router.get(
  '/applications/admin/all',
  authenticateGateway,
  requireRole('operator', 'admin', 'super_admin'),
  listAllApplications
);

// ── Admin: upload certificate ─────────────────────────────────────────────────
router.patch(
  '/applications/:id/certificate',
  authenticateGateway,
  requireRole('admin', 'super_admin', 'operator'),
  validate(z.object({ certificateUrl: z.string().url(), department: z.string().optional() })),
  uploadCertificate
);

// ── Application wizard (citizen) ──────────────────────────────────────────────
router.post(
  '/applications',
  authenticateGateway,
  requireRole('citizen'),
  validate(z.object({ serviceId: z.string().min(1) })),
  createApplication
);

router.get('/applications', authenticateGateway, requireRole('citizen'), listApplications);
router.get('/applications/stats', authenticateGateway, requireRole('citizen'), getDashboardStats);
router.get('/applications/:id', authenticateGateway, requireRole('citizen', 'operator', 'admin', 'super_admin'), getApplication);

router.patch(
  '/applications/:id/step/:step',
  authenticateGateway,
  requireRole('citizen'),
  saveWizardStep
);

// ── Operator Portal Queue & Claims ─────────────────────────────────────────────
router.get(
  '/applications/operator/queue',
  authenticateGateway,
  requireRole('operator', 'admin', 'super_admin'),
  listOperatorQueue
);

router.post(
  '/applications/admin/create',
  authenticateGateway,
  requireRole('operator', 'admin', 'super_admin'),
  createApplicationByAdmin
);

router.post(
  '/applications/:id/assign',
  authenticateGateway,
  requireRole('operator', 'admin', 'super_admin'),
  assignApplication
);

router.patch(
  '/applications/:id/verify-document',
  authenticateGateway,
  requireRole('operator', 'admin', 'super_admin'),
  validate(
    z.object({
      documentId: z.string().min(1),
      status: z.enum(['approved', 'rejected']),
      comments: z.string().optional(),
    })
  ),
  verifyDocument
);

router.patch(
  '/applications/:id/status',
  authenticateGateway,
  requireRole('operator', 'admin', 'super_admin'),
  validate(
    z.object({
      status: z.string().min(1),
      rejectionReason: z.string().optional(),
    })
  ),
  updateApplicationStatus
);

// ── Internal Submit ──────────────────────────────────────────────────────────
// Directly exposed for in-process calling (internal webhook bypassed or preserved for compat)
router.post(
  '/applications/:id/submit',
  (req, res, next) => {
    // Preserve secret validation for HTTP compatibility
    const secret = req.headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_SERVICE_SECRET) {
      res.status(403).json({ success: false, error: 'Forbidden', errorCode: 'FORBIDDEN' });
      return;
    }
    next();
  },
  submitApplication
);

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'ops-service/application', status: 'ok' } })
);

export default router;
