import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isSessionRevoked, updateSessionActivity } from '../services/sessionService';

const JWT_SECRET = process.env.JWT_SECRET || 'smarthealth_jwt_secure_super_secret_2026_key';

export interface AuthRequest<P = Record<string, string>, ResBody = any, ReqBody = any, ReqQuery = any> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    jti?: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Skip Redis session check in development if Redis is not available
    // Session revocation will work when Redis is configured
    if (decoded.jti && process.env.NODE_ENV === 'production') {
      try {
        const revoked = await isSessionRevoked(decoded.jti);
        if (revoked) {
          return res.status(401).json({ error: 'Session has been revoked. Please login again.' });
        }
        
        updateSessionActivity(decoded.jti).catch((err) => {
          console.error('[Auth] Failed to update session activity:', err);
        });
      } catch (err) {
        console.error('[Auth] Session check failed:', err);
      }
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Auth] JWT verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}
