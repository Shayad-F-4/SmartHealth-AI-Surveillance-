import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SECURE_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'identity-documents');

// Ensure directory exists
if (!fs.existsSync(SECURE_UPLOAD_DIR)) {
  fs.mkdirSync(SECURE_UPLOAD_DIR, { recursive: true });
}

export const SecureDocumentStorage = {
  /**
   * Save a document securely with a random server-side filename
   * Never trust the original filename for security
   */
  saveDocument(file: Express.Multer.File, userId: string): {
    storageKey: string;
    filePath: string;
    fileName: string;
  } {
    // Generate random server-side filename
    const randomSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${userId}-${randomSuffix}${ext}`;
    const filePath = path.join(SECURE_UPLOAD_DIR, fileName);
    const storageKey = `identity-documents/${fileName}`;

    // Write file to secure storage
    fs.writeFileSync(filePath, file.buffer);

    return { storageKey, filePath, fileName };
  },

  /**
   * Get file buffer by storage key
   * Only accessible through authorized API endpoints
   */
  getFile(storageKey: string): Buffer | null {
    const fileName = storageKey.replace('identity-documents/', '');
    const filePath = path.join(SECURE_UPLOAD_DIR, fileName);

    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  },

  /**
   * Check if file exists
   */
  fileExists(storageKey: string): boolean {
    const fileName = storageKey.replace('identity-documents/', '');
    const filePath = path.join(SECURE_UPLOAD_DIR, fileName);
    return fs.existsSync(filePath);
  },

  /**
   * Delete file from secure storage
   */
  deleteFile(storageKey: string): boolean {
    const fileName = storageKey.replace('identity-documents/', '');
    const filePath = path.join(SECURE_UPLOAD_DIR, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  },

  /**
   * Validate file type and MIME type
   * Don't trust the filename extension alone
   */
  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    const allowedMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF, PNG, and JPG/JPEG files are allowed.',
      };
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: 'Invalid file extension. Only PDF, PNG, and JPG/JPEG files are allowed.',
      };
    }

    // Check file size (5MB limit for identity documents)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit.',
      };
    }

    return { valid: true };
  },
};
