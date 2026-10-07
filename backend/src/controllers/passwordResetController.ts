import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../middleware/auth';
import { passwordResetRateLimiter } from '../middleware/rateLimiter';
import { emailService } from '../services/emailService';
import { revokeAllUserSessions } from '../services/sessionService';

// Store reset tokens in memory (production should use Redis)
const resetTokens = new Map<string, { userId: string; expires: number }>();

// Request password reset
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Generic response to prevent user enumeration
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

      // Store token (invalidate any existing token for this user)
      for (const [storedToken, data] of resetTokens.entries()) {
        if (data.userId === user.id) {
          resetTokens.delete(storedToken);
        }
      }

      resetTokens.set(token, { userId: user.id, expires });

      await logAudit(
        { user: undefined, ip: req.socket.remoteAddress } as any,
        'PASSWORD_RESET_REQUESTED',
        'USER',
        user.id,
        `Password reset requested for ${email.toLowerCase()}`
      );

      // Send email with reset link
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
      const emailSent = await emailService.sendPasswordResetEmail(user.email, token, resetUrl);

      if (!emailSent) {
        console.warn('[PasswordReset] Email not sent, token available in development mode');
        // In development, return token for testing
        if (process.env.NODE_ENV === 'development') {
          return res.json({
            message: 'If an account exists with this email, a password reset link has been sent.',
            resetToken: token, // Only in development
            resetUrl,
          });
        }
      }
    }

    // Always return generic response
    return res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (err: any) {
    console.error('Password reset request error:', err);
    return res.status(500).json({ error: 'Server error during password reset request.' });
  }
}

// Reset password with token
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one uppercase letter.' });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one lowercase letter.' });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one number.' });
    }

    // Verify token
    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (Date.now() > tokenData.expires) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: tokenData.userId },
      data: { passwordHash },
    });

    // Revoke all existing sessions
    await revokeAllUserSessions(tokenData.userId);

    // Invalidate token
    resetTokens.delete(token);

    await logAudit(
      { user: { id: tokenData.userId }, ip: req.socket.remoteAddress } as any,
      'PASSWORD_RESET_COMPLETED',
      'USER',
      tokenData.userId,
      'Password reset completed, all sessions revoked'
    );

    return res.json({ message: 'Password has been reset successfully. Please login again.' });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return res.status(500).json({ error: 'Server error during password reset.' });
  }
}
