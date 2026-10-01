import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { checkAllergyConflict } from '../services/allergyService';
import { logAudit } from '../middleware/audit';

export async function createPrescription(req: AuthRequest, res: Response) {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) {
      return res.status(403).json({ error: 'Only authorized doctors can prescribe medications.' });
    }

    const {
      patientId,
      recordId,
      medicineName,
      dosage,
      frequency,
      durationDays,
      instructions,
    } = req.body;

    if (!patientId || !recordId || !medicineName) {
      return res.status(400).json({ error: 'Patient ID, Medical Record ID, and medicine name are required.' });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const allergyCheck = checkAllergyConflict(patient.allergies, medicineName);

    const prescription = await prisma.prescription.create({
      data: {
        recordId,
        patientId,
        doctorId: doctor.id,
        medicineName,
        dosage: dosage || 'Standard dose',
        frequency: frequency || 'Once daily',
        durationDays: durationDays ? parseInt(durationDays) : 5,
        instructions,
        allergyWarningTriggered: allergyCheck.hasConflict,
        allergyWarningNote: allergyCheck.warningMessage || null,
      },
    });

    await logAudit(
      req,
      'CREATE_PRESCRIPTION',
      'PRESCRIPTION',
      prescription.id,
      `Prescribed ${medicineName} to ${patient.healthId}. Conflict: ${allergyCheck.hasConflict}`
    );

    return res.status(201).json({
      prescription,
      allergyConflict: allergyCheck,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create prescription.' });
  }
}

export async function getPatientPrescriptions(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.patientId;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        medicalRecord: { select: { visitDate: true, disease: true, diagnosis: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(prescriptions);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch prescriptions.' });
  }
}
