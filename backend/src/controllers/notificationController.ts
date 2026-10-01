import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getUserNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

export async function markNotificationAsRead(req: AuthRequest, res: Response) {
  try {
    const notifId = req.params.id;
    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
}

export async function markAllNotificationsAsRead(req: AuthRequest, res: Response) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
}
