import { Request, Response, NextFunction } from 'express';

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
//deploy

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

export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden', errorCode: 'FORBIDDEN' });
      return;
    }
    next();
  };
