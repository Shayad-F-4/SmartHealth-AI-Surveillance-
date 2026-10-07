import { Response } from 'express';
import prisma from '../config/prisma';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../middleware/auth';
import { getUserSessions as getSessions, revokeSession, revokeAllUserSessions } from '../services/sessionService';

// Get current user's active sessions
export async function getUserSessions(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const sessions = await getSessions(req.user.id);

    // Mark current session
    const currentSessionId = req.user.jti;
    const sessionsWithCurrent = sessions.map((session: any) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }));

    return res.json({ sessions: sessionsWithCurrent });
  } catch (err: any) {
    console.error('Error fetching user sessions:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
}

// Revoke a specific session
export async function revokeUserSession(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { sessionId } = req.params;

    // Verify session belongs to current user
    const sessions = await getSessions(req.user.id);
    const session = sessions.find((s: any) => s.id === sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only revoke your own sessions.' });
    }

    await revokeSession(sessionId);

    await logAudit(
      req,
      'SESSION_REVOKED',
      'USER',
      req.user.id,
      `Revoked session ${sessionId}`
    );

    return res.json({ message: 'Session revoked successfully.' });
  } catch (err: any) {
    console.error('Error revoking session:', err);
    return res.status(500).json({ error: 'Failed to revoke session.' });
  }
}

// Revoke all sessions except current
export async function revokeAllOtherSessions(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const currentSessionId = req.user.jti;
    await revokeAllUserSessions(req.user.id, currentSessionId);

    await logAudit(
      req,
      'ALL_SESSIONS_REVOKED',
      'USER',
      req.user.id,
      'Revoked all sessions except current'
    );

    return res.json({ message: 'All other sessions revoked successfully.' });
  } catch (err: any) {
    console.error('Error revoking all sessions:', err);
    return res.status(500).json({ error: 'Failed to revoke sessions.' });
  }
}
