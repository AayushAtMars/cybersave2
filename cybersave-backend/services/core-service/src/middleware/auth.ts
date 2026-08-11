import { Request, Response, NextFunction } from 'express';
import { getModels } from '../config/models';
import { verifyAccessToken } from '../modules/auth/utils/jwt';
import { UserRole } from '@cybersave/shared';

// Extend Express Request to carry authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        jti?: string;
      };
    }
  }
}

// ── Full JWT verify (used by auth-module routes that sign tokens directly) ─────
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided', errorCode: 'UNAUTHORIZED' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    // Check token blacklist via Redis (only for auth module which has Redis access)
    const { isTokenBlacklisted } = await import('../modules/auth/config/redis');
    const blacklisted = await isTokenBlacklisted(payload.jti);
    if (blacklisted) {
      res.status(401).json({ success: false, error: 'Token revoked', errorCode: 'TOKEN_REVOKED' });
      return;
    }
    req.user = { id: payload.sub, role: payload.role, jti: payload.jti };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token', errorCode: 'TOKEN_INVALID' });
  }
};

// ── Gateway-header based authenticate (notification & support modules) ─────────
// Gateway has already verified the JWT; it forwards x-user-id and x-user-role
export const authenticateGateway = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  if (!userId || !userRole) {
    res.status(401).json({ success: false, error: 'Unauthorized', errorCode: 'UNAUTHORIZED' });
    return;
  }
  req.user = { id: userId, role: userRole };
  next();
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ success: false, error: 'Forbidden', errorCode: 'FORBIDDEN' });
      return;
    }
    next();
  };
