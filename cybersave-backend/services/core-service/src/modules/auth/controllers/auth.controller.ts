import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendMockOtp } from '../utils/sms';
import { verifyFirebaseToken } from '../utils/firebase';

import { getModels } from '../../../config/models';

import {
  storeOtp,
  getStoredOtp,
  deleteOtp,
  incrementOtpAttempts,
  blacklistToken,
} from '../config/redis';

import {
  generateOtp,
  hashOtp,
  verifyOtp,
  hashPassword,
  verifyPassword,
} from '../utils/crypto';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRemainingTtl,
} from '../utils/jwt';
import { logger, maskPhone } from '../utils/logger';
import { config } from '../../../config';
import crypto from 'crypto';

// Lazy-resolved models (registered after DB connection)
const getUser = () => getModels().User;
const getOperator = () => getModels().Operator;
const getAuditLog = () => getModels().AuditLog;

const parseDevice = (userAgent?: string): string => {
  if (!userAgent) return 'Unknown Device';
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('cfnetwork') || ua.includes('darwin')) return 'iPhone 15 Pro';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android') || ua.includes('okhttp')) {
    return 'Android Device';
  }
  if (ua.includes('windows')) return 'Windows PC';
  if (ua.includes('macintosh')) return 'MacBook';
  if (ua.includes('linux')) return 'Linux PC';
  return 'Web Browser';
};

const parseLocation = (ip: string): string => {
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Bengaluru, India';
  }
  return 'Mumbai, India';
};

const registerSession = async (user: any, req: Request) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const device = parseDevice(userAgent);
  const location = parseLocation(ip);

  if (!user.sessions) {
    user.sessions = [];
  }

  // Check if session with same device and IP already exists to update it, or add new
  const existingIndex = user.sessions.findIndex((s: any) => s.device === device && s.ip === ip);
  if (existingIndex !== -1) {
    user.sessions[existingIndex].lastActive = new Date();
  } else {
    user.sessions.push({
      id: crypto.randomBytes(8).toString('hex'),
      device,
      location,
      ip,
      lastActive: new Date(),
    });
  }

  // Keep only the last 5 sessions to avoid bloating User document
  if (user.sessions.length > 5) {
    user.sessions = user.sessions.slice(-5);
  }

  user.markModified('sessions');
  await user.save();
};


// ── POST /auth/send-otp ───────────────────────────────────────────────────────────────
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body as { phone: string };

  const otp = generateOtp();
  const hashed = await hashOtp(otp);
  await storeOtp(phone, hashed);

  // In offline dev/mock mode, we print and return the OTP code directly
  await sendMockOtp(phone, otp);
  logger.info(`[OTP MOCK] phone=${maskPhone(phone)} otp=${otp}`);
  res.json({
    success: true,
    data: { message: 'OTP generated (mock/dev mode)', devOtp: otp },
  });
};


export const verifyOtpAndLogin = async (req: Request, res: Response): Promise<void> => {
  const { phone, otp, firebaseToken, name } = req.body as { phone: string; otp: string; firebaseToken?: string; name?: string };

  const attempts = await incrementOtpAttempts(phone);
  if (attempts > config.otp.maxAttempts) {
    res.status(429).json({
      success: false,
      error: 'Too many OTP attempts. Request a new OTP.',
      errorCode: 'OTP_MAX_ATTEMPTS',
    });
    return;
  }

  let valid = false;

  if (firebaseToken) {
    // Verify using Firebase token verification
    valid = await verifyFirebaseToken(firebaseToken, phone);
  } else {
    // Fall back to local mock OTP verification in Redis
    const storedHash = await getStoredOtp(phone);
    if (storedHash) {
      valid = await verifyOtp(otp, storedHash);
      if (valid) {
        await deleteOtp(phone);
      }
    }
  }

  if (!valid) {
    res.status(400).json({
      success: false,
      error: 'Invalid OTP or token',
      errorCode: 'OTP_INVALID',
    });
    return;
  }

  // Find or create citizen
  const User = getUser();
  let user = await User.findOne({ phone });
  const isNewUser = !user;

  if (!user) {
    user = await User.create({
      phone,
      name: name ?? 'CyberSave User',
      role: 'citizen',
      isVerified: true,
    });
    logger.info('New citizen registered', { phone: maskPhone(phone) });
  }

  const accessToken = signAccessToken(user.id, user.role);
  const { token: refreshToken } = signRefreshToken(user.id, user.role);

  await registerSession(user, req);

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        sessions: user.sessions,
      },
    },
  });
};

