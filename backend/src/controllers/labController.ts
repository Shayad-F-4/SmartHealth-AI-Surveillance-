import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

export async function createLabReport(req: AuthRequest, res: Response) {
  try {
    const {
      patientId,
      recordId,
      testName,
      testCategory,
      measuredValue,
      unit,
      normalRangeMin,
      normalRangeMax,
      labTechnician,
      notes,
    } = req.body;

    if (!patientId || !testName || measuredValue === undefined || normalRangeMin === undefined || normalRangeMax === undefined) {
      return res.status(400).json({ error: 'Patient, test name, measured value, and reference ranges are required.' });
    }

    const val = parseFloat(measuredValue);
    const min = parseFloat(normalRangeMin);
    const max = parseFloat(normalRangeMax);

    const isOutOfRange = val < min || val > max;
    const outOfRangeType = val < min ? 'LOW' : (val > max ? 'HIGH' : 'NORMAL');

    // Historical trend analysis for this specific test
    const pastReports = await prisma.labReport.findMany({
      where: {
        patientId,
        testName: { equals: testName, mode: 'insensitive' },
      },
      orderBy: { reportDate: 'desc' },
      take: 3,
    });

    let trendDirection = 'STABLE';
    let trendWarning: string | null = null;

    if (pastReports.length >= 2) {
      const v1 = pastReports[0].measuredValue;
      const v2 = pastReports[1].measuredValue;

      if (val > v1 && v1 > v2) {
        trendDirection = 'UPWARD';
        trendWarning = `Continuous upward progression detected across last 3 reports (${v2} -> ${v1} -> ${val} ${unit}). Clinical evaluation advised.`;
      } else if (val < v1 && v1 < v2) {
        trendDirection = 'DOWNWARD';
        trendWarning = `Significant downward trend detected across last 3 reports (${v2} -> ${v1} -> ${val} ${unit}). Medical review recommended.`;
      }
    }

    const report = await prisma.labReport.create({
      data: {
        patientId,
        recordId: recordId || null,
        testName,
        testCategory: testCategory || 'Biochemistry',
        measuredValue: val,
        unit: unit || 'mg/dL',
        normalRangeMin: min,
        normalRangeMax: max,
        isOutOfRange,
        outOfRangeType,
        trendDirection,
        trendWarning,
        reportDate: new Date(),
        labTechnician: labTechnician || req.user!.name,
        notes,
      },
    });

    // If out of range or trend warning, notify patient
    if (isOutOfRange || trendWarning) {
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (patient) {
        await prisma.notification.create({
          data: {
            userId: patient.userId,
            title: `Lab Result Alert: ${testName}`,
            message: trendWarning || `Test result for ${testName} (${val} ${unit}) is outside standard reference range (${min} - ${max} ${unit}).`,
            type: 'LAB_WARNING',
            priority: isOutOfRange ? 'WARNING' : 'INFO',
          },
        });
      }
    }

    await logAudit(req, 'ADD_LAB_REPORT', 'LAB_REPORT', report.id, `Added lab report ${testName} = ${val} for patient ${patientId}`);
    return res.status(201).json(report);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create lab report.' });
  }
}

export async function getPatientLabReports(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.patientId;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const reports = await prisma.labReport.findMany({
      where: { patientId },
      orderBy: { reportDate: 'desc' },
    });

    return res.json(reports);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch lab reports.' });
  }
}
