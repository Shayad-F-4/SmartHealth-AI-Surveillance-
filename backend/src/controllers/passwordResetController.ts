import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { logAudit } from '../middleware/audit';
import { emailService } from '../services/emailService';
import { revokeAllUserSessions } from '../services/sessionService';

// Store reset tokens & OTPs in memory: key -> { userId, email, expires, otpCode, token }
const resetTokens = new Map<string, { userId: string; email: string; expires: number; otpCode: string; token: string }>();

// Request password reset
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return res.status(404).json({
        error: `No registered account found with email: ${cleanEmail}. Please check your spelling or register a new account.`,
      });
    }

    // Generate secure random token and 6-digit numerical OTP code
    const token = crypto.randomBytes(32).toString('hex');
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits (e.g. 849201)
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour validity

    // Invalidate existing tokens for this user
    for (const [storedKey, data] of resetTokens.entries()) {
      if (data.userId === user.id) {
        resetTokens.delete(storedKey);
      }
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      expires,
      otpCode,
      token,
    };

    // Store by token, by otpCode, and by cleanEmail for flexible retrieval
    resetTokens.set(token, tokenPayload);
    resetTokens.set(otpCode, tokenPayload);
    resetTokens.set(cleanEmail, tokenPayload);

    await logAudit(
      { user: undefined, ip: req.socket.remoteAddress } as any,
      'PASSWORD_RESET_REQUESTED',
      'USER',
      user.id,
      `Password reset requested for ${cleanEmail}`
    );

    // Attempt to send email if SMTP service configured
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    try {
      await emailService.sendPasswordResetEmail(user.email, token, resetUrl);
    } catch (mailErr) {
      console.warn('[PasswordReset] Email sending warning:', mailErr);
    }

    // Return friendly response with token and OTP code for immediate in-app reset
    return res.json({
      success: true,
      message: `Password reset verification code generated for ${user.email}.`,
      resetToken: token,
      otpCode: otpCode,
      email: user.email,
      userName: user.name,
      role: user.role,
    });
  } catch (err: any) {
    console.error('Password reset request error:', err);
    return res.status(500).json({ error: 'Server error during password reset request.', details: err.message });
  }
}

// Reset password with token or OTP code
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, otpCode, email, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    // Lookup tokenData by token, otpCode, or email
    let tokenData = null;

    if (token && resetTokens.has(token)) {
      tokenData = resetTokens.get(token);
    } else if (otpCode && resetTokens.has(otpCode.toString().trim())) {
      tokenData = resetTokens.get(otpCode.toString().trim());
    } else if (email && resetTokens.has(email.toString().trim().toLowerCase())) {
      const candidate = resetTokens.get(email.toString().trim().toLowerCase());
      if (candidate && (!otpCode || candidate.otpCode === otpCode.toString().trim())) {
        tokenData = candidate;
      }
    }

    if (!tokenData) {
      return res.status(400).json({
        error: 'Invalid or expired verification code / token. Please request a new password reset.',
      });
    }

    if (Date.now() > tokenData.expires) {
      resetTokens.delete(tokenData.token);
      resetTokens.delete(tokenData.otpCode);
      resetTokens.delete(tokenData.email);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: tokenData.userId },
      data: { passwordHash },
      select: { id: true, email: true, role: true, name: true },
    });

    // Revoke all existing sessions for security
    try {
      await revokeAllUserSessions(tokenData.userId);
    } catch {
      // non-blocking
    }

    // Clean up reset tokens
    resetTokens.delete(tokenData.token);
    resetTokens.delete(tokenData.otpCode);
    resetTokens.delete(tokenData.email);

    await logAudit(
      { user: { id: updatedUser.id }, ip: req.socket.remoteAddress } as any,
      'PASSWORD_RESET_COMPLETED',
      'USER',
      updatedUser.id,
      `Password reset completed successfully for ${updatedUser.email}`
    );

    return res.json({
      success: true,
      message: 'Password has been reset successfully! You can now log in with your new password.',
      email: updatedUser.email,
    });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return res.status(500).json({ error: 'Server error during password reset.', details: err.message });
  }
}