// ── POST /auth/register ──────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { phone, name, email, aadhaarNumber, state, district } = req.body as {
    phone: string;
    name: string;
    email?: string;
    aadhaarNumber?: string;
    state?: string;
    district?: string;
  };

  if (!phone || !name) {
    res.status(400).json({ success: false, error: 'Phone and Name are required', errorCode: 'VALIDATION_ERROR' });
    return;
  }

  // Mask aadhaar — store only last 4 digits
  const aadhaarMasked = aadhaarNumber && aadhaarNumber.length >= 4
    ? 'XXXX XXXX ' + aadhaarNumber.replace(/\s/g, '').slice(-4)
    : undefined;

  const User = getUser();
  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      phone,
      name,
      email,
      aadhaarMasked,
      aadhaarNumber: aadhaarMasked, // store masked version
      state,
      district,
      role: 'citizen',
      isVerified: true,
    });
  } else {
    user.name = name;
    if (email) user.email = email;
    if (aadhaarMasked) user.aadhaarMasked = aadhaarMasked;
    if (state) user.state = state;
    if (district) user.district = district;
    await user.save();
  }

  const accessToken = signAccessToken(user.id, user.role);
  const { token: refreshToken } = signRefreshToken(user.id, user.role);

  await registerSession(user, req);

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        sessions: user.sessions,
      },
    },
  });
};



// ── POST /auth/refresh ──────────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body as { refreshToken: string };

  if (!token) {
    res.status(400).json({ success: false, error: 'Refresh token required', errorCode: 'TOKEN_MISSING' });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken(payload.sub, payload.role);
    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token', errorCode: 'TOKEN_INVALID' });
  }
};

// ── POST /auth/logout ───────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body as { refreshToken?: string };

  // Blacklist the current access token
  if (req.user?.jti) {
    // Access token TTL is typically 15m; blacklist it for that window
    await blacklistToken(req.user.jti, 900);
  }

  // Optionally blacklist the refresh token too
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const remaining = getRemainingTtl(payload.exp!);
      await blacklistToken(payload.jti, remaining);
    } catch {
      // If refresh token is already invalid, we don't care
    }
  }

  res.json({ success: true, data: { message: 'Logged out successfully' } });
};

