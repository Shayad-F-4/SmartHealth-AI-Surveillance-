import { Response } from 'express';
import multer from 'multer';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { StorageService } from '../services/storageService';
import { extractDocumentData } from '../services/documentExtractor';
import { logAudit } from '../middleware/audit';

// Configure Multer in-memory storage for validation before saving
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG/JPEG files are allowed.'));
    }
  },
});

export const documentUploadMiddleware = upload.single('document');

export async function uploadAndAnalyzeDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    // Determine target patient ID
    let patientId: string | undefined = req.body.patientId;
    if (req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!p) {
        return res.status(404).json({ error: 'Patient profile not found.' });
      }
      patientId = p.id;
    } else if (!patientId) {
      return res.status(400).json({ error: 'patientId is required for healthcare providers.' });
    }

    // Double check patient existence & authorization
    const targetPatient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!targetPatient) {
      return res.status(404).json({ error: 'Target patient does not exist.' });
    }

    // 1. Save file via StorageService
    const { fileName, relativePath } = StorageService.saveFile(req.file);

    // 2. Perform Extraction
    const extractionResult = await extractDocumentData(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    // 3. Save Extracted Lab Reports directly linked to Patient
    const savedLabReports = [];
    if (extractionResult.labTests.length > 0) {
      for (const test of extractionResult.labTests) {
        if (test.measuredValue !== null) {
          const report = await prisma.labReport.create({
            data: {
              patientId,
              testName: test.testName,
              testCategory: extractionResult.documentType,
              measuredValue: test.measuredValue,
              unit: test.unit || '',
              normalRangeMin: test.normalRangeMin ?? 0,
              normalRangeMax: test.normalRangeMax ?? 100,
              isOutOfRange: test.status === 'ABNORMAL',
              outOfRangeType: test.status === 'ABNORMAL' ? 'ABNORMAL' : 'NORMAL',
              reportDate: new Date(),
              labTechnician: 'SmartHealth AI Document Analyzer',
              notes: test.referenceRange ? `Extracted from ${req.file.originalname}. Ref Range: ${test.referenceRange}` : `Extracted from ${req.file.originalname}`,
            },
          });
          savedLabReports.push(report);

          // If out of range, create alert notification
          if (test.status === 'ABNORMAL') {
            await prisma.notification.create({
              data: {
                userId: targetPatient.userId,
                title: `AI Document Analysis Warning: ${test.testName}`,
                message: `Extracted result for ${test.testName} (${test.measuredValue} ${test.unit || ''}) is abnormal.`,
                type: 'LAB_WARNING',
                priority: 'WARNING',
              },
            });
          }
        }
      }
    }

    await logAudit(
      req,
      'UPLOAD_DOCUMENT',
      'LAB_REPORT',
      savedLabReports[0]?.id || patientId,
      `Uploaded and analyzed document ${fileName} for patient ${patientId}`
    );

    return res.status(201).json({
      message: 'Document uploaded and analyzed successfully.',
      fileUrl: relativePath,
      extractedData: extractionResult,
      savedLabReportsCount: savedLabReports.length,
    });
  } catch (err: any) {
    console.error('Document analysis error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process and analyze medical document.' });
  }
}
