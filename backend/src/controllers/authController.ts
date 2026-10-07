import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { generateSmartHealthId } from '../services/healthIdService';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../middleware/auth';
import { checkLockout, recordFailedLogin, clearFailedLogins } from '../middleware/rateLimiter';
import { initRedis, generateSessionId, createSession, revokeSession, revokeAllUserSessions } from '../services/sessionService';

const JWT_SECRET = process.env.JWT_SECRET || 'smarthealth_jwt_secure_super_secret_2026_key';

export async function register(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      role,
      name,
      phone,
      // Patient specific fields
      dob,
      gender,
      bloodGroup,
      address,
      district,
      lat,
      lng,
      emergencyContactName,
      emergencyContactPhone,
      allergies,
      chronicConditions,
      // Doctor specific fields
      licenseNumber,
      specialty,
      qualification,
      experienceYears,
      hospitalId,
    } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required.' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter.' });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'Registration failed: An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role,
        name,
        phone,
      },
    });

    let patientProfile = null;
    let doctorProfile = null;

    if (role === 'PATIENT') {
      const healthId = await generateSmartHealthId();
      patientProfile = await prisma.patient.create({
        data: {
          userId: user.id,
          healthId,
          dob: dob ? new Date(dob) : new Date('1990-01-01'),
          gender: gender || 'OTHER',
          bloodGroup: bloodGroup || 'O+',
          address: address || '123 Main Street',
          district: district || 'Riverside District',
          lat: lat ? parseFloat(lat) : 12.9716,
          lng: lng ? parseFloat(lng) : 77.5946,
          emergencyContactName: emergencyContactName || 'Primary Emergency Contact',
          emergencyContactPhone: emergencyContactPhone || phone || '9999999999',
          allergies: allergies || '',
          chronicConditions: chronicConditions || '',
        },
      });
    } else if (role === 'DOCTOR') {
      doctorProfile = await prisma.doctor.create({
        data: {
          userId: user.id,
          licenseNumber: licenseNumber || `DOC-${Date.now().toString().slice(-6)}`,
          specialty: specialty || 'General Medicine',
          qualification: qualification || 'MBBS, MD',
          experienceYears: experienceYears ? parseInt(experienceYears) : 5,
          hospitalId: hospitalId || null,
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    (req as any).user = { id: user.id, email: user.email, role: user.role, name: user.name };
    await logAudit(
      req as any,
      'REGISTER',
      'USER',
      user.id,
      `Registered user with role ${user.role}`
    );

    return res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        patient: patientProfile ? {
          ...patientProfile,
          verificationStatus: 'UNVERIFIED',
        } : null,
        doctor: doctorProfile ? {
          ...doctorProfile,
          verificationStatus: 'UNVERIFIED',
        } : null,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration.', details: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check for account lockout
    const lockoutCheck = checkLockout(email.toLowerCase());
    if (lockoutCheck.locked) {
      await logAudit(
        { user: undefined, ip: req.socket.remoteAddress } as any,
        'LOGIN_BLOCKED',
        'USER',
        undefined,
        `Login blocked for ${email} (too many failed attempts)`
      );
      return res.status(429).json({
        error: 'Account temporarily locked due to too many failed login attempts. Please try again later.',
        remainingTime: lockoutCheck.remainingTime ? `${lockoutCheck.remainingTime} minutes` : undefined,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        patient: true,
        doctor: { include: { hospital: true } },
      },
    });

    // Generic error to prevent user enumeration
    if (!user) {
      recordFailedLogin(email.toLowerCase());
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      await prisma.loginHistory.create({
        data: {
          userId: '00000000-0000-0000-0000-000000000000', // Placeholder for anonymous
          ipAddress: String(ipAddress),
          userAgent: String(userAgent),
          success: false,
          failureReason: 'User not found',
        },
      });
      await logAudit(
        { user: undefined, ip: req.socket.remoteAddress } as any,
        'LOGIN_FAILED',
        'USER',
        undefined,
        `Failed login attempt for ${email.toLowerCase()}`
      );
      return res.status(401).json({ error: 'Invalid credentials. Please verify email and password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      recordFailedLogin(email.toLowerCase());
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: String(ipAddress),
          userAgent: String(userAgent),
          success: false,
          failureReason: 'Invalid password',
        },
      });
      await logAudit(
        { user: undefined, ip: req.socket.remoteAddress } as any,
        'LOGIN_FAILED',
        'USER',
        user.id,
        `Failed login attempt for user ${user.id}`
      );
      return res.status(401).json({ error: 'Invalid credentials. Please verify email and password.' });
    }

    // Clear failed login attempts on successful login
    clearFailedLogins(email.toLowerCase());

    // Generate session ID for revocation support
    const sessionId = generateSessionId();

    // Record login history
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: String(ipAddress),
        userAgent: String(userAgent),
        success: true,
      },
    });

    // Create session in Redis for revocation support (non-blocking)
    createSession(sessionId, user.id, user.role, String(ipAddress), String(userAgent)).catch((err) => {
      console.error('[Auth] Failed to create session:', err);
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, jti: sessionId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    (req as any).user = { id: user.id, email: user.email, role: user.role, name: user.name };
    await logAudit(
      req as any,
      'LOGIN_SUCCESS',
      'USER',
      user.id,
      `User logged in (${user.role})`
    );

    return res.json({
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        patient: user.patient ? {
          ...user.patient,
          verificationStatus: user.patient.verificationStatus,
          verifiedDocumentType: user.patient.verifiedDocumentType,
          verifiedAt: user.patient.verifiedAt,
        } : null,
        doctor: user.doctor ? {
          ...user.doctor,
          verificationStatus: user.doctor.verificationStatus,
          verifiedDocumentType: user.doctor.verifiedDocumentType,
          verifiedAt: user.doctor.verifiedAt,
        } : null,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        patient: true,
        doctor: { include: { hospital: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: (user as any).avatarUrl,
      patient: user.patient ? {
        ...user.patient,
        verificationStatus: user.patient.verificationStatus,
        verifiedDocumentType: user.patient.verifiedDocumentType,
        verifiedAt: user.patient.verifiedAt,
      } : null,
      doctor: user.doctor ? {
        ...user.doctor,
        verificationStatus: user.doctor.verificationStatus,
        verifiedDocumentType: user.doctor.verifiedDocumentType,
        verifiedAt: user.doctor.verifiedAt,
      } : null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch current user profile.' });
  }
}

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

const avatarUpload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only standard image formats (PNG, JPG, WEBP, etc.) are allowed.'));
    }
  },
});

