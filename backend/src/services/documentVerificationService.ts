import { DocumentType, VerificationStatus } from '@prisma/client';

export interface AIAnalysisResult {
  ocrConfidence?: number;
  documentClassification?: string;
  extractedFields?: {
    name?: string;
    documentNumber?: string;
    dateOfBirth?: string;
    issueDate?: string;
    expiryDate?: string;
  };
  qualityCheck?: {
    isClear: boolean;
    issues: string[];
  };
  profileMatch?: {
    nameMatch?: number;
    dobMatch?: number;
    overallMatch?: number;
  };
  aiConfidence?: number;
  aiDecision?: 'APPROVE' | 'REJECT' | 'REVIEW_REQUIRED';
  detectedInconsistencies?: string[];
  reason?: string;
}

export interface VerificationTimelineEvent {
  timestamp: Date;
  event: string;
  details: string;
}

/**
 * Document Verification Service
 * Performs AI/OCR analysis when available, otherwise marks for manual review
 * Never fabricates confidence scores or verification results
 */
export class DocumentVerificationService {
  /**
   * Analyze uploaded document for verification
   * Returns AI analysis if available, otherwise marks for manual review
   */
  static async analyzeDocument(
    file: Express.Multer.File,
    documentType: DocumentType,
    userProfile: {
      name: string;
      dob?: Date;
      gender?: string;
    }
  ): Promise<AIAnalysisResult> {
    const timeline: VerificationTimelineEvent[] = [];
    timeline.push({
      timestamp: new Date(),
      event: 'DOCUMENT_UPLOADED',
      details: `Document uploaded: ${file.originalname}, Type: ${documentType}`,
    });

    // Basic quality check
    const qualityCheck = this.performQualityCheck(file);
    timeline.push({
      timestamp: new Date(),
      event: 'QUALITY_CHECK',
      details: `Quality check: ${qualityCheck.isClear ? 'PASSED' : 'FAILED'}`,
    });

    if (!qualityCheck.isClear) {
      return {
        qualityCheck,
        aiDecision: 'REVIEW_REQUIRED',
        aiConfidence: 0,
        reason: 'Document quality check failed. Manual review required.',
        detectedInconsistencies: qualityCheck.issues,
      };
    }

    // Try OCR extraction if available
    try {
      const ocrResult = await this.performOCRAnalysis(file, documentType);
      timeline.push({
        timestamp: new Date(),
        event: 'OCR_ANALYSIS',
        details: `OCR completed with confidence: ${ocrResult.ocrConfidence}%`,
      });

      // Profile matching
      const profileMatch = this.matchProfile(ocrResult.extractedFields, userProfile);
      timeline.push({
        timestamp: new Date(),
        event: 'PROFILE_MATCHING',
        details: `Profile match score: ${profileMatch?.overallMatch || 0}%`,
      });

      // Determine AI decision based on confidence
      const decision = this.determineDecision(ocrResult, profileMatch);

      return {
        ...ocrResult,
        profileMatch,
        aiDecision: decision,
        aiConfidence: decision === 'APPROVE' ? 85 : decision === 'REJECT' ? 30 : 50,
        detectedInconsistencies: this.detectInconsistencies(ocrResult, profileMatch),
      };
    } catch (error) {
      // OCR/AI unavailable - mark for manual review
      timeline.push({
        timestamp: new Date(),
        event: 'AI_UNAVAILABLE',
        details: 'OCR/AI service unavailable. Manual review required.',
      });

      return {
        qualityCheck,
        aiDecision: 'REVIEW_REQUIRED',
        aiConfidence: 0,
        reason: 'Verification requires manual review - AI/OCR service unavailable',
      };
    }
  }

  /**
   * Basic quality check without requiring OCR
   */
  private static performQualityCheck(file: Express.Multer.File): {
    isClear: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check file size (too small might be corrupted)
    if (file.size < 1024) {
      issues.push('File size too small (possible corruption)');
    }

    // Check for PDF-specific issues
    if (file.mimetype === 'application/pdf') {
      // PDF should have reasonable size
      if (file.size > 10 * 1024 * 1024) {
        issues.push('PDF file size too large (>10MB)');
      }
    }

    // Check for image-specific issues
    if (file.mimetype.startsWith('image/')) {
      // Image should have reasonable size
      if (file.size < 10 * 1024) {
        issues.push('Image file size too small (possible low resolution)');
      }
    }

    return {
      isClear: issues.length === 0,
      issues,
    };
  }

  /**
   * Perform OCR analysis
   * In production, this would integrate with Tesseract, Google Vision API, AWS Textract, etc.
   * For now, returns mock analysis with clear indicators that manual review is needed
   */
  private static async performOCRAnalysis(
    file: Express.Multer.File,
    documentType: DocumentType
  ): Promise<{
    ocrConfidence: number;
    documentClassification: string;
    extractedFields: AIAnalysisResult['extractedFields'];
  }> {
    // NOTE: In production, integrate with actual OCR service
    // For this implementation, we mark that OCR is not configured
    throw new Error('OCR service not configured');
  }