// ── GET /auth/admin/me — get current operator profile ────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const Operator = getOperator();
    const operatorId = req.user!.id;
    const operator = (await Operator.findById(operatorId).lean()) as any;
    if (!operator) {
      res.status(404).json({ success: false, error: 'Operator not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: (operator as any)._id,
        name: operator.name,
        email: operator.email,
        phone: operator.phone ?? '',
        avatar: operator.avatar ?? '',
        employeeId: operator.employeeId,
        department: operator.department,
        role: operator.role,
        twoFaEnabled: operator.twoFaEnabled,
        status: operator.status,
        permissions: operator.permissions,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── PATCH /auth/admin/me — update operator's own profile ─────────────────────
export const updateOperatorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const Operator = getOperator();
    const operatorId = req.user!.id;
    const { name, email, phone, avatar } = req.body as { name?: string; email?: string; phone?: string; avatar?: string };

    const operator = await Operator.findById(operatorId);
    if (!operator) {
      res.status(404).json({ success: false, error: 'Operator not found' });
      return;
    }

    if (name) operator.name = name;
    if (email) operator.email = email.toLowerCase();
    if (phone !== undefined) operator.phone = phone;
    if (avatar !== undefined) operator.avatar = avatar;
    await operator.save();

    res.json({
      success: true,
      data: { id: operator.id, name: operator.name, email: operator.email, phone: operator.phone, avatar: operator.avatar },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── PATCH /auth/admin/me/password — update operator's password ────────────────
export const updateOperatorPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const Operator = getOperator();
    const operatorId = req.user!.id;
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    const operator = await Operator.findById(operatorId);
    if (!operator) {
      res.status(404).json({ success: false, error: 'Operator not found' });
      return;
    }

    const valid = await verifyPassword(currentPassword, operator.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Current password is incorrect', errorCode: 'WRONG_PASSWORD' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
      return;
    }

    operator.passwordHash = await hashPassword(newPassword);
    await operator.save();

    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── PATCH /auth/admin/me/2fa — toggle 2FA for operator ───────────────────────
export const toggleOperator2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const Operator = getOperator();
    const operatorId = req.user!.id;
    const { enabled } = req.body as { enabled: boolean };

    const operator = await Operator.findById(operatorId);
    if (!operator) {
      res.status(404).json({ success: false, error: 'Operator not found' });
      return;
    }

    operator.twoFaEnabled = enabled;
    await operator.save();

    res.json({ success: true, data: { twoFaEnabled: operator.twoFaEnabled } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /auth/operator/login ───────────────────────────────────────────────
export const operatorLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password, captchaToken } = req.body as { email: string; password: string; captchaToken?: string };

  const turnstileSecret = process.env.NODE_ENV === 'development'
    ? '1x0000000000000000000000000000000AA'
    : (process.env.TURNSTILE_SECRET_KEY ?? '1x0000000000000000000000000000000AA');

  // Verify captcha in development (using local test sitekey) and production
  if (process.env.NODE_ENV !== 'test') {
    if (!captchaToken) {
      res.status(400).json({
        success: false,
        error: 'Captcha verification token is required',
        errorCode: 'CAPTCHA_REQUIRED',
      });
      return;
    }

    try {
      logger.info('Verifying Turnstile captcha', { 
        secret: turnstileSecret,
        secretLength: turnstileSecret?.length, 
        tokenLength: captchaToken?.length,
        secretStart: turnstileSecret?.substring(0, 5) 
      });
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: captchaToken,
        }).toString(),
      });
      const verifyData = (await verifyRes.json()) as { success: boolean; 'error-codes'?: string[] };
      logger.info('Turnstile siteverify response', { verifyData });
      if (!verifyData.success) {
        logger.warn('Captcha verification failed', { errorCodes: verifyData['error-codes'] });
        res.status(400).json({
          success: false,
          error: 'Captcha verification failed. Please try again.',
          errorCode: 'CAPTCHA_INVALID',
        });
        return;
      }
    } catch (err: any) {
      logger.error('Error verifying captcha', err);
      res.status(500).json({
        success: false,
        error: 'Failed to verify captcha. Please try again.',
        errorCode: 'CAPTCHA_VERIFICATION_ERROR',
      });
      return;
    }
  }

  const Operator = getOperator();
  const AuditLog = getAuditLog();
  const operator = await Operator.findOne({ email: email.toLowerCase() });
  if (!operator || operator.status !== 'active') {
    // Log failed login attempt
    if (operator) {
      AuditLog.create({
        userId: operator.id,
        userName: operator.name,
        userRole: operator.role,
        action: 'User Login Attempt',
        category: 'login',
        resource: 'System Portal',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
        status: 'failed',
      }).catch(() => {});
    }
    res.status(401).json({
      success: false,
      error: 'Invalid credentials or account not active',
      errorCode: 'INVALID_CREDENTIALS',
    });
    return;
  }

  const valid = await verifyPassword(password, operator.passwordHash);
  if (!valid) {
    AuditLog.create({
      userId: operator.id,
      userName: operator.name,
      userRole: operator.role,
      action: 'User Login Attempt',
      category: 'login',
      resource: 'System Portal',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
      status: 'failed',
    }).catch(() => {});
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      errorCode: 'INVALID_CREDENTIALS',
    });
    return;
  }

  const accessToken = signAccessToken(operator.id, operator.role);
  const { token: refreshToken } = signRefreshToken(operator.id, operator.role);

  // Log successful login
  AuditLog.create({
    userId: operator.id,
    userName: `${operator.name} (${operator.role.charAt(0).toUpperCase() + operator.role.slice(1)})`,
    userRole: operator.role,
    action: 'User Login',
    category: 'login',
    resource: 'System Portal',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
    status: 'success',
  }).catch(() => {});

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      operator: {
        id: operator.id,
        name: operator.name,
        email: operator.email,
        role: operator.role,
        permissions: operator.permissions,
      },
    },
  });
};

