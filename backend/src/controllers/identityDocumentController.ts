import { Response, Request } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { SecureDocumentStorage } from '../services/secureDocumentStorage';
import { DocumentVerificationService } from '../services/documentVerificationService';
import { logAudit } from '../middleware/audit';
import { DocumentType, VerificationStatus } from '@prisma/client';

// Configure Multer in-memory storage for validation before saving
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG/JPEG files are allowed.'));
    }
  },
});

export const identityDocumentUploadMiddleware = upload.single('document');

/**
 * Upload identity document for patient or doctor
 */
export async function uploadIdentityDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    const { documentType, documentNumber, issueDate, expiryDate } = req.body;

    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required.' });
    }

    // Validate document type
    if (!Object.values(DocumentType).includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type.' });
    }

    // Validate file
    const validation = SecureDocumentStorage.validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Determine user profile
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { patient: true, doctor: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Determine request type
    const requestType = user.role === 'PATIENT' ? 'PATIENT_IDENTITY' : 'DOCTOR_CREDENTIAL';

    // Validate document type matches role
    if (user.role === 'PATIENT') {
      const patientDocTypes = [
        DocumentType.PASSPORT,
        DocumentType.PAN_CARD,
        DocumentType.DRIVING_LICENCE,
        DocumentType.VOTER_ID,
        DocumentType.AADHAAR_CARD,
        DocumentType.OTHER_IDENTITY,
      ];
      if (!patientDocTypes.includes(documentType)) {
        return res.status(400).json({ error: 'Invalid document type for patient.' });
      }
    } else if (user.role === 'DOCTOR') {
      const doctorDocTypes = [
        DocumentType.MEDICAL_REGISTRATION_CERTIFICATE,
        DocumentType.MEDICAL_DEGREE,
        DocumentType.SPECIALIZATION_CERTIFICATE,
        DocumentType.HOSPITAL_AFFILIATION_PROOF,
        DocumentType.OTHER_PROFESSIONAL,
      ];
      if (!doctorDocTypes.includes(documentType)) {
        return res.status(400).json({ error: 'Invalid document type for doctor.' });
      }
    }

    // Save file securely
    const { storageKey, fileName } = SecureDocumentStorage.saveDocument(req.file, user.id);

    // Perform AI/OCR analysis
    const userProfile = {
      name: user.name,
      dob: user.patient?.dob,
      gender: user.patient?.gender,
    };

    const aiAnalysis = await DocumentVerificationService.analyzeDocument(
      req.file,
      documentType as DocumentType,
      userProfile
    );

    // Determine initial verification status
    let verificationStatus: VerificationStatus = VerificationStatus.PROCESSING;
    if (aiAnalysis.aiDecision === 'APPROVE' && user.role === 'PATIENT') {
      // Patient can be auto-verified if AI confidence is high
      verificationStatus = VerificationStatus.VERIFIED;
    } else if (aiAnalysis.aiDecision === 'REVIEW_REQUIRED' || user.role === 'DOCTOR') {
      // Doctors always require admin review
      verificationStatus = VerificationStatus.ADMIN_REVIEW;
    } else if (aiAnalysis.aiDecision === 'REJECT') {
      verificationStatus = VerificationStatus.REJECTED;
    }

    // Create identity document record
    const document = await prisma.identityDocument.create({
      data: {
        userId: user.id,
        documentType: documentType as DocumentType,
        documentNumber: documentNumber || null,
        issuer: null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        storageKey,
        fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        verificationStatus,
      },
    });

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        documentId: document.id,
        requestType,
        userId: user.id,
        aiAnalysis: JSON.stringify(aiAnalysis),
        aiConfidence: aiAnalysis.aiConfidence || 0,
        aiDecision: aiAnalysis.aiDecision,
        verificationHistory: DocumentVerificationService.buildTimeline([
          {
            timestamp: new Date(),
            event: 'DOCUMENT_UPLOADED',
            details: `Document uploaded by user`,
          },
          {
            timestamp: new Date(),
            event: 'AI_ANALYSIS_COMPLETED',
            details: `AI analysis completed with decision: ${aiAnalysis.aiDecision}`,
          },
        ]),
      },
    });

    // Update user verification status if verified
    if (verificationStatus === VerificationStatus.VERIFIED && user.patient) {
      await prisma.patient.update({
        where: { id: user.patient.id },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
          verifiedDocumentType: documentType,
          verifiedAt: new Date(),
        },
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: `Document Uploaded: ${documentType.replace(/_/g, ' ')}`,
        message: `Your document has been uploaded and is ${verificationStatus.toLowerCase().replace(/_/g, ' ')}.`,
        type: 'SYSTEM',
        priority: verificationStatus === VerificationStatus.REJECTED ? 'WARNING' : 'INFO',
      },
    });

    // If doctor or requires admin review, notify admins
    if (verificationStatus === VerificationStatus.ADMIN_REVIEW) {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `New Verification Request: ${user.role}`,
            message: `${user.name} has uploaded a ${documentType} for verification.`,
            type: 'SYSTEM',
            priority: 'INFO',
          },
        });
      }
    }

    await logAudit(
      req,
      'UPLOAD_IDENTITY_DOCUMENT',
      'IDENTITY_DOCUMENT',
      document.id,
      `Uploaded identity document: ${documentType}`
    );

    return res.status(201).json({
      message: 'Document uploaded successfully.',
      document: {
        id: document.id,
        documentType: document.documentType,
        verificationStatus: document.verificationStatus,
        uploadedAt: document.uploadedAt,
      },
      verificationRequest: {
        id: verificationRequest.id,
        aiDecision: verificationRequest.aiDecision,
        aiConfidence: verificationRequest.aiConfidence,
      },
    });
  } catch (err: any) {
    console.error('Identity document upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload identity document.' });
  }
}

