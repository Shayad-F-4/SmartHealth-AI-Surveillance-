import { Request, Response } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { SecureDocumentStorage } from '../services/secureDocumentStorage';
import { logAudit } from '../middleware/audit';
import { DocumentType, VerificationStatus } from '@prisma/client';

// Multer memory storage configuration (Max 5MB)
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG/JPEG files are allowed.'));
    }
  },
});

export const doctorDocumentUploadMiddleware = upload.single('document');

const VALID_DOC_TYPES = [
  'MEDICAL_REGISTRATION_CERTIFICATE',
  'MEDICAL_DEGREE',
  'SPECIALIZATION_CERTIFICATE',
  'ADDITIONAL_CERTIFICATE',
  'IDENTITY_SUPPORTING',
  'HOSPITAL_AFFILIATION_PROOF',
  'OTHER_PROFESSIONAL',
];

/**
 * GET /api/doctors/verification/status
 * Detailed verification status for the authenticated doctor
 */
export async function getDoctorVerificationStatus(req: AuthRequest, res: Response) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        hospital: true,
        doctorDocuments: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    // Check mandatory documents
    const docTypes = doctor.doctorDocuments.map((d) => d.documentType);
    const hasRegistration = docTypes.includes('MEDICAL_REGISTRATION_CERTIFICATE');
    const hasDegree = docTypes.includes('MEDICAL_DEGREE');
    const hasSpecialization = docTypes.includes('SPECIALIZATION_CERTIFICATE');
    const hasAdditional = docTypes.includes('ADDITIONAL_CERTIFICATE') || docTypes.includes('OTHER_PROFESSIONAL');
    const hasIdentity = docTypes.includes('IDENTITY_SUPPORTING') || docTypes.includes('HOSPITAL_AFFILIATION_PROOF');

    const canSubmit = hasRegistration && hasDegree;

    return res.json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        licenseNumber: doctor.licenseNumber,
        specialty: doctor.specialty,
        qualification: doctor.qualification,
        hospital: doctor.hospital,
        verificationStatus: doctor.verificationStatus,
        isActive: doctor.isActive,
        verifiedBy: doctor.verifiedBy,
        verifiedAt: doctor.verifiedAt,
        rejectionReason: doctor.rejectionReason,
        reviewedAt: doctor.reviewedAt,
      },
      requirements: {
        mandatory: [
          {
            key: 'MEDICAL_REGISTRATION_CERTIFICATE',
            title: 'Medical / Practitioner Registration Certificate',
            required: true,
            uploaded: hasRegistration,
            status: doctor.doctorDocuments.find((d) => d.documentType === 'MEDICAL_REGISTRATION_CERTIFICATE')?.status || 'NOT_UPLOADED',
          },
          {
            key: 'MEDICAL_DEGREE',
            title: 'Primary Qualifying Medical Degree',
            required: true,
            uploaded: hasDegree,
            status: doctor.doctorDocuments.find((d) => d.documentType === 'MEDICAL_DEGREE')?.status || 'NOT_UPLOADED',
          },
        ],
        supporting: [
          {
            key: 'SPECIALIZATION_CERTIFICATE',
            title: 'Specialization Degree / Additional Qualification',
            required: false,
            uploaded: hasSpecialization,
            status: doctor.doctorDocuments.find((d) => d.documentType === 'SPECIALIZATION_CERTIFICATE')?.status || 'NOT_UPLOADED',
          },
          {
            key: 'ADDITIONAL_CERTIFICATE',
            title: 'Additional Practitioner / Professional Certificate',
            required: false,
            uploaded: hasAdditional,
            status: doctor.doctorDocuments.find((d) => d.documentType === 'ADDITIONAL_CERTIFICATE' || d.documentType === 'OTHER_PROFESSIONAL')?.status || 'NOT_UPLOADED',
          },
          {
            key: 'IDENTITY_SUPPORTING',
            title: 'Identity / Hospital Affiliation Document',
            required: false,
            uploaded: hasIdentity,
            status: doctor.doctorDocuments.find((d) => d.documentType === 'IDENTITY_SUPPORTING' || d.documentType === 'HOSPITAL_AFFILIATION_PROOF')?.status || 'NOT_UPLOADED',
          },
        ],
        canSubmit,
        isUnderReview: doctor.verificationStatus === 'UNDER_REVIEW',
        isVerified: doctor.verificationStatus === 'VERIFIED',
        isRejected: doctor.verificationStatus === 'REJECTED',
        isSuspended: doctor.verificationStatus === 'SUSPENDED',
      },
      documents: doctor.doctorDocuments,
    });
  } catch (err: any) {
    console.error('Error fetching doctor verification status:', err);
    return res.status(500).json({ error: 'Failed to fetch doctor verification status.' });
  }
}

