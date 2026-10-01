import prisma from '../config/prisma';

export async function generateSmartHealthId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await prisma.patient.count();
  const nextNum = count + 1;
  const padded = String(nextNum).padStart(6, '0');
  return `SHC-${currentYear}-${padded}`;
}