/**
 * Get all documents for current user
 */
export async function getUserDocuments(req: AuthRequest, res: Response) {
  try {
    const documents = await prisma.identityDocument.findMany({
      where: { userId: req.user!.id },
      orderBy: { uploadedAt: 'desc' },
      include: {
        verificationRequest: true,
      },
    });

    await logAudit(
      req,
      'VIEW_IDENTITY_DOCUMENTS',
      'IDENTITY_DOCUMENT',
      req.user!.id,
      `Viewed ${documents.length} identity documents`
    );

    return res.json(documents);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch documents.' });
  }
}

/**
 * Get document by ID (with authorization check)
 */
export async function getDocumentById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const document = await prisma.identityDocument.findUnique({
      where: { id },
      include: {
        verificationRequest: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Authorization check
    const isAdmin = req.user!.role === 'ADMIN';
    const isOwner = document.userId === req.user!.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await logAudit(
      req,
      'VIEW_IDENTITY_DOCUMENT',
      'IDENTITY_DOCUMENT',
      document.id,
      `Viewed document ${document.documentType}`
    );

    return res.json(document);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch document.' });
  }
}

/**
 * View/download document file
 */
export async function viewDocumentFile(req: Request, res: Response) {
  try {
    const idParam = req.params.id as string | string[];
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const tokenParam = req.query.token as string | string[] | undefined;

    if (!tokenParam) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Handle both string and array query params
    let token: string;
    if (typeof tokenParam === 'string') {
      token = tokenParam;
    } else if (Array.isArray(tokenParam) && tokenParam.length > 0) {
      token = tokenParam[0];
    } else {
      return res.status(400).json({ error: 'Invalid token format.' });
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'smarthealth_jwt_secure_super_secret_2026_key';
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const document = await prisma.identityDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Authorization check
    const isAdmin = decoded.role === 'ADMIN';
    const isOwner = document.userId === decoded.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Get file from secure storage
    const fileBuffer = SecureDocumentStorage.getFile(document.storageKey);

    if (!fileBuffer) {
      return res.status(404).json({ error: 'File not found in storage.' });
    }

    // Log audit
    await logAudit(
      { user: decoded, ip: req.ip } as any,
      'VIEW_DOCUMENT_FILE',
      'IDENTITY_DOCUMENT',
      document.id,
      `Viewed file for document ${document.documentType}`
    );

    // Set appropriate content type
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    return res.send(fileBuffer);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to view document file.' });
  }
}

/**
 * Delete document
 */
export async function deleteDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const document = await prisma.identityDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Authorization check - only owner can delete
    if (document.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Cannot delete verified documents
    if (document.verificationStatus === VerificationStatus.VERIFIED) {
      return res.status(400).json({ error: 'Cannot delete verified documents.' });
    }

    // Delete file from storage
    SecureDocumentStorage.deleteFile(document.storageKey);

    // Delete database record
    await prisma.identityDocument.delete({
      where: { id },
    });

    await logAudit(
      req,
      'DELETE_IDENTITY_DOCUMENT',
      'IDENTITY_DOCUMENT',
      document.id,
      `Deleted document ${document.documentType}`
    );

    return res.json({ message: 'Document deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
}

/**
 * Admin: Get all verification requests
 */
export async function getAllVerificationRequests(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { status, requestType } = req.query;

    const where: any = {};
    if (requestType) {
      where.requestType = requestType;
    }

    const requests = await prisma.verificationRequest.findMany({
      where,
      include: {
        document: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by document verification status if provided
    const filtered = status
      ? requests.filter((req) => req.document.verificationStatus === status)
      : requests;

    return res.json(filtered);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch verification requests.' });
  }
}

/**
 * Admin: Review verification request
 */
export async function reviewVerificationRequest(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { decision, reason } = req.body;

    if (!decision || !['APPROVED', 'REJECTED', 'REQUEST_INFO'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision.' });
    }

    if (decision === 'REJECTED' || decision === 'REQUEST_INFO') {
      if (!reason) {
        return res.status(400).json({ error: 'Reason is required for rejection or info request.' });
      }
    }

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        document: {
          include: {
            user: {
              include: {
                patient: true,
                doctor: true,
              },
            },
          },
        },
      },
    });

    if (!verificationRequest) {
      return res.status(404).json({ error: 'Verification request not found.' });
    }

    // Update verification request
    const updatedRequest = await prisma.verificationRequest.update({
      where: { id },
      data: {
        reviewerId: req.user!.id,
        reviewDecision: decision,
        reviewReason: reason,
        reviewDate: new Date(),
        adminReview: JSON.stringify({
          reviewer: req.user!.name,
          decision,
          reason,
          reviewedAt: new Date().toISOString(),
        }),
      },
    });

    // Update document verification status
    let newStatus: VerificationStatus;
    if (decision === 'APPROVED') {
      newStatus = VerificationStatus.VERIFIED;
    } else if (decision === 'REJECTED') {
      newStatus = VerificationStatus.REJECTED;
    } else {
      newStatus = VerificationStatus.REVIEW_REQUIRED;
    }

    await prisma.identityDocument.update({
      where: { id: verificationRequest.documentId },
      data: { verificationStatus: newStatus },
    });

    // Update user verification status if approved
    if (decision === 'APPROVED') {
      const user = verificationRequest.document.user;
      if (user.patient) {
        await prisma.patient.update({
          where: { id: user.patient.id },
          data: {
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedDocumentType: verificationRequest.document.documentType,
            verifiedAt: new Date(),
          },
        });
      } else if (user.doctor) {
        await prisma.doctor.update({
          where: { id: user.doctor.id },
          data: {
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedDocumentType: verificationRequest.document.documentType,
            verifiedAt: new Date(),
          },
        });
      }
    }

    // Notify user
    await prisma.notification.create({
      data: {
        userId: verificationRequest.document.user.id,
        title: `Verification ${decision}`,
        message: `Your document verification has been ${decision.toLowerCase()}. ${reason ? `Reason: ${reason}` : ''}`,
        type: decision === 'APPROVED' ? 'SYSTEM' : 'WARNING',
        priority: decision === 'APPROVED' ? 'INFO' : 'WARNING',
      },
    });

    await logAudit(
      req,
      'REVIEW_VERIFICATION_REQUEST',
      'VERIFICATION_REQUEST',
      verificationRequest.id,
      `Admin reviewed verification request with decision: ${decision}`
    );

    return res.json({
      message: 'Verification request reviewed successfully.',
      verificationRequest: updatedRequest,
    });
  } catch (err: any) {
    console.error('Verification review error:', err);
    return res.status(500).json({ error: 'Failed to review verification request.' });
  }
}

/**
 * Get verification statistics for admin dashboard
 */
export async function getVerificationStats(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Get all requests with their documents to filter properly
    const allRequests = await prisma.verificationRequest.findMany({
      where: { reviewDecision: null },
      include: {
        document: true,
      },
    });

    const pendingPatientVerifications = allRequests.filter(
      (req) =>
        req.requestType === 'PATIENT_IDENTITY' &&
        ['ADMIN_REVIEW', 'REVIEW_REQUIRED', 'PROCESSING'].includes(req.document.verificationStatus)
    ).length;

    const pendingDoctorVerifications = allRequests.filter(
      (req) =>
        req.requestType === 'DOCTOR_CREDENTIAL' &&
        ['ADMIN_REVIEW', 'REVIEW_REQUIRED', 'PROCESSING'].includes(req.document.verificationStatus)
    ).length;

    const [verified, rejected, reviewRequired] = await Promise.all([
      prisma.identityDocument.count({
        where: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      prisma.identityDocument.count({
        where: { verificationStatus: VerificationStatus.REJECTED },
      }),
      prisma.identityDocument.count({
        where: { verificationStatus: VerificationStatus.REVIEW_REQUIRED },
      }),
    ]);

    return res.json({
      pendingPatientVerifications,
      pendingDoctorVerifications,
      verified,
      rejected,
      reviewRequired,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch verification statistics.' });
  }
}