/**
 * POST /api/doctors/verification/upload
 * Upload a document category for Doctor Verification
 */
export async function uploadDoctorDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    const { documentType } = req.body;

    if (!documentType || !VALID_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({ error: `Invalid document category. Allowed: ${VALID_DOC_TYPES.join(', ')}` });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor record not found.' });
    }

    // Validate file
    const validation = SecureDocumentStorage.validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Save file securely
    const { storageKey, fileName } = SecureDocumentStorage.saveDocument(req.file, doctor.userId);

    const isRequired = ['MEDICAL_REGISTRATION_CERTIFICATE', 'MEDICAL_DEGREE'].includes(documentType);

    // Remove or update existing document of same type if present
    const existingDoc = await prisma.doctorDocument.findFirst({
      where: { doctorId: doctor.id, documentType },
    });

    if (existingDoc) {
      SecureDocumentStorage.deleteFile(existingDoc.fileReference);
      await prisma.doctorDocument.delete({ where: { id: existingDoc.id } });
    }

    // Create new DoctorDocument
    const docRecord = await prisma.doctorDocument.create({
      data: {
        doctorId: doctor.id,
        documentType,
        fileReference: storageKey,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: 'UNDER_REVIEW',
        isRequired,
      },
    });

    // Map to IdentityDocument & VerificationRequest for Admin unified review
    let mappedPrismaDocType: DocumentType = DocumentType.OTHER_PROFESSIONAL;
    if (documentType === 'MEDICAL_REGISTRATION_CERTIFICATE') mappedPrismaDocType = DocumentType.MEDICAL_REGISTRATION_CERTIFICATE;
    else if (documentType === 'MEDICAL_DEGREE') mappedPrismaDocType = DocumentType.MEDICAL_DEGREE;
    else if (documentType === 'SPECIALIZATION_CERTIFICATE') mappedPrismaDocType = DocumentType.SPECIALIZATION_CERTIFICATE;
    else if (documentType === 'HOSPITAL_AFFILIATION_PROOF') mappedPrismaDocType = DocumentType.HOSPITAL_AFFILIATION_PROOF;

    const identityDoc = await prisma.identityDocument.create({
      data: {
        userId: doctor.userId,
        documentType: mappedPrismaDocType,
        storageKey,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        verificationStatus: VerificationStatus.ADMIN_REVIEW,
      },
    });

    await prisma.verificationRequest.create({
      data: {
        documentId: identityDoc.id,
        requestType: 'DOCTOR_CREDENTIAL',
        userId: doctor.userId,
        aiAnalysis: JSON.stringify({ note: 'Professional medical credential uploaded by practitioner.' }),
        aiConfidence: 0.9,
        aiDecision: 'REVIEW_REQUIRED',
      },
    });

    // If doctor was rejected previously, revert status to PENDING_DOCUMENTS until they explicitly resubmit
    if (doctor.verificationStatus === 'REJECTED') {
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { verificationStatus: 'PENDING_DOCUMENTS' },
      });
    }

    await logAudit(
      req,
      'UPLOAD_DOCTOR_DOCUMENT',
      'DOCTOR_DOCUMENT',
      docRecord.id,
      `Uploaded credential: ${documentType}`
    );

    return res.status(201).json({
      message: 'Document uploaded successfully.',
      document: docRecord,
    });
  } catch (err: any) {
    console.error('Doctor document upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload document.' });
  }
}

/**
 * POST /api/doctors/verification/submit
 * Doctor explicitly submits uploaded credentials for Admin review
 */
export async function submitDoctorVerification(req: AuthRequest, res: Response) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: true,
        doctorDocuments: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const docTypes = doctor.doctorDocuments.map((d) => d.documentType);
    const hasRegistration = docTypes.includes('MEDICAL_REGISTRATION_CERTIFICATE');
    const hasDegree = docTypes.includes('MEDICAL_DEGREE');

    if (!hasRegistration || !hasDegree) {
      return res.status(400).json({
        error: 'Mandatory verification requirements incomplete. You must upload both a Medical / Practitioner Registration Certificate and a Qualifying Medical Degree.',
      });
    }

    // Update status to UNDER_REVIEW
    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        verificationStatus: 'UNDER_REVIEW',
        isActive: false, // Not eligible for appointments until Admin explicitly verifies
        rejectionReason: null,
      },
    });

    // Notify Doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: 'Verification Request Submitted',
        message: 'Your professional credentials have been submitted for SmartHealth Admin review.',
        type: 'SYSTEM',
        priority: 'INFO',
      },
    });

    // Notify all Admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Doctor Verification Request',
          message: `Dr. ${doctor.user.name} (${doctor.specialty}) has submitted credentials for verification review.`,
          type: 'SYSTEM',
          priority: 'WARNING',
        },
      });
    }

    await logAudit(
      req,
      'SUBMIT_DOCTOR_VERIFICATION',
      'DOCTOR',
      doctor.id,
      `Submitted credentials for verification review`
    );

    return res.json({
      message: 'Verification request submitted successfully. Awaiting Admin review.',
      doctor: updated,
    });
  } catch (err: any) {
    console.error('Error submitting verification request:', err);
    return res.status(500).json({ error: 'Failed to submit verification request.' });
  }
}

