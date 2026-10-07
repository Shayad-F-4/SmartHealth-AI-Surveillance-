import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { predictRiskWithML } from '../services/mlClient';
import { generateRiskExplanation } from '../services/riskExplanationService';
import { logAudit } from '../middleware/audit';

export async function getPatientProfile(req: AuthRequest, res: Response) {
  try {
    const patientId = req.params.id;
    let patient;

    if (patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: { select: { name: true, email: true, phone: true, avatarUrl: true } } },
      });
    } else if (req.user?.role === 'PATIENT') {
      patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        include: { user: { select: { name: true, email: true, phone: true, avatarUrl: true } } },
      });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    await logAudit(req, 'VIEW_PATIENT_PROFILE', 'PATIENT', patient.id, `Viewed profile of patient ${patient.healthId}`);
    return res.json({
      ...patient,
      verificationStatus: patient.verificationStatus,
      verifiedDocumentType: patient.verifiedDocumentType,
      verifiedAt: patient.verifiedAt,
    });
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

export async function getLongitudinalHealthTrends(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.id || (req.query.patientId as string);
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    // Optional query filters
    const testFilter = req.query.test ? (req.query.test as string) : undefined;
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;

    // Build date filter clause
    const dateClause: any = {};
    if (fromDate) dateClause.gte = fromDate;
    if (toDate) dateClause.lte = toDate;

    // Fetch Lab Reports
    const labWhere: any = { patientId };
    if (testFilter) {
      labWhere.testName = { equals: testFilter, mode: 'insensitive' };
    }
    if (Object.keys(dateClause).length > 0) {
      labWhere.reportDate = dateClause;
    }

    const labReports = (await prisma.labReport.findMany({
      where: labWhere,
      include: {
        medicalRecord: {
          select: {
            id: true,
            symptoms: true,
            diagnosis: true,
            disease: true,
            visitDate: true,
          },
        },
      },
      orderBy: { reportDate: 'asc' },
    })) as Array<any>;

    // Fetch Vitals/MedicalRecords for vital trends
    const recordWhere: any = { patientId };
    if (Object.keys(dateClause).length > 0) {
      recordWhere.visitDate = dateClause;
    }

    const medicalRecords = await prisma.medicalRecord.findMany({
      where: recordWhere,
      select: {
        id: true,
        visitDate: true,
        systolicBp: true,
        diastolicBp: true,
        glucose: true,
        bmi: true,
        heartRate: true,
        temperature: true,
        diagnosis: true,
        disease: true,
        doctor: { include: { user: { select: { name: true } } } },
        hospital: { select: { name: true } },
      },
      orderBy: { visitDate: 'asc' },
    });

    // Group Lab Reports by testName
    const labGroupMap = new Map<string, typeof labReports>();
    for (const r of labReports) {
      const key = r.testName.trim();
      if (!labGroupMap.has(key)) {
        labGroupMap.set(key, []);
      }
      labGroupMap.get(key)!.push(r);
    }

    // Process Lab Trends
    const labTrends = Array.from(labGroupMap.entries()).map(([testName, reports]) => {
      const measurements = reports.map((r) => {
        let status: 'NORMAL' | 'ABNORMAL' | 'UNKNOWN' = 'UNKNOWN';
        if (r.isOutOfRange || r.outOfRangeType === 'HIGH' || r.outOfRangeType === 'LOW' || r.outOfRangeType === 'ABNORMAL') {
          status = 'ABNORMAL';
        } else {
          status = 'NORMAL';
        }

        const refRangeStr = r.normalRangeMin !== undefined && r.normalRangeMax !== undefined
          ? `${r.normalRangeMin} - ${r.normalRangeMax} ${r.unit}`
          : 'Reference range unavailable';

        return {
          id: r.id,
          date: r.reportDate.toISOString().split('T')[0],
          timestamp: r.reportDate.toISOString(),
          value: r.measuredValue,
          unit: r.unit || 'Unit not recorded',
          referenceRange: refRangeStr,
          normalRangeMin: r.normalRangeMin,
          normalRangeMax: r.normalRangeMax,
          status,
          sourceId: r.recordId || r.id,
          sourceTitle: r.medicalRecord ? (r.medicalRecord.disease || r.medicalRecord.diagnosis || 'Clinical Encounter') : 'Diagnostic Upload',
          labTechnician: r.labTechnician,
          notes: r.notes,
        };
      });

      const count = measurements.length;
      const latest = measurements[count - 1];
      const previous = count > 1 ? measurements[count - 2] : null;

      let direction: 'INCREASING' | 'DECREASING' | 'STABLE' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
      let change: number | null = null;
      let percentageChange: number | null = null;

      if (previous && latest) {
        change = Math.round((latest.value - previous.value) * 100) / 100;
        if (previous.value !== 0) {
          percentageChange = Math.round(((latest.value - previous.value) / previous.value) * 10000) / 100;
        }

        if (change > 0) direction = 'INCREASING';
        else if (change < 0) direction = 'DECREASING';
        else direction = 'STABLE';
      }

      // Natural language summary sentence
      let summary = '';
      if (count === 1) {
        summary = `One measurement recorded for ${testName} (${latest.value} ${latest.unit}). Additional historical data is required to calculate a longitudinal trend.`;
      } else if (previous && latest) {
        const sign = change! >= 0 ? '+' : '';
        const pctStr = percentageChange !== null ? ` (${sign}${percentageChange}%)` : '';
        summary = `${testName} ${direction.toLowerCase()} from ${previous.value} ${previous.unit} (${previous.date}) to ${latest.value} ${latest.unit} (${latest.date}). Net change: ${sign}${change} ${latest.unit}${pctStr}. Latest status is ${latest.status}.`;
      }

      return {
        testName,
        unit: latest.unit,
        referenceRange: latest.referenceRange,
        count,
        latest,
        previous,
        trend: {
          direction,
          change,
          percentageChange,
        },
        measurements,
        summary,
      };
    });

    // Process Biometric Vitals Trends (Blood Pressure, Glucose, BMI)
    const bpMeasurements = medicalRecords
      .filter((m) => m.systolicBp !== null && m.diastolicBp !== null)
      .map((m) => ({
        id: m.id,
        date: m.visitDate.toISOString().split('T')[0],
        systolic: m.systolicBp!,
        diastolic: m.diastolicBp!,
        status: m.systolicBp! > 130 || m.diastolicBp! > 85 ? 'ABNORMAL' : 'NORMAL',
        diagnosis: m.diagnosis,
        doctorName: m.doctor?.user?.name || 'Attending Physician',
      }));

    const glucoseMeasurements = medicalRecords
      .filter((m) => m.glucose !== null)
      .map((m) => ({
        id: m.id,
        date: m.visitDate.toISOString().split('T')[0],
        value: m.glucose!,
        unit: 'mg/dL',
        status: m.glucose! < 70 || m.glucose! > 100 ? 'ABNORMAL' : 'NORMAL',
        diagnosis: m.diagnosis,
      }));

    await logAudit(req, 'VIEW_LONGITUDINAL_HEALTH_TRENDS', 'PATIENT', patientId, `Fetched longitudinal health trends with ${labTrends.length} lab tests`);

    return res.json({
      patientId,
      totalLabTestsAnalyzed: labTrends.length,
      totalClinicalEncounters: medicalRecords.length,
      labTrends,
      vitalsTrends: {
        bloodPressure: {
          count: bpMeasurements.length,
          measurements: bpMeasurements,
          latest: bpMeasurements[bpMeasurements.length - 1] || null,
        },
        glucose: {
          count: glucoseMeasurements.length,
          measurements: glucoseMeasurements,
          latest: glucoseMeasurements[glucoseMeasurements.length - 1] || null,
        },
      },
    });
  } catch (err: any) {
    console.error('Longitudinal health trends error:', err);
    return res.status(500).json({ error: 'Failed to retrieve longitudinal health trends.' });
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
        medicalRecords: { orderBy: { visitDate: 'desc' }, take: 5 },
        labReports: { orderBy: { reportDate: 'desc' }, take: 5 },
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

    const vitals = {
      age,
      bmi,
      systolic,
      diastolic,
      glucose,
      familyHistoryFlag,
      chronicCount,
    };

    const riskResult = await predictRiskWithML({
      age,
      bmi,
      systolic_bp: systolic,
      diastolic_bp: diastolic,
      fasting_glucose: glucose,
      family_history_flag: familyHistoryFlag,
      chronic_conditions_count: chronicCount,
    });

    // Generate Explanation Layer without altering ML result
    let explanation = null;
    try {
      explanation = generateRiskExplanation(
        riskResult.risk_level || 'MODERATE',
        riskResult.risk_score || 50,
        vitals,
        riskResult.feature_importances,
        {
          labReports: patient.labReports,
          medicalRecords: patient.medicalRecords,
          familyMembers: patient.familyMembers,
        }
      );
    } catch (expErr) {
      console.warn('Risk explanation generation warning:', expErr);
      explanation = {
        summary: 'ML prediction generated successfully. Detailed factor breakdown currently unavailable.',
        contributingFactors: [],
        supportingEvidence: [],
        limitations: ['AI decision support indicator. Clinical validation required.'],
      };
    }

    await logAudit(req, 'VIEW_AI_HEALTH_RISK', 'PATIENT', patientId, `Fetched AI health risk: ${riskResult.risk_level} (${riskResult.risk_score}%)`);

    return res.json({
      patientId: patient.id,
      healthId: patient.healthId,
      calculatedFromVitals: vitals,
      prediction: {
        riskLevel: riskResult.risk_level,
        riskScore: riskResult.risk_score,
        probabilities: riskResult.probabilities,
        featureImportances: riskResult.feature_importances,
        modelMetadata: riskResult.model_metadata || { model: 'RandomForestClassifier', version: '1.0.0' },
      },
      explanation,
      ...riskResult,
    });
  } catch (err: any) {
    console.error('AI Health Risk calculation error:', err);
    return res.status(500).json({ error: 'Failed to calculate AI health risk.' });
  }
}
