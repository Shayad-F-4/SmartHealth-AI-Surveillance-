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
      include: {
        referringDoctor: { include: { user: { select: { name: true } } } },
        patient: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    // Notify Patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: { select: { name: true } } },
    });
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

    // Notify Target Doctor if specified
    if (targetDoctorId) {
      const targetDoc = await prisma.doctor.findUnique({ where: { id: targetDoctorId } });
      if (targetDoc) {
        await prisma.notification.create({
          data: {
            userId: targetDoc.userId,
            title: 'New Clinical Referral Received',
            message: `Dr. ${req.user!.name} has referred patient ${patient?.user?.name || ''} to you for: ${reason}. Priority: ${priority || 'ROUTINE'}.`,
            type: 'APPOINTMENT',
            priority: priority === 'EMERGENCY' ? 'CRITICAL' : 'HIGH',
          },
        });
      }
    }

    await logAudit(req, 'CREATE_REFERRAL', 'REFERRAL', referral.id, `Created referral to ${targetSpecialty} for patient ${patientId}`);
    return res.status(201).json(referral);
  } catch (err: any) {
    console.error('Failed to create referral:', err);
    return res.status(500).json({ error: 'Failed to create referral.' });
  }
}

export async function getPatientReferrals(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.patientId || (req.query.patientId as string);

    // 1. If explicit patientId is passed
    if (patientId) {
      const referrals = await prisma.referral.findMany({
        where: { patientId },
        include: {
          referringDoctor: { include: { user: { select: { name: true } } } },
          patient: { include: { user: { select: { name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(referrals);
    }

    // 2. Patient requesting their own referrals
    if (req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!p) {
        return res.status(404).json({ error: 'Patient profile not found.' });
      }

      const referrals = await prisma.referral.findMany({
        where: { patientId: p.id },
        include: {
          referringDoctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(referrals);
    }

    // 3. Doctor requesting referrals (inbound referrals targeted to them, created by them, or matching their specialty)
    if (req.user?.role === 'DOCTOR') {
      const doc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
      if (!doc) {
        return res.status(404).json({ error: 'Doctor profile not found.' });
      }

      const referrals = await prisma.referral.findMany({
        where: {
          OR: [
            { referringDoctorId: doc.id },
            { targetDoctorId: doc.id },
            { targetSpecialty: doc.specialty },
          ],
        },
        include: {
          referringDoctor: { include: { user: { select: { name: true } } } },
          patient: { include: { user: { select: { name: true, phone: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(referrals);
    }

    // 4. Admin requesting surveillance referral overview
    if (req.user?.role === 'ADMIN') {
      const referrals = await prisma.referral.findMany({
        include: {
          referringDoctor: { include: { user: { select: { name: true } } } },
          patient: { include: { user: { select: { name: true, phone: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(referrals);
    }

    return res.status(400).json({ error: 'Patient ID is required.' });
  } catch (err: any) {
    console.error('Failed to fetch referrals:', err);
    return res.status(500).json({ error: 'Failed to fetch referrals.' });
  }
}

export async function updateReferralStatus(req: AuthRequest, res: Response) {
  try {
    const referralId = req.params.id;
    const { status, clinicalNotes } = req.body;

    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referringDoctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found.' });
    }

    const updated = await prisma.referral.update({
      where: { id: referralId },
      data: {
        status,
        clinicalNotes: clinicalNotes || referral.clinicalNotes,
      },
    });

    // Notify referring doctor and patient about status change
    const doctorName = req.user?.name || 'Practitioner';
    if (referral.referringDoctor?.user?.id && referral.referringDoctor.userId !== req.user?.id) {
      await prisma.notification.create({
        data: {
          userId: referral.referringDoctor.userId,
          title: `Referral ${status}`,
          message: `Referral for patient ${referral.patient.user.name} has been updated to ${status} by Dr. ${doctorName}.`,
          type: 'APPOINTMENT',
          priority: 'MEDIUM',
        },
      });
    }

    if (referral.patient?.userId) {
      await prisma.notification.create({
        data: {
          userId: referral.patient.userId,
          title: `Referral Status: ${status}`,
          message: `Your clinical referral to ${referral.targetSpecialty} has been updated to ${status}.`,
          type: 'APPOINTMENT',
          priority: 'MEDIUM',
        },
      });
    }

    await logAudit(req, 'UPDATE_REFERRAL_STATUS', 'REFERRAL', referralId, `Status updated to ${status}`);
    return res.json(updated);
  } catch (err: any) {
    console.error('Failed to update referral status:', err);
    return res.status(500).json({ error: 'Failed to update referral status.' });
  }
}