/**
 * DELETE /api/doctors/verification/documents/:id
 * Delete an unverified document
 */
export async function deleteDoctorDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const doc = await prisma.doctorDocument.findUnique({
      where: { id },
    });

    if (!doc || doc.doctorId !== doctor.id) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    if (doctor.verificationStatus === 'VERIFIED') {
      return res.status(400).json({ error: 'Cannot remove documents while verified. Request admin review to update credentials.' });
    }

    SecureDocumentStorage.deleteFile(doc.fileReference);
    await prisma.doctorDocument.delete({ where: { id } });

    // If mandatory document removed, return to PENDING_DOCUMENTS
    const remaining = await prisma.doctorDocument.findMany({ where: { doctorId: doctor.id } });
    const remainingTypes = remaining.map((d) => d.documentType);
    if (!remainingTypes.includes('MEDICAL_REGISTRATION_CERTIFICATE') || !remainingTypes.includes('MEDICAL_DEGREE')) {
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { verificationStatus: 'PENDING_DOCUMENTS', isActive: false },
      });
    }

    await logAudit(req, 'DELETE_DOCTOR_DOCUMENT', 'DOCTOR_DOCUMENT', id, `Deleted credential: ${doc.documentType}`);

    return res.json({ message: 'Document deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting doctor document:', err);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
}

/**
 * GET /api/doctors/verification/documents/:id/view
 * Secure document file stream
 */
export async function viewDoctorDocument(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const token = (req.query.token as string) || (req.headers.authorization?.replace('Bearer ', ''));

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'smarthealth_jwt_secure_super_secret_2026_key';
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const doc = await prisma.doctorDocument.findUnique({
      where: { id },
      include: { doctor: { select: { userId: true } } },
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const isAdmin = decoded.role === 'ADMIN';
    const isOwner = doc.doctor.userId === decoded.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const fileBuffer = SecureDocumentStorage.getFile(doc.fileReference);
    if (!fileBuffer) {
      return res.status(404).json({ error: 'Document file not found on server.' });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(fileBuffer);
  } catch (err: any) {
    console.error('Error viewing document file:', err);
    return res.status(500).json({ error: 'Failed to view document file.' });
  }
}

// =========================================================================
// ADMIN CONTROLS FOR DOCTOR VERIFICATION
// =========================================================================

/**
 * GET /api/admin/doctors/verifications
 * Admin lists all doctors with detailed verification statuses and documents
 */
export async function adminGetDoctorVerifications(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.verificationStatus = status;
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        hospital: true,
        doctorDocuments: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ doctors });
  } catch (err: any) {
    console.error('Error fetching admin doctor verifications:', err);
    return res.status(500).json({ error: 'Failed to fetch doctor verifications.' });
  }
}

/**
 * POST /api/admin/doctors/:doctorId/verify
 * Admin approves a doctor -> VERIFIED + isActive = true
 */
export async function adminApproveDoctor(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true, doctorDocuments: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // Enforce mandatory documents
    const docTypes = doctor.doctorDocuments.map((d) => d.documentType);
    const hasRegistration = docTypes.includes('MEDICAL_REGISTRATION_CERTIFICATE');
    const hasDegree = docTypes.includes('MEDICAL_DEGREE');

    if (!hasRegistration || !hasDegree) {
      return res.status(400).json({
        error: 'Cannot approve doctor: Mandatory documents (Registration Certificate & Medical Degree) are missing.',
      });
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        verificationStatus: 'VERIFIED',
        isActive: true,
        verifiedBy: req.user!.name,
        verifiedAt: new Date(),
        rejectionReason: null,
        reviewedAt: new Date(),
      },
      include: { user: true },
    });

    // Mark documents as APPROVED
    await prisma.doctorDocument.updateMany({
      where: { doctorId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: req.user!.name,
      },
    });

    // Update any linked IdentityDocuments for this user
    await prisma.identityDocument.updateMany({
      where: { userId: doctor.userId },
      data: { verificationStatus: VerificationStatus.VERIFIED },
    });

    // Notify doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: 'Doctor Profile Verified',
        message: 'Your SmartHealth doctor profile has been verified. You are now eligible to receive patient appointments.',
        type: 'SYSTEM',
        priority: 'INFO',
      },
    });

    await logAudit(
      req,
      'APPROVE_DOCTOR_VERIFICATION',
      'DOCTOR',
      doctor.id,
      `Admin ${req.user!.name} approved Dr. ${doctor.user.name}`
    );

    return res.json({
      message: `Dr. ${doctor.user.name} has been verified successfully.`,
      doctor: updated,
    });
  } catch (err: any) {
    console.error('Error approving doctor:', err);
    return res.status(500).json({ error: 'Failed to verify doctor.' });
  }
}