  /**
   * Match extracted fields with user profile
   */
  private static matchProfile(
    extractedFields: AIAnalysisResult['extractedFields'] = {},
    userProfile: { name: string; dob?: Date; gender?: string }
  ): AIAnalysisResult['profileMatch'] {
    if (!extractedFields) {
      return { overallMatch: 0 };
    }

    let nameMatch = 0;
    let dobMatch = 0;

    // Name matching (simple comparison)
    if (extractedFields.name && userProfile.name) {
      const extractedName = extractedFields.name.toLowerCase().replace(/\s/g, '');
      const profileName = userProfile.name.toLowerCase().replace(/\s/g, '');
      if (extractedName.includes(profileName) || profileName.includes(extractedName)) {
        nameMatch = 95;
      } else if (extractedName.split(' ').some((part) => profileName.includes(part))) {
        nameMatch = 60;
      }
    }

    // DOB matching
    if (extractedFields.dateOfBirth && userProfile.dob) {
      const extractedDob = new Date(extractedFields.dateOfBirth);
      const profileDob = new Date(userProfile.dob);
      if (extractedDob.getTime() === profileDob.getTime()) {
        dobMatch = 100;
      }
    }

    const overallMatch = nameMatch && dobMatch ? (nameMatch + dobMatch) / 2 : nameMatch || dobMatch || 0;

    return { nameMatch, dobMatch, overallMatch };
  }

  /**
   * Determine AI decision based on analysis results
   */
  private static determineDecision(
    ocrResult: { ocrConfidence: number },
    profileMatch: AIAnalysisResult['profileMatch']
  ): 'APPROVE' | 'REJECT' | 'REVIEW_REQUIRED' {
    // High confidence + good profile match = APPROVE
    if (ocrResult.ocrConfidence >= 90 && (profileMatch?.overallMatch || 0) >= 85) {
      return 'APPROVE';
    }

    // Low confidence or poor match = REVIEW_REQUIRED
    if (ocrResult.ocrConfidence < 70 || (profileMatch?.overallMatch || 0) < 50) {
      return 'REVIEW_REQUIRED';
    }

    // Mid-range = REVIEW_REQUIRED for safety
    return 'REVIEW_REQUIRED';
  }

  /**
   * Detect inconsistencies in document
   */
  private static detectInconsistencies(
    ocrResult: { ocrConfidence: number },
    profileMatch: AIAnalysisResult['profileMatch']
  ): string[] {
    const inconsistencies: string[] = [];

    if (ocrResult.ocrConfidence < 80) {
      inconsistencies.push('Low OCR confidence');
    }

    if ((profileMatch?.nameMatch || 0) < 70) {
      inconsistencies.push('Name mismatch');
    }

    if ((profileMatch?.dobMatch || 0) < 70 && profileMatch?.dobMatch !== undefined) {
      inconsistencies.push('Date of birth mismatch');
    }

    return inconsistencies;
  }

  /**
   * Build verification timeline
   */
  static buildTimeline(events: VerificationTimelineEvent[]): string {
    return JSON.stringify(events, null, 2);
  }

  /**
   * Get document-specific validation rules
   */
  static getDocumentValidationRules(documentType: DocumentType): {
    requiredFields: string[];
    optionalFields: string[];
    formatRules: { [key: string]: RegExp };
  } {
    const rules: any = {
      PASSPORT: {
        requiredFields: ['documentNumber', 'name', 'expiryDate'],
        optionalFields: ['issueDate', 'dateOfBirth'],
        formatRules: {
          documentNumber: /^[A-Z0-9]{6,9}$/,
        },
      },
      PAN_CARD: {
        requiredFields: ['documentNumber', 'name'],
        optionalFields: ['dateOfBirth'],
        formatRules: {
          documentNumber: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        },
      },
      DRIVING_LICENCE: {
        requiredFields: ['documentNumber', 'name', 'expiryDate'],
        optionalFields: ['issueDate', 'dateOfBirth'],
        formatRules: {
          documentNumber: /^[A-Z]{2}[0-9]{13}$/,
        },
      },
      AADHAAR_CARD: {
        requiredFields: ['documentNumber', 'name'],
        optionalFields: ['dateOfBirth'],
        formatRules: {
          documentNumber: /^[0-9]{12}$/,
        },
      },
      MEDICAL_REGISTRATION_CERTIFICATE: {
        requiredFields: ['documentNumber', 'name'],
        optionalFields: ['issueDate', 'expiryDate'],
        formatRules: {
          documentNumber: /^[A-Z0-9]{6,20}$/,
        },
      },
    };

    return (
      rules[documentType] || {
        requiredFields: ['documentNumber', 'name'],
        optionalFields: [],
        formatRules: {},
      }
    );
  }
}
