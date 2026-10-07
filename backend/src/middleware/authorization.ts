import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../config/prisma';

/**
 * Check if the authenticated user is the owner of a resource
 * Prevents IDOR (Insecure Direct Object Reference) vulnerabilities
 */
export async function requireResourceOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { userId } = req.params;

  // Admin can access any resource
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Users can only access their own resources
  if (userId !== req.user.id) {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resource: 'USER_RESOURCE',
        resourceId: userId,
        ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'),
        details: `User ${req.user.id} attempted to access resource ${userId}`,
      },
    });
    return res.status(403).json({ error: 'Access denied. You do not have permission to access this resource.' });
  }

  next();
}

/**
 * Check if the authenticated user can access a patient's data
 * Only the patient themselves or authorized doctors can access
 */
export async function requirePatientAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { patientId } = req.params;

  // Admin can access any patient data
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Patient can access their own data
  if (req.user.role === 'PATIENT') {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    if (patient.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only access your own data.' });
    }

    return next();
  }

  // Doctors can access patient data for their authorized patients
  if (req.user.role === 'DOCTOR') {
    // In a real system, check if doctor has authorization for this patient
    // For now, allow doctors to access (in production, add authorization check)
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // TODO: Add proper doctor-patient authorization check
    // For now, allow access (this should be tightened in production)
    return next();
  }

  return res.status(403).json({ error: 'Access denied.' });
}

/**
 * Check if the authenticated user can access a doctor's data
 * Only the doctor themselves or admins can access
 */
export async function requireDoctorAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { doctorId } = req.params;

  // Admin can access any doctor data
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Doctor can access their own data
  if (req.user.role === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    if (doctor.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only access your own data.' });
    }

    return next();
  }

  return res.status(403).json({ error: 'Access denied.' });
}

/**
 * Check if the authenticated user can access a document
 * Only the document owner or admins can access
 */
export async function requireDocumentAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { documentId } = req.params;

  // Admin can access any document
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Check if document belongs to the user
  const document = await prisma.identityDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (document.userId !== req.user.id) {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_DOCUMENT_ACCESS',
        resource: 'IDENTITY_DOCUMENT',
        resourceId: documentId,
        ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'),
        details: `User ${req.user.id} attempted to access document ${documentId}`,
      },
    });
    return res.status(403).json({ error: 'Access denied. You do not have permission to access this document.' });
  }

  next();
}