/**
 * POST /api/admin/doctors/:doctorId/reject
 * Admin rejects a doctor -> REJECTED + isActive = false
 */
export async function adminRejectDoctor(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { doctorId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required.' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        verificationStatus: 'REJECTED',
        isActive: false,
        rejectionReason: rejectionReason.trim(),
        reviewedBy: req.user!.name,
        reviewedAt: new Date(),
      },
      include: { user: true },
    });

    // Update documents to REJECTED
    await prisma.doctorDocument.updateMany({
      where: { doctorId },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        reviewedAt: new Date(),
        reviewedBy: req.user!.name,
      },
    });

    // Notify doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: 'Doctor Verification Rejected',
        message: `Your verification request was rejected. Reason: ${rejectionReason.trim()}. Please upload corrected documents and resubmit.`,
        type: 'WARNING',
        priority: 'CRITICAL',
      },
    });

    await logAudit(
      req,
      'REJECT_DOCTOR_VERIFICATION',
      'DOCTOR',
      doctor.id,
      `Admin ${req.user!.name} rejected Dr. ${doctor.user.name}. Reason: ${rejectionReason}`
    );

    return res.json({
      message: `Doctor verification rejected. Notification sent to Dr. ${doctor.user.name}.`,
      doctor: updated,
    });
  } catch (err: any) {
    console.error('Error rejecting doctor verification:', err);
    return res.status(500).json({ error: 'Failed to reject doctor.' });
  }
}

/**
 * POST /api/admin/doctors/:doctorId/suspend
 * Admin suspends doctor -> SUSPENDED + isActive = false (blocks new appointments)
 */
export async function adminSuspendDoctor(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { doctorId } = req.params;
    const { reason } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const suspensionReason = reason?.trim() || 'Account temporarily suspended by administrator.';

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        verificationStatus: 'SUSPENDED',
        isActive: false,
        rejectionReason: suspensionReason,
        reviewedBy: req.user!.name,
        reviewedAt: new Date(),
      },
      include: { user: true },
    });

    // Notify doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: 'Doctor Account Suspended',
        message: `Your account has been temporarily suspended from receiving new patient appointments. Reason: ${suspensionReason}`,
        type: 'WARNING',
        priority: 'CRITICAL',
      },
    });

    await logAudit(
      req,
      'SUSPEND_DOCTOR',
      'DOCTOR',
      doctor.id,
      `Admin suspended Dr. ${doctor.user.name}. Reason: ${suspensionReason}`
    );

    return res.json({
      message: `Dr. ${doctor.user.name} has been suspended from receiving new appointments.`,
      doctor: updated,
    });
  } catch (err: any) {
    console.error('Error suspending doctor:', err);
    return res.status(500).json({ error: 'Failed to suspend doctor.' });
  }
}

/**
 * POST /api/admin/doctors/:doctorId/reactivate
 * Admin reactivates suspended doctor -> VERIFIED + isActive = true
 */
export async function adminReactivateDoctor(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        verificationStatus: 'VERIFIED',
        isActive: true,
        rejectionReason: null,
        reviewedBy: req.user!.name,
        reviewedAt: new Date(),
      },
      include: { user: true },
    });

    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: 'Doctor Profile Reactivated',
        message: 'Your SmartHealth doctor profile has been reactivated. You can now receive new patient appointments.',
        type: 'SYSTEM',
        priority: 'INFO',
      },
    });

    await logAudit(
      req,
      'REACTIVATE_DOCTOR',
      'DOCTOR',
      doctor.id,
      `Admin reactivated Dr. ${doctor.user.name}`
    );

    return res.json({
      message: `Dr. ${doctor.user.name} reactivated successfully.`,
      doctor: updated,
    });
  } catch (err: any) {
    console.error('Error reactivating doctor:', err);
    return res.status(500).json({ error: 'Failed to reactivate doctor.' });
  }
}
