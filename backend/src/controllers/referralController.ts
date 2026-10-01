import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

export async function createReferral(req: AuthRequest, res: Response) {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) {
      return res.status(403).json({ error: 'Only authorized doctors can create clinical referrals.' });
    }

    const {
      patientId,
      targetSpecialty,
      targetDoctorId,
      reason,
      priority,
      clinicalNotes,
    } = req.body;

    if (!patientId || !targetSpecialty || !reason) {
      return res.status(400).json({ error: 'Patient ID, target specialty, and reason are required.' });
    }

    const referral = await prisma.referral.create({
      data: {
        patientId,
        referringDoctorId: doctor.id,
        targetSpecialty,
        targetDoctorId: targetDoctorId || null,
        reason,
        priority: priority || 'ROUTINE',
        status: 'GENERATED',
        clinicalNotes,
      },
    });

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (patient) {
      await prisma.notification.create({
        data: {
          userId: patient.userId,
          title: 'Specialist Referral Created',
          message: `Dr. ${req.user!.name} has referred you to a ${targetSpecialty} specialist for: ${reason}. Priority: ${priority || 'ROUTINE'}.`,
          type: 'APPOINTMENT',
          priority: priority === 'EMERGENCY' ? 'CRITICAL' : 'INFO',
        },
      });
    }

    await logAudit(req, 'CREATE_REFERRAL', 'REFERRAL', referral.id, `Created referral to ${targetSpecialty} for patient ${patientId}`);
    return res.status(201).json(referral);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create referral.' });
  }
}

export async function getPatientReferrals(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.patientId;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const referrals = await prisma.referral.findMany({
      where: { patientId },
      include: {
        referringDoctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(referrals);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch referrals.' });
  }
}

export async function updateReferralStatus(req: AuthRequest, res: Response) {
  try {
    const referralId = req.params.id;
    const { status, clinicalNotes } = req.body;

    const updated = await prisma.referral.update({
      where: { id: referralId },
      data: {
        status,
        clinicalNotes: clinicalNotes || undefined,
      },
    });

    await logAudit(req, 'UPDATE_REFERRAL_STATUS', 'REFERRAL', referralId, `Status updated to ${status}`);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update referral status.' });
  }
}