// ── PATCH /auth/profile ──────────────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { dob, gender, email, avatar, aadhaarNumber, panNumber } = req.body as {
    dob?: string;
    gender?: 'male' | 'female' | 'other';
    email?: string;
    avatar?: string;
    aadhaarNumber?: string;
    panNumber?: string;
  };
  const userId = req.user!.id;
  const User = getUser();
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found', errorCode: 'USER_NOT_FOUND' });
    return;
  }

  if (dob) user.dob = dob;
  if (gender) user.gender = gender;
  if (email) user.email = email;
  if (avatar) user.avatar = avatar;
  if (aadhaarNumber) {
    const masked = 'XXXX-XXXX-' + aadhaarNumber.replace(/\s/g, '').slice(-4);
    user.aadhaarMasked = masked;
    user.aadhaarNumber = masked;
  }
  if (panNumber) {
    const masked = 'XXXXXX' + panNumber.toUpperCase().slice(-4);
    user.panMasked = masked;
  }
  await registerSession(user, req);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        dob: user.dob,
        gender: user.gender,
        avatar: user.avatar,
        aadhaarMasked: user.aadhaarMasked,
        aadhaarNumber: user.aadhaarNumber,
        panMasked: user.panMasked,
        sessions: user.sessions,
      },
    },
  });
};

// ── PATCH /auth/profile/address ──────────────────────────────────────────────
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  const { line1, line2, city, state, pincode, addresses } = req.body as {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    addresses?: Array<{
      id: string;
      label: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      isDefault: boolean;
    }>;
  };
  const userId = req.user!.id;
  const User = getUser();
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found', errorCode: 'USER_NOT_FOUND' });
    return;
  }

  if (addresses) {
    user.addresses = addresses;
    // Set the default one (or first one) to legacy `address` object
    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
    if (defaultAddress) {
      user.address = {
        line1: defaultAddress.line1,
        line2: defaultAddress.line2,
        city: defaultAddress.city,
        state: defaultAddress.state,
        pincode: defaultAddress.pincode,
      };
    } else {
      user.address = undefined;
    }
  } else if (line1 && city && state && pincode) {
    user.address = { line1, line2, city, state, pincode };
  }

  user.markModified('addresses');
  user.markModified('address');
  await user.save();

  res.json({
    success: true,
    data: {
      address: user.address,
      addresses: user.addresses,
    },
  });
};

