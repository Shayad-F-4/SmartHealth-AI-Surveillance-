import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

export async function getActiveAlerts(req: AuthRequest, res: Response) {
  try {
    const district = req.query.district as string;
    const whereClause: any = { isActive: true };
    if (district && district !== 'ALL') {
      whereClause.district = { equals: district, mode: 'insensitive' };
    }

    const alerts = await prisma.communityAlert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve active alerts.' });
  }
}

export async function getAlertHistory(req: AuthRequest, res: Response) {
  try {
    const alerts = await prisma.communityAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve alert history.' });
  }
}

export async function createManualAlert(req: AuthRequest, res: Response) {
  try {
    const { district, disease, riskLevel, title, message, precautions } = req.body;
    if (!district || !disease || !title || !message) {
      return res.status(400).json({ error: 'District, disease, title, and message are required.' });
    }

    const alert = await prisma.communityAlert.create({
      data: {
        district,
        disease,
        riskLevel: riskLevel || 'WARNING',
        title,
        message,
        precautions: precautions || 'Follow public health hygiene recommendations and report symptoms promptly.',
        isActive: true,
      },
    });

    // Notify residents
    const residents = await prisma.patient.findMany({
      where: { district: { equals: district, mode: 'insensitive' } },
    });

    for (const r of residents) {
      await prisma.notification.create({
        data: {
          userId: r.userId,
          title,
          message,
          type: 'DISEASE_ALERT',
          priority: riskLevel === 'HIGH_RISK' ? 'CRITICAL' : 'WARNING',
          district,
          relatedDisease: disease,
        },
      });
    }

    await logAudit(req, 'CREATE_COMMUNITY_ALERT', 'COMMUNITY_ALERT', alert.id, `Created manual alert for ${district} (${disease})`);
    return res.status(201).json(alert);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create community alert.' });
  }
}

export async function toggleAlertStatus(req: AuthRequest, res: Response) {
  try {
    const alertId = req.params.id;
    const { isActive } = req.body;

    const updated = await prisma.communityAlert.update({
      where: { id: alertId },
      data: { isActive: Boolean(isActive) },
    });

    await logAudit(req, 'UPDATE_ALERT_STATUS', 'COMMUNITY_ALERT', alertId, `Set isActive=${isActive}`);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update alert status.' });
  }
}
