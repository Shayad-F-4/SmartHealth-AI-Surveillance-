import { Response } from 'express';
import prisma from '../config/prisma';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

// Get login history for current user
export async function getLoginHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const history = await prisma.loginHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { loginTime: 'desc' },
      take: 50,
    });

    return res.json({ history });
  } catch (err: any) {
    console.error('Error fetching login history:', err);
    return res.status(500).json({ error: 'Failed to fetch login history.' });
  }
}

// Get current user's security settings
export async function getSecuritySettings(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        mfaSetup: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { loginTime: 'desc' },
      take: 10,
    });

    return res.json({
      mfaEnabled: user.mfaSetup?.enabled || false,
      mfaVerifiedAt: user.mfaSetup?.verifiedAt || null,
      recentLogins: loginHistory,
    });
  } catch (err: any) {
    console.error('Error fetching security settings:', err);
    return res.status(500).json({ error: 'Failed to fetch security settings.' });
  }
}

// Admin only: Get user login history by ID
export async function getUserLoginHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { userId } = req.params;

    const history = await prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { loginTime: 'desc' },
      take: 100,
    });

    return res.json({ history });
  } catch (err: any) {
    console.error('Error fetching user login history:', err);
    return res.status(500).json({ error: 'Failed to fetch user login history.' });
  }
}