// ── GET /auth/admin/citizens — list citizens ──────────────────────────────────
export const listCitizens = async (req: Request, res: Response): Promise<void> => {
  try {
    const User = getUser();
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = Math.min(parseInt((req.query.limit as string) ?? '10', 10), 100);
    const search = (req.query.search as string) ?? '';
    const status = req.query.status as string | undefined;
    const district = req.query.district as string | undefined;

    const filter: Record<string, any> = { role: 'citizen' };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'verified') {
      filter.isVerified = true;
      filter.isActive = true;
    } else if (status === 'unverified') {
      filter.isVerified = false;
      filter.isActive = true;
    } else if (status === 'blocked') {
      filter.isActive = false;
    }

    if (district && district !== 'all') {
      filter.district = { $regex: district, $options: 'i' };
    }

    // Paginated list
    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Calculate aggregated metrics for cards
    const totalCitizens = await User.countDocuments({ role: 'citizen' });
    const activeCitizens = await User.countDocuments({ role: 'citizen', isActive: true });
    
    console.log('--- DEBUG CITIZENS ---');
    console.log('Mongoose Connection Ready State:', mongoose.connection.readyState);
    console.log('Mongoose Connection DB Name:', mongoose.connection.name);
    console.log('Total Documents in User Collection:', await User.countDocuments({}));
    console.log('Total Citizens found:', totalCitizens);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await User.countDocuments({ role: 'citizen', createdAt: { $gte: startOfMonth } });
    
    const pendingVerification = await User.countDocuments({ role: 'citizen', isVerified: false });
    const activeDistricts = await User.distinct('district', { role: 'citizen', district: { $ne: null, $exists: true } });

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        activeDistricts: activeDistricts.filter(Boolean).sort(),
        stats: {
          totalCitizens,
          activeCitizens,
          newThisMonth,
          pendingVerification
        }
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /auth/admin/citizens/:id — full citizen profile ───────────────────────
export const getCitizenDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const User = getUser();
    const { id } = req.params;
    const user = await User.findById(id).lean();
    if (!user || (user as any).role !== 'citizen') {
      res.status(404).json({ success: false, error: 'Citizen not found' });
      return;
    }
    // Compute age from dob
    let age: number | null = null;
    if ((user as any).dob) {
      const dob = new Date((user as any).dob);
      const diff = Date.now() - dob.getTime();
      age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    }
    res.json({
      success: true,
      data: {
        id: (user as any)._id,
        name: (user as any).name,
        phone: (user as any).phone,
        email: (user as any).email ?? null,
        dob: (user as any).dob ?? null,
        age,
        gender: (user as any).gender ?? null,
        avatar: (user as any).avatar ?? null,
        aadhaarMasked: (user as any).aadhaarMasked ?? null,
        panMasked: (user as any).panMasked ?? null,
        state: (user as any).state ?? null,
        district: (user as any).district ?? null,
        address: (user as any).address ?? null,
        addresses: (user as any).addresses ?? [],
        isVerified: (user as any).isVerified,
        isActive: (user as any).isActive,
        sessions: (user as any).sessions ?? [],
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listOperators = async (req: Request, res: Response): Promise<void> => {
  const Operator = getOperator();
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);

  const [items, total] = await Promise.all([
    Operator.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Operator.countDocuments(),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
};

// ── POST /auth/admin/operators — create operator ──────────────────────────────
export const createOperator = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, employeeId, department, role, permissions } = req.body as {
    name: string;
    email: string;
    password?: string;
    employeeId: string;
    department?: string;
    role?: 'operator' | 'admin' | 'super_admin';
    permissions?: string[];
  };

  const Operator = getOperator();
  const existing = await Operator.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400).json({ success: false, error: 'Operator already exists', errorCode: 'OPERATOR_EXISTS' });
    return;
  }

  const defaultPassword = password ?? 'Password123';
  const passwordHash = await hashPassword(defaultPassword);

  const operator = await Operator.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    employeeId,
    department: department ?? 'Operations',
    role: role ?? 'operator',
    permissions: permissions ?? ['verify_documents', 'approve_applications'],
    status: 'active',
  });

  res.status(201).json({
    success: true,
    data: {
      operator: {
        id: operator.id,
        name: operator.name,
        email: operator.email,
        employeeId: operator.employeeId,
        role: operator.role,
        status: operator.status,
      },
    },
  });

  // Trigger system notification to admin (notification endpoint on core-service itself)
  const coreUrl = `http://localhost:${process.env.PORT ?? 3001}`;
  import('axios').then(({ default: ax }) =>
    ax.post(`${coreUrl}/api/v1/notifications/send`, {
      citizenId: 'admin',
      title: 'New operator registered',
      body: `Operator ${operator.name} (${operator.employeeId}) registered in ${operator.department} department.`,
      type: 'system_update'
    }).catch(err => console.error('Failed to trigger operator notification:', err.message))
  );
};

