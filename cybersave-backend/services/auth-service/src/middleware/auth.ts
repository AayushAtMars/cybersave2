import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../config/redis';
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

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ success: false, error: 'Forbidden', errorCode: 'FORBIDDEN' });
      return;
    }
    next();
  };