export const avatarUploadMiddleware = (req: any, res: any, next: any) => {
  avatarUpload.single('avatar')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Profile photo size exceeds 15MB limit. Please select a smaller file.' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || 'Avatar upload error.' });
    }
    next();
  });
};

export async function uploadAvatar(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar file provided.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
    const fileName = `avatar-${req.user.id}-${Date.now()}${ext}`;
    const filePath = path.join(AVATAR_DIR, fileName);

    fs.writeFileSync(filePath, req.file.buffer);
    const avatarUrl = `/uploads/avatars/${fileName}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      include: {
        patient: true,
        doctor: { include: { hospital: true } },
      },
    });

    await logAudit(req, 'UPDATE_AVATAR', 'USER', updatedUser.id, 'Updated profile picture avatar');

    return res.json({
      message: 'Avatar uploaded successfully.',
      avatarUrl: updatedUser.avatarUrl,
      bannerUrl: updatedUser.bannerUrl,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        bannerUrl: updatedUser.bannerUrl,
        patient: updatedUser.patient ? {
          ...updatedUser.patient,
          verificationStatus: updatedUser.patient.verificationStatus,
          verifiedDocumentType: updatedUser.patient.verifiedDocumentType,
          verifiedAt: updatedUser.patient.verifiedAt,
        } : null,
        doctor: updatedUser.doctor ? {
          ...updatedUser.doctor,
          verificationStatus: updatedUser.doctor.verificationStatus,
          verifiedDocumentType: updatedUser.doctor.verifiedDocumentType,
          verifiedAt: updatedUser.doctor.verifiedAt,
        } : null,
      },
    });
  } catch (err: any) {
    console.error('Error uploading avatar:', err);
    return res.status(500).json({ error: err?.message || 'Failed to upload profile picture.' });
  }
}

const BANNER_DIR = path.join(process.cwd(), 'uploads', 'banners');
if (!fs.existsSync(BANNER_DIR)) {
  fs.mkdirSync(BANNER_DIR, { recursive: true });
}

const bannerUpload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit for high-res LinkedIn banners
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only standard image formats (PNG, JPG, WEBP, etc.) are allowed.'));
    }
  },
});

export const bannerUploadMiddleware = (req: any, res: any, next: any) => {
  bannerUpload.single('banner')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Banner image size exceeds 15MB limit. Please select a smaller file.' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || 'Banner upload error.' });
    }
    next();
  });
};

export async function uploadBanner(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No banner file provided.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
    const fileName = `banner-${req.user.id}-${Date.now()}${ext}`;
    const filePath = path.join(BANNER_DIR, fileName);

    fs.writeFileSync(filePath, req.file.buffer);
    const bannerUrl = `/uploads/banners/${fileName}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { bannerUrl },
      include: {
        patient: true,
        doctor: { include: { hospital: true } },
      },
    });

    await logAudit(req, 'UPDATE_BANNER', 'USER', updatedUser.id, 'Updated profile banner header');

    return res.json({
      message: 'Banner uploaded successfully.',
      bannerUrl: updatedUser.bannerUrl,
      avatarUrl: updatedUser.avatarUrl,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        bannerUrl: updatedUser.bannerUrl,
        patient: updatedUser.patient ? {
          ...updatedUser.patient,
          verificationStatus: updatedUser.patient.verificationStatus,
          verifiedDocumentType: updatedUser.patient.verifiedDocumentType,
          verifiedAt: updatedUser.patient.verifiedAt,
        } : null,
        doctor: updatedUser.doctor ? {
          ...updatedUser.doctor,
          verificationStatus: updatedUser.doctor.verificationStatus,
          verifiedDocumentType: updatedUser.doctor.verifiedDocumentType,
          verifiedAt: updatedUser.doctor.verifiedAt,
        } : null,
      },
    });
  } catch (err: any) {
    console.error('Error uploading banner:', err);
    return res.status(500).json({ error: err?.message || 'Failed to upload profile banner.' });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Revoke the session if it has a jti
    if (req.user.jti) {
      await revokeSession(req.user.jti);
    }

    await logAudit(
      req,
      'LOGOUT',
      'USER',
      req.user.id,
      `User logged out (${req.user.role})`
    );

    return res.json({ message: 'Logged out successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to logout.' });
  }
}

