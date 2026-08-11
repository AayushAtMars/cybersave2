import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
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
} from '../controllers/application.controller';
import { listServices, getService, createService, updateService } from '../controllers/service.controller';
import { CreateServiceSchema } from '@cybersave/shared';
import { z } from 'zod';

const router = Router();

// ── Service catalog (public read) ─────────────────────────────────────────────
router.get('/services', listServices);
router.get('/services/:id', getService);

// ── Service management (admin only) ──────────────────────────────────────────
router.post(
  '/services',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate(CreateServiceSchema),
  createService
);
router.patch(
  '/services/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  updateService
);

// ── Admin stats ──────────────────────────────────────────────────────────────
router.get(
  '/applications/admin/stats',
  authenticate,
  requireRole('admin', 'super_admin'),
  getAdminStats
);

// ── Admin: list all applications ─────────────────────────────────────────────
router.get(
  '/applications/admin/all',
  authenticate,
  requireRole('admin', 'super_admin'),
  listAllApplications
);

// ── Admin: upload certificate ─────────────────────────────────────────────────
router.patch(
  '/applications/:id/certificate',
  authenticate,
  requireRole('admin', 'super_admin', 'operator'),
  validate(z.object({ certificateUrl: z.string().url(), department: z.string().optional() })),
  uploadCertificate
);


// ── Application wizard (citizen) ──────────────────────────────────────────────
router.post(
  '/applications',
  authenticate,
  requireRole('citizen'),
  validate(z.object({ serviceId: z.string().min(1) })),
  createApplication
);

router.get('/applications', authenticate, requireRole('citizen'), listApplications);
router.get('/applications/:id', authenticate, requireRole('citizen', 'operator', 'admin', 'super_admin'), getApplication);

router.patch(
  '/applications/:id/step/:step',
  authenticate,
  requireRole('citizen'),
  saveWizardStep
);

// ── Operator Portal Queue & Claims ─────────────────────────────────────────────
router.get(
  '/applications/operator/queue',
  authenticate,
  requireRole('operator', 'admin', 'super_admin'),
  listOperatorQueue
);

router.post(
  '/applications/admin/create',
  authenticate,
  requireRole('operator', 'admin', 'super_admin'),
  createApplicationByAdmin
);

router.post(
  '/applications/:id/assign',
  authenticate,
  requireRole('operator', 'admin', 'super_admin'),
  assignApplication
);

router.patch(
  '/applications/:id/verify-document',
  authenticate,
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
  authenticate,
  requireRole('operator', 'admin', 'super_admin'),
  validate(
    z.object({
      status: z.string().min(1),
      rejectionReason: z.string().optional(),
    })
  ),
  updateApplicationStatus
);

// ── Internal: called by payment-service webhook only ─────────────────────────

// Protected by a shared internal secret header, not citizen JWT
router.post(
  '/applications/:id/submit',
  (req, res, next) => {
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
  res.json({ success: true, data: { service: 'application-service', status: 'ok' } })
);

export default router;
