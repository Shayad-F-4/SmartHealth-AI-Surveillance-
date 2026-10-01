import { Request, Response } from 'express';
import prisma from '../config/prisma';

export async function getEmergencyProfile(req: Request, res: Response) {
  try {
    const healthId = req.params.healthId as string;
    if (!healthId) {
      return res.status(400).json({ error: 'Health ID is required.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { healthId },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'No patient record found for this Smart Health ID.' });
    }

    const age = Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // STRICT PRIVACY PROTECTION:
    // Only essential emergency data is exposed.
    // Full medical history, doctor notes, detailed visit logs, and private prescriptions are NOT returned.
    const emergencyProfile = {
      healthId: patient.healthId,
      patientName: patient.user.name,
      age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      criticalAllergies: patient.allergies ? patient.allergies.split(',').map((s) => s.trim()) : [],
      existingChronicConditions: patient.chronicConditions ? patient.chronicConditions.split(',').map((s) => s.trim()) : [],
      emergencyContact: {
        name: patient.emergencyContactName,
        phone: patient.emergencyContactPhone,
      },
      disclaimer: 'This emergency profile contains vital first-responder indicators only. Detailed medical history is protected by RBAC and requires authorized clinical credentials.',
    };

    return res.json(emergencyProfile);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve emergency profile.' });
  }
}
