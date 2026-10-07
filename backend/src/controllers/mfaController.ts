import { Response } from 'express';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import prisma from '../config/prisma';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../middleware/auth';

// Generate TOTP secret and QR code for MFA setup
export async function setupMFA(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Allow all roles (PATIENT, DOCTOR, ADMIN) to setup MFA


    // Check if MFA is already enabled
    const existingMFA = await prisma.mFASetup.findUnique({
      where: { userId: req.user.id },
    });

    if (existingMFA && existingMFA.enabled) {
      return res.status(400).json({ error: 'MFA is already enabled for this account.' });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `SmartHealth (${req.user.email})`,
      issuer: 'SmartHealth',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store secret (in production, encrypt this)
    const mfaSetup = await prisma.mFASetup.upsert({
      where: { userId: req.user.id },
      update: {
        secret: secret.base32,
        enabled: false,
        verifiedAt: null,
      },
      create: {
        userId: req.user.id,
        secret: secret.base32,
        enabled: false,
      },
    });

    await logAudit(
      req,
      'MFA_SETUP_INITIATED',
      'USER',
      req.user.id,
      'MFA setup initiated'
    );

    return res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan the QR code with your authenticator app, then verify to enable MFA.',
    });
  } catch (err: any) {
    console.error('MFA setup error:', err);
    return res.status(500).json({ error: 'Failed to setup MFA.' });
  }
}

// Verify TOTP token and enable MFA
export async function verifyAndEnableMFA(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const mfaSetup = await prisma.mFASetup.findUnique({
      where: { userId: req.user.id },
    });

    if (!mfaSetup) {
      return res.status(400).json({ error: 'MFA setup not initiated. Please start MFA setup first.' });
    }

    if (mfaSetup.enabled) {
      return res.status(400).json({ error: 'MFA is already enabled.' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: mfaSetup.secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (±1 period) for clock drift
    });

    if (!verified) {
      await logAudit(
        req,
        'MFA_VERIFICATION_FAILED',
        'USER',
        req.user.id,
        'Invalid MFA token during setup'
      );
      return res.status(400).json({ error: 'Invalid verification token. Please try again.' });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(speakeasy.generateSecret({ length: 20 }).base32.substring(0, 8).toUpperCase());
    }

    // Enable MFA
    await prisma.mFASetup.update({
      where: { userId: req.user.id },
      data: {
        enabled: true,
        verifiedAt: new Date(),
        backupCodes: JSON.stringify(backupCodes),
      },
    });

    await logAudit(
      req,
      'MFA_ENABLED',
      'USER',
      req.user.id,
      'MFA enabled successfully'
    );

    return res.json({
      message: 'MFA enabled successfully.',
      backupCodes,
      warning: 'Save these backup codes securely. You will not see them again.',
    });
  } catch (err: any) {
    console.error('MFA verification error:', err);
    return res.status(500).json({ error: 'Failed to verify MFA.' });
  }
}

// Verify TOTP token during login
export async function verifyMFALogin(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'MFA token is required.' });
    }

    const mfaSetup = await prisma.mFASetup.findUnique({
      where: { userId: req.user.id },
    });

    if (!mfaSetup || !mfaSetup.enabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this account.' });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: mfaSetup.secret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      await logAudit(
        req,
        'MFA_LOGIN_FAILED',
        'USER',
        req.user.id,
        'Invalid MFA token during login'
      );
      return res.status(401).json({ error: 'Invalid MFA token.' });
    }

    await logAudit(
      req,
      'MFA_LOGIN_SUCCESS',
      'USER',
      req.user.id,
      'MFA login successful'
    );

    return res.json({ message: 'MFA verified successfully.' });
  } catch (err: any) {
    console.error('MFA login verification error:', err);
    return res.status(500).json({ error: 'Failed to verify MFA.' });
  }
}

// Disable MFA (requires current password for security)
export async function disableMFA(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Current password is required to disable MFA.' });
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await logAudit(
        req,
        'MFA_DISABLE_FAILED',
        'USER',
        req.user.id,
        'Failed MFA disable attempt (invalid password)'
      );
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Disable MFA
    await prisma.mFASetup.update({
      where: { userId: req.user.id },
      data: {
        enabled: false,
        verifiedAt: null,
        backupCodes: null,
      },
    });

    await logAudit(
      req,
      'MFA_DISABLED',
      'USER',
      req.user.id,
      'MFA disabled successfully'
    );

    return res.json({ message: 'MFA disabled successfully.' });
  } catch (err: any) {
    console.error('MFA disable error:', err);
    return res.status(500).json({ error: 'Failed to disable MFA.' });
  }
}

// Get MFA status
export async function getMFAStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const mfaSetup = await prisma.mFASetup.findUnique({
      where: { userId: req.user.id },
      select: {
        enabled: true,
        verifiedAt: true,
      },
    });

    return res.json({
      enabled: mfaSetup?.enabled || false,
      verifiedAt: mfaSetup?.verifiedAt || null,
    });
  } catch (err: any) {
    console.error('Error fetching MFA status:', err);
    return res.status(500).json({ error: 'Failed to fetch MFA status.' });
  }
}
