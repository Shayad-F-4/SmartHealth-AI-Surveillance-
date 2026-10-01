import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const action = req.query.action as string;
    const role = req.query.role as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '30');
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (action && action !== 'ALL') {
      whereClause.action = action;
    }
    if (role && role !== 'ALL') {
      whereClause.userRole = role;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    return res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}
