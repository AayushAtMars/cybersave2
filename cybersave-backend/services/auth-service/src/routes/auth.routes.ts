import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  sendOtp,
  verifyOtpAndLogin,
  register,
  refreshToken,
  logout,
  operatorLogin,
  updateProfile,
  updateAddress,
  listCitizens,
  listOperators,
  createOperator,
  toggleCitizenStatus,
  updateOperatorStatus,
  createCitizen,
  importCitizens,
  getMe,
  updateOperatorProfile,
  updateOperatorPassword,
  toggleOperator2FA,
  getCitizenDetail,
} from '../controllers/auth.controller';
import { createAuditLog, listAuditLogs } from '../controllers/audit.controller';
import { SendOtpSchema, VerifyOtpSchema, OperatorLoginSchema } from '@cybersave/shared';
import { z } from 'zod';

const router = Router();

// ── Rate limiting ─────────────────────────────────────────────────────────────
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many OTP requests. Please wait 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many login attempts. Please wait.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

// ── Citizen routes ─────────────────────────────────────────────────────────────
router.post('/send-otp', otpSendLimiter, validate(SendOtpSchema), sendOtp);

router.post(
  '/verify-otp',
  loginLimiter,
  validate(
    VerifyOtpSchema.extend({
      name: z.string().min(2).max(100).optional(),
    })
  ),
  verifyOtpAndLogin
);

router.post(
  '/register',
  loginLimiter,
  validate(
    z.object({
      phone: z.string().length(10),
      name: z.string().min(2).max(100),
      email: z.string().email().optional(),
    })
  ),
  register
);

router.post('/refresh', validate(z.object({ refreshToken: z.string() })), refreshToken);
router.post('/logout', authenticate, logout);

// Profile endpoints
router.patch(
  '/profile',
  authenticate,
  validate(
    z.object({
      dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format must be DD/MM/YYYY').optional(),
      gender: z.enum(['male', 'female', 'other']).optional(),
      email: z.string().email().optional(),
      avatar: z.string().optional(),
      aadhaarNumber: z.string().length(12).optional(),
      panNumber: z.string().length(10).optional(),
    })
  ),
  updateProfile
);

router.patch(
  '/profile/address',
  authenticate,
  validate(
    z.object({
      line1: z.string().min(3).optional(),
      line2: z.string().optional(),
      city: z.string().min(2).optional(),
      state: z.string().min(2).optional(),
      pincode: z.string().length(6).optional(),
      addresses: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          pincode: z.string(),
          isDefault: z.boolean(),
        })
      ).optional(),
    })
  ),
  updateAddress
);

// ── Admin management routes (require admin/super_admin) ────────────────────────
router.get('/admin/citizens', authenticate, listCitizens);
router.post(
  '/admin/citizens',
  authenticate,
  validate(
    z.object({
      name: z.string().min(2),
      phone: z.string().min(10).max(15),
      email: z.string().email().optional().nullable(),
      aadhaarNumber: z.string().optional().nullable(),
      district: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
    })
  ),
  createCitizen
);
router.post('/admin/citizens/import', authenticate, importCitizens);
router.get('/admin/operators', authenticate, listOperators);
router.post(
  '/admin/operators',
  authenticate,
  validate(
    z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      employeeId: z.string().min(3),
      department: z.string().optional(),
      role: z.enum(['operator', 'admin', 'super_admin']).optional(),
      permissions: z.array(z.string()).optional(),
    })
  ),
  createOperator
);
router.patch('/admin/citizens/:id/block', authenticate, toggleCitizenStatus);
router.patch('/admin/operators/:id/status', authenticate, updateOperatorStatus);

// ── Operator / Admin login route (with Cloudflare Turnstile CAPTCHA validation) ─
router.post('/operator/login', loginLimiter, validate(OperatorLoginSchema), operatorLogin);

// ── Settings / Profile routes (operator manages their own account) ────────────
router.get('/admin/me', authenticate, getMe);
router.patch('/admin/me', authenticate, updateOperatorProfile);
router.patch('/admin/me/password', authenticate, updateOperatorPassword);
router.patch('/admin/me/2fa', authenticate, toggleOperator2FA);

// ── Individual citizen detail ────────────────────────────────────────────────────
router.get('/admin/citizens/:id', authenticate, getCitizenDetail);

// ── Audit Log routes ─────────────────────────────────────────────────────────
// Internal: any service can POST a log entry (no auth header needed for internal calls)
router.post('/audit/log', createAuditLog);
// Admin: list/search/filter all audit logs
router.get('/admin/audit-logs', authenticate, listAuditLogs);

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => res.json({ success: true, data: { service: 'auth-service', status: 'ok' } }));

export default router;
