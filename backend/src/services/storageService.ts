import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'medical-documents');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const StorageService = {
  saveFile(file: Express.Multer.File): { filePath: string; relativePath: string; fileName: string } {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${uniqueSuffix}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, file.buffer);
    const relativePath = path.join('uploads', 'medical-documents', fileName);

    return { filePath, relativePath, fileName };
  },

  getFile(fileName: string): Buffer | null {
    const filePath = path.join(UPLOAD_DIR, path.basename(fileName));
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  },

  fileExists(fileName: string): boolean {
    const filePath = path.join(UPLOAD_DIR, path.basename(fileName));
    return fs.existsSync(filePath);
  },

  deleteFile(fileName: string): boolean {
    const filePath = path.join(UPLOAD_DIR, path.basename(fileName));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  },
};