export async function updateMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { name, phone, avatarUrl, currentPassword, newPassword } = req.body;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        await logAudit(
          req,
          'PASSWORD_CHANGE_FAILED',
          'USER',
          user.id,
          'Failed password change attempt'
        );
        return res.status(401).json({ error: 'Current password is incorrect.' });
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

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash },
      });

      // Revoke all other sessions after password change
      if (req.user.jti) {
        await revokeAllUserSessions(req.user.id, req.user.jti);
      }

      await logAudit(
        req,
        'PASSWORD_CHANGED',
        'USER',
        req.user.id,
        'Password changed successfully'
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      include: {
        patient: true,
        doctor: { include: { hospital: true } },
      },
    });

    await logAudit(req, 'UPDATE_USER_ACCOUNT', 'USER', updatedUser.id, 'Updated user account details');

    return res.json({
      message: 'Account details updated successfully.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        patient: updatedUser.patient ? {
          ...updatedUser.patient,
          verificationStatus: updatedUser.patient.verificationStatus,
          verifiedDocumentType: updatedUser.patient.verifiedDocumentType,
          verifiedAt: updatedUser.patient.verifiedAt,
        } : null,
        doctor: updatedUser.doctor ? {
          ...updatedUser.doctor,
          verificationStatus: updatedUser.doctor.verificationStatus,
          verifiedDocumentType: updatedUser.doctor.verifiedDocumentType,
          verifiedAt: updatedUser.doctor.verifiedAt,
        } : null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update account details.' });
  }
}
