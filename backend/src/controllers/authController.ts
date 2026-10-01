import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { generateSmartHealthId } from '../services/healthIdService';
import { logAudit } from '../middleware/audit';
import { AuthRequest } from '../middleware/auth';

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

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
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
        patient: patientProfile,
        doctor: doctorProfile,
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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        patient: true,
        doctor: { include: { hospital: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify email and password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify email and password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    (req as any).user = { id: user.id, email: user.email, role: user.role, name: user.name };
    await logAudit(
      req as any,
      'LOGIN',
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
        patient: user.patient,
        doctor: user.doctor,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.', details: err.message });
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

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      patient: user.patient,
      doctor: user.doctor,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch current user profile.' });
  }
}