// ── PATCH /auth/admin/citizens/:id/block ──────────────────────────────────────
export const toggleCitizenStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const User = getUser();
  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ success: false, error: 'Citizen not found', errorCode: 'CITIZEN_NOT_FOUND' });
    return;
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({ success: true, data: { user: { id: user.id, name: user.name, isActive: user.isActive } } });
};

// ── PATCH /auth/admin/operators/:id/status ────────────────────────────────────
export const updateOperatorStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body as { status: 'active' | 'suspended' };

  const Operator = getOperator();
  const operator = await Operator.findById(id);
  if (!operator) {
    res.status(404).json({ success: false, error: 'Operator not found', errorCode: 'OPERATOR_NOT_FOUND' });
    return;
  }

  operator.status = status;
  await operator.save();

  res.json({ success: true, data: { operator: { id: operator.id, name: operator.name, status: operator.status } } });

  // Trigger system notification to admin (notification endpoint on core-service itself)
  const coreUrl2 = `http://localhost:${process.env.PORT ?? 3001}`;
  import('axios').then(({ default: ax }) =>
    ax.post(`${coreUrl2}/api/v1/notifications/send`, {
      citizenId: 'admin',
      title: 'Operator access updated',
      body: `Operator ${operator.name}'s access status has been updated to ${status.toUpperCase()}.`,
      type: status === 'suspended' ? 'security_alert' : 'system_update'
    }).catch(err => console.error('Failed to trigger operator status notification:', err.message))
  );
};

// ── POST /auth/admin/citizens — create citizen ──────────────────────────────────
export const createCitizen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, aadhaarNumber, district, state } = req.body;

    const User = getUser();
    const existing = await User.findOne({ phone });
    if (existing) {
      res.status(400).json({ success: false, error: 'Citizen with this phone number already exists' });
      return;
    }

    const aadhaarMasked = aadhaarNumber && aadhaarNumber.length >= 4
      ? 'XXXX XXXX ' + aadhaarNumber.replace(/\s/g, '').slice(-4)
      : undefined;

    const newCitizen = await User.create({
      name,
      phone,
      email,
      aadhaarMasked,
      aadhaarNumber: aadhaarMasked,
      district: district || 'Lucknow',
      state: state || 'Uttar Pradesh',
      role: 'citizen',
      isVerified: true,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: newCitizen,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /auth/admin/citizens/import — bulk import citizens ───────────────────────
export const importCitizens = async (req: Request, res: Response): Promise<void> => {
  try {
    const { citizens } = req.body as {
      citizens: Array<{
        name: string;
        phone: string;
        email?: string;
        aadhaarNumber?: string;
        district?: string;
        state?: string;
      }>;
    };

    if (!Array.isArray(citizens)) {
      res.status(400).json({ success: false, error: 'Citizens list must be an array' });
      return;
    }

    let importedCount = 0;
    const User = getUser();
    for (const c of citizens) {
      if (!c.phone || !c.name) continue;
      
      const existing = await User.findOne({ phone: c.phone });
      if (existing) continue;

      const aadhaarMasked = c.aadhaarNumber && c.aadhaarNumber.length >= 4
        ? 'XXXX XXXX ' + c.aadhaarNumber.replace(/\s/g, '').slice(-4)
        : undefined;

      await User.create({
        name: c.name,
        phone: c.phone,
        email: c.email,
        aadhaarMasked,
        aadhaarNumber: aadhaarMasked,
        district: c.district || 'Lucknow',
        state: c.state || 'Uttar Pradesh',
        role: 'citizen',
        isVerified: true,
        isActive: true,
      });
      importedCount++;
    }

    res.json({
      success: true,
      data: { importedCount }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};


