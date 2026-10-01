import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function authorize(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires role: ${allowedRoles.join(' or ')}. Your role is ${req.user.role}.`,
      });
    }

    next();
  };
}
