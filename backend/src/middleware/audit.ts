import prisma from '../config/prisma';
import { AuthRequest } from './auth';

export async function logAudit(
  req: AuthRequest,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string
) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        userRole: req.user?.role || 'ANONYMOUS',
        action,
        resource,
        resourceId: resourceId || null,
        ipAddress: String(ip),
        details: details || null,
      },
    });
  } catch (err) {
    console.error('[Audit Logger] Failed to write audit log:', err);
  }
}
