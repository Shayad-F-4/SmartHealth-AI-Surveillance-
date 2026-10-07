import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

export async function getDoctorDashboard(req: AuthRequest, res: Response) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
      include: { hospital: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayVisitsCount = await prisma.medicalRecord.count({
      where: {
        doctorId: doctor.id,
        visitDate: { gte: todayStart },
      },
    });

    const totalConsultations = await prisma.medicalRecord.count({
      where: { doctorId: doctor.id },
    });

    const pendingReferrals = await prisma.referral.count({
      where: {
        targetDoctorId: doctor.id,
        status: 'GENERATED',
      },
    });

    const recentVisits = await prisma.medicalRecord.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        episode: true,
      },
      orderBy: { visitDate: 'desc' },
      take: 6,
    });

    return res.json({
      doctor: {
        id: doctor.id,
        name: req.user!.name,
        specialty: doctor.specialty,
        licenseNumber: doctor.licenseNumber,
        hospital: doctor.hospital,
      },
      metrics: {
        todayVisitsCount,
        totalConsultations,
        pendingReferrals,
      },
      recentVisits,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch doctor dashboard.' });
  }
}

export async function searchPatients(req: AuthRequest, res: Response) {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      // Return recent 15 patients
      const patients = await prisma.patient.findMany({
        take: 15,
        include: { user: { select: { name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(patients);
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { healthId: { contains: query, mode: 'insensitive' } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { phone: { contains: query, mode: 'insensitive' } } },
          { district: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { user: { select: { name: true, email: true, phone: true } } },
      take: 20,
    });

    await logAudit(req, 'SEARCH_PATIENTS', 'PATIENT', undefined, `Search query: "${query}" returned ${patients.length} records`);
    return res.json(patients);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to search patients.' });
  }
}

export async function getPatientFullHistory(req: AuthRequest, res: Response) {
  try {
    const patientId = req.params.patientId;
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        familyMembers: true,
        diseaseEpisodes: {
          include: { visits: { orderBy: { visitDate: 'asc' } } },
          orderBy: { startDate: 'desc' },
        },
        medicalRecords: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            hospital: true,
            prescriptions: true,
            labReports: true,
          },
          orderBy: { visitDate: 'desc' },
        },
        labReports: { orderBy: { reportDate: 'desc' } },
        prescriptions: { orderBy: { createdAt: 'desc' } },
        referrals: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    await logAudit(
      req,
      'VIEW_FULL_PATIENT_HISTORY',
      'PATIENT',
      patient.id,
      `Doctor accessed complete history of patient ${patient.healthId}`
    );

    return res.json(patient);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch patient history.' });
  }
}

export async function getDoctorProfile(req: AuthRequest, res: Response) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
        hospital: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    return res.json({
      ...doctor,
      verificationStatus: doctor.verificationStatus,
      verifiedDocumentType: doctor.verifiedDocumentType,
      verifiedAt: doctor.verifiedAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch doctor profile.' });
  }
}

export async function updateDoctorProfile(req: AuthRequest, res: Response) {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const { specialty, qualification, experienceYears } = req.body;

    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        ...(specialty !== undefined && { specialty }),
        ...(qualification !== undefined && { qualification }),
        ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears) }),
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        hospital: true,
      },
    });

    await logAudit(req, 'UPDATE_DOCTOR_PROFILE', 'DOCTOR', doctor.id, 'Updated doctor professional details');
    return res.json({ message: 'Doctor profile updated successfully.', doctor: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update doctor profile.' });
  }
}
