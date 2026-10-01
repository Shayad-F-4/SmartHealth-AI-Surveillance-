import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { predictRiskWithML } from '../services/mlClient';
import { logAudit } from '../middleware/audit';

export async function getPatientProfile(req: AuthRequest, res: Response) {
  try {
    const patientId = req.params.id;
    let patient;

    if (patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: { select: { name: true, email: true, phone: true } } },
      });
    } else if (req.user?.role === 'PATIENT') {
      patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        include: { user: { select: { name: true, email: true, phone: true } } },
      });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    await logAudit(req, 'VIEW_PATIENT_PROFILE', 'PATIENT', patient.id, `Viewed profile of patient ${patient.healthId}`);
    return res.json(patient);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch patient profile.' });
  }
}

export async function updatePatientProfile(req: AuthRequest, res: Response) {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const {
      address,
      district,
      emergencyContactName,
      emergencyContactPhone,
      allergies,
      chronicConditions,
      lat,
      lng,
    } = req.body;

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        address: address !== undefined ? address : patient.address,
        district: district !== undefined ? district : patient.district,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : patient.emergencyContactName,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : patient.emergencyContactPhone,
        allergies: allergies !== undefined ? allergies : patient.allergies,
        chronicConditions: chronicConditions !== undefined ? chronicConditions : patient.chronicConditions,
        lat: lat !== undefined ? parseFloat(lat) : patient.lat,
        lng: lng !== undefined ? parseFloat(lng) : patient.lng,
      },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });

    await logAudit(req, 'UPDATE_PATIENT_PROFILE', 'PATIENT', patient.id, 'Updated personal health details');
    return res.json({ message: 'Profile updated successfully.', patient: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update patient profile.' });
  }
}

export async function getSmartHealthCard(req: AuthRequest, res: Response) {
  try {
    let patientId = req.params.id;
    let patient;

    if (patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: { select: { name: true, email: true, phone: true } } },
      });
    } else {
      patient = await prisma.patient.findUnique({
        where: { userId: req.user!.id },
        include: { user: { select: { name: true, email: true, phone: true } } },
      });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient card not found.' });
    }

    const cardData = {
      patientName: patient.user.name,
      healthId: patient.healthId,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      dob: patient.dob,
      district: patient.district,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      allergies: patient.allergies || 'None reported',
      chronicConditions: patient.chronicConditions || 'None reported',
      // The QR code securely encodes ONLY the healthId & emergency lookup link, NOT full clinical history
      qrValue: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/emergency/${patient.healthId}`,
      verificationPayload: {
        type: 'SMART_HEALTH_CARD_V1',
        healthId: patient.healthId,
        issuedBy: 'Smart Healthcare Public Health Authority',
        emergencyUrl: `/emergency/${patient.healthId}`,
      },
    };

    return res.json(cardData);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve Smart Health Card.' });
  }
}

export async function getMedicalTimeline(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.id;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        hospital: true,
        episode: true,
        prescriptions: true,
        labReports: true,
      },
      orderBy: { visitDate: 'desc' },
    });

    await logAudit(req, 'VIEW_MEDICAL_TIMELINE', 'MEDICAL_RECORD', patientId, `Fetched ${records.length} timeline visits`);
    return res.json(records);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve medical timeline.' });
  }
}

export async function getDiseaseEpisodes(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.id;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const episodes = await prisma.diseaseEpisode.findMany({
      where: { patientId },
      include: {
        visits: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            prescriptions: true,
            labReports: true,
          },
          orderBy: { visitDate: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return res.json(episodes);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve disease episodes.' });
  }
}

export async function getPersonalAnalytics(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.id;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const visits = await prisma.medicalRecord.findMany({
      where: { patientId },
      select: {
        visitDate: true,
        systolicBp: true,
        diastolicBp: true,
        glucose: true,
        bmi: true,
        heartRate: true,
        temperature: true,
        disease: true,
        severity: true,
      },
      orderBy: { visitDate: 'asc' },
    });

    const bpSeries = visits.filter((v) => v.systolicBp && v.diastolicBp).map((v) => ({
      date: v.visitDate.toISOString().split('T')[0],
      systolic: v.systolicBp,
      diastolic: v.diastolicBp,
    }));

    const glucoseSeries = visits.filter((v) => v.glucose).map((v) => ({
      date: v.visitDate.toISOString().split('T')[0],
      glucose: v.glucose,
    }));

    const bmiSeries = visits.filter((v) => v.bmi).map((v) => ({
      date: v.visitDate.toISOString().split('T')[0],
      bmi: v.bmi,
    }));

    const vitalsSeries = visits.map((v) => ({
      date: v.visitDate.toISOString().split('T')[0],
      heartRate: v.heartRate,
      temperature: v.temperature,
    }));

    return res.json({
      totalVisits: visits.length,
      bpSeries,
      glucoseSeries,
      bmiSeries,
      vitalsSeries,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve health analytics.' });
  }
}

export async function getAIHealthRisk(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.id;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        familyMembers: true,
        medicalRecords: { orderBy: { visitDate: 'desc' }, take: 1 },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // Calculate age
    const age = Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const latestVisit = patient.medicalRecords[0];

    const systolic = latestVisit?.systolicBp || 120;
    const diastolic = latestVisit?.diastolicBp || 80;
    const glucose = latestVisit?.glucose || 95;
    const bmi = latestVisit?.bmi || 24.5;
    const familyHistoryFlag = patient.familyMembers.some((f) => f.condition && f.condition.toLowerCase() !== 'none') ? 1 : 0;
    const chronicCount = patient.chronicConditions ? patient.chronicConditions.split(',').filter(Boolean).length : 0;

    const riskResult = await predictRiskWithML({
      age,
      bmi,
      systolic_bp: systolic,
      diastolic_bp: diastolic,
      fasting_glucose: glucose,
      family_history_flag: familyHistoryFlag,
      chronic_conditions_count: chronicCount,
    });

    return res.json({
      patientId: patient.id,
      healthId: patient.healthId,
      calculatedFromVitals: {
        age,
        bmi,
        systolic,
        diastolic,
        glucose,
        familyHistoryFlag,
        chronicCount,
      },
      ...riskResult,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to calculate AI health risk.' });
  }
}
