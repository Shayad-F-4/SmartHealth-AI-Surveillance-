import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { processSurveillanceOnNewCase } from '../services/surveillanceService';
import { logAudit } from '../middleware/audit';

export async function getHealthCamps(req: AuthRequest, res: Response) {
  try {
    const status = req.query.status as string;
    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const camps = await prisma.healthCamp.findMany({
      where: whereClause,
      include: {
        screenings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(camps);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve health camps.' });
  }
}

export async function createHealthCamp(req: AuthRequest, res: Response) {
  try {
    const {
      district,
      venue,
      targetDisease,
      campDate,
      capacity,
      doctorsAssigned,
      notes,
    } = req.body;

    if (!district || !venue || !targetDisease || !campDate) {
      return res.status(400).json({ error: 'District, venue, target disease, and date are required.' });
    }

    const camp = await prisma.healthCamp.create({
      data: {
        district,
        venue,
        targetDisease,
        campDate: new Date(campDate),
        capacity: capacity ? parseInt(capacity) : 200,
        doctorsAssigned: doctorsAssigned || 'Assigned Medical Officers',
        status: 'APPROVED',
        notes,
      },
    });

    await logAudit(req, 'CREATE_HEALTH_CAMP', 'HEALTH_CAMP', camp.id, `Created camp in ${district} for ${targetDisease}`);
    return res.status(201).json(camp);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create health camp.' });
  }
}

export async function updateCampStatus(req: AuthRequest, res: Response) {
  try {
    const campId = req.params.id;
    const { status } = req.body;

    const updated = await prisma.healthCamp.update({
      where: { id: campId },
      data: { status },
    });

    await logAudit(req, 'UPDATE_CAMP_STATUS', 'HEALTH_CAMP', campId, `Updated status to ${status}`);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update health camp status.' });
  }
}

export async function recordScreening(req: AuthRequest, res: Response) {
  try {
    const campId = req.params.id;
    const {
      patientName,
      age,
      gender,
      symptoms,
      suspectedDisease,
      vitalsSummary,
      referred,
      referralSpecialty,
    } = req.body;

    if (!patientName || !age || !symptoms) {
      return res.status(400).json({ error: 'Patient name, age, and symptoms are required.' });
    }

    const camp = await prisma.healthCamp.findUnique({ where: { id: campId } });
    if (!camp) {
      return res.status(404).json({ error: 'Health camp not found.' });
    }

    const screening = await prisma.campScreening.create({
      data: {
        campId,
        patientName,
        age: parseInt(age),
        gender: gender || 'UNKNOWN',
        symptoms,
        suspectedDisease: suspectedDisease || camp.targetDisease,
        vitalsSummary,
        referred: Boolean(referred),
        referralSpecialty: referralSpecialty || null,
      },
    });

    // Increment camp screenedCount
    await prisma.healthCamp.update({
      where: { id: campId },
      data: { screenedCount: { increment: 1 } },
    });

    // Feed screening data back into surveillance pipeline if disease is suspected!
    if (suspectedDisease || camp.targetDisease) {
      const diseaseName = suspectedDisease || camp.targetDisease;
      await processSurveillanceOnNewCase({
        disease: diseaseName,
        locationDistrict: camp.district,
        lat: 12.9716, // Default district centroid
        lng: 77.5946,
        age: parseInt(age),
        gender,
        severity: referred ? 'SEVERE' : 'MODERATE',
        source: 'CAMP_SCREENING',
      });
    }

    await logAudit(req, 'RECORD_CAMP_SCREENING', 'CAMP_SCREENING', screening.id, `Screened ${patientName} at ${camp.venue}`);
    return res.status(201).json(screening);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record camp screening.' });
  }
}
