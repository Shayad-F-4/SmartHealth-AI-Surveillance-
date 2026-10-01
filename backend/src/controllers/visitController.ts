import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { processVisitEpisode } from '../services/episodeService';
import { predictRiskWithML, detectAnomalyWithML } from '../services/mlClient';
import { checkAllergyConflict } from '../services/allergyService';
import { processSurveillanceOnNewCase } from '../services/surveillanceService';
import { logAudit } from '../middleware/audit';

export async function createVisit(req: AuthRequest, res: Response) {
  try {
    const doctorUser = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!doctorUser) {
      return res.status(403).json({ error: 'Only authorized doctors can record medical consultations.' });
    }

    const {
      patientId,
      hospitalId,
      symptoms,
      diagnosis,
      disease,
      severity,
      systolicBp,
      diastolicBp,
      glucose,
      bmi,
      heartRate,
      temperature,
      spo2,
      clinicalNotes,
      visitClassification, // optional explicit classification
      episodeId,           // optional explicit episode
      prescriptions = [],  // array of { medicineName, dosage, frequency, durationDays, instructions }
      labReports = [],     // array of { testName, testCategory, measuredValue, unit, normalRangeMin, normalRangeMax }
      locationDistrict,
      lat,
      lng,
    } = req.body;

    if (!patientId || !symptoms || !diagnosis || !disease || !severity) {
      return res.status(400).json({ error: 'Patient, symptoms, diagnosis, disease, and severity are required.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true, familyMembers: true },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // 1. Process or link Disease Episode
    const episodeResult = await processVisitEpisode(
      patientId,
      disease,
      severity,
      episodeId,
      visitClassification
    );

    // 2. Evaluate AI Risk Prediction (Model A)
    const age = Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const familyHistoryFlag = patient.familyMembers.some((f) => f.condition && f.condition.toLowerCase() !== 'none') ? 1 : 0;
    const chronicCount = patient.chronicConditions ? patient.chronicConditions.split(',').filter(Boolean).length : 0;

    const riskPrediction = await predictRiskWithML({
      age,
      bmi: bmi ? parseFloat(bmi) : 24.5,
      systolic_bp: systolicBp ? parseFloat(systolicBp) : 120,
      diastolic_bp: diastolicBp ? parseFloat(diastolicBp) : 80,
      fasting_glucose: glucose ? parseFloat(glucose) : 95,
      family_history_flag: familyHistoryFlag,
      chronic_conditions_count: chronicCount,
    });

    // 3. Evaluate AI Anomaly Detection (Model B)
    const anomalyResult = await detectAnomalyWithML({
      systolic_bp: systolicBp ? parseFloat(systolicBp) : 120,
      diastolic_bp: diastolicBp ? parseFloat(diastolicBp) : 80,
      fasting_glucose: glucose ? parseFloat(glucose) : 95,
      heart_rate: heartRate ? parseFloat(heartRate) : 72,
      bmi: bmi ? parseFloat(bmi) : 24.5,
      temperature: temperature ? parseFloat(temperature) : 98.6,
    });

    const district = locationDistrict || patient.district;
    const visitLat = lat ? parseFloat(lat) : patient.lat;
    const visitLng = lng ? parseFloat(lng) : patient.lng;

    // 4. Create Immutable Medical Record
    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId: doctorUser.id,
        hospitalId: hospitalId || doctorUser.hospitalId || null,
        episodeId: episodeResult.episodeId,
        visitDate: new Date(),
        symptoms,
        diagnosis,
        disease,
        severity,
        systolicBp: systolicBp ? parseFloat(systolicBp) : null,
        diastolicBp: diastolicBp ? parseFloat(diastolicBp) : null,
        glucose: glucose ? parseFloat(glucose) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        heartRate: heartRate ? parseFloat(heartRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        spo2: spo2 ? parseFloat(spo2) : null,
        clinicalNotes: clinicalNotes || '',
        visitClassification: episodeResult.suggestedClassification,
        aiRiskLevel: riskPrediction.risk_level,
        aiRiskScore: riskPrediction.risk_score,
        aiAnomalyDetected: anomalyResult.is_anomaly,
        aiAnomalyDetails: anomalyResult.is_anomaly ? anomalyResult.flagged_parameters.join(', ') : null,
        locationDistrict: district,
        lat: visitLat,
        lng: visitLng,
      },
    });

    // 5. Process Prescriptions with Allergy Cross-Referencing
    const savedPrescriptions = [];
    const allergyWarnings = [];

    for (const rx of prescriptions) {
      const allergyCheck = checkAllergyConflict(patient.allergies, rx.medicineName);
      if (allergyCheck.hasConflict) {
        allergyWarnings.push(allergyCheck.warningMessage);
      }

      const p = await prisma.prescription.create({
        data: {
          recordId: record.id,
          patientId,
          doctorId: doctorUser.id,
          medicineName: rx.medicineName,
          dosage: rx.dosage || 'Standard dosage',
          frequency: rx.frequency || 'Once daily',
          durationDays: rx.durationDays ? parseInt(rx.durationDays) : 5,
          instructions: rx.instructions || '',
          allergyWarningTriggered: allergyCheck.hasConflict,
          allergyWarningNote: allergyCheck.warningMessage || null,
        },
      });
      savedPrescriptions.push(p);
    }

    // 6. Process Lab Reports (with out-of-range checks)
    const savedLabs = [];
    for (const lab of labReports) {
      const val = parseFloat(lab.measuredValue);
      const min = parseFloat(lab.normalRangeMin);
      const max = parseFloat(lab.normalRangeMax);
      const isOutOfRange = val < min || val > max;
      const outType = val < min ? 'LOW' : (val > max ? 'HIGH' : 'NORMAL');

      const l = await prisma.labReport.create({
        data: {
          recordId: record.id,
          patientId,
          testName: lab.testName,
          testCategory: lab.testCategory || 'General Pathology',
          measuredValue: val,
          unit: lab.unit,
          normalRangeMin: min,
          normalRangeMax: max,
          isOutOfRange,
          outOfRangeType: outType,
          reportDate: new Date(),
          labTechnician: doctorUser.specialty,
        },
      });
      savedLabs.push(l);
    }

    // 7. Auto-feed into Population Surveillance Pipeline
    await processSurveillanceOnNewCase({
      id: record.id,
      disease,
      locationDistrict: district,
      lat: visitLat,
      lng: visitLng,
      patientId,
      age,
      gender: patient.gender,
      severity,
      source: 'CLINICAL_VISIT',
    });

    // 8. If anomaly detected or high risk, generate an in-app health alert for patient
    if (anomalyResult.is_anomaly || riskPrediction.risk_level === 'HIGH') {
      await prisma.notification.create({
        data: {
          userId: patient.userId,
          title: anomalyResult.is_anomaly ? '⚠️ Vitals Anomaly Flagged' : 'Health Indicator Alert',
          message: anomalyResult.is_anomaly
            ? `Dr. ${req.user!.name} noted atypical vitals during your visit (${anomalyResult.flagged_parameters.join(', ')}). Please adhere to recommended care guidance.`
            : `Your recent health indicators point to an elevated cardiometabolic risk score. Review doctor recommendations and lifestyle adjustments.`,
          type: 'AI_HEALTH_FLAG',
          priority: anomalyResult.is_anomaly ? 'CRITICAL' : 'WARNING',
          district,
        },
      });
    }

    await logAudit(
      req,
      'CREATE_VISIT',
      'MEDICAL_RECORD',
      record.id,
      `Recorded visit for ${patient.healthId} - Disease: ${disease} (${severity})`
    );

    return res.status(201).json({
      message: 'Consultation recorded successfully.',
      record,
      episode: episodeResult,
      aiRiskPrediction: riskPrediction,
      aiAnomalyDetection: anomalyResult,
      prescriptions: savedPrescriptions,
      allergyWarnings,
      labReports: savedLabs,
    });
  } catch (err: any) {
    console.error('Visit creation error:', err);
    return res.status(500).json({ error: 'Failed to record consultation visit.', details: err.message });
  }
}

export async function getVisitById(req: AuthRequest, res: Response) {
  try {
    const visitId = req.params.id;
    const visit = await prisma.medicalRecord.findUnique({
      where: { id: visitId },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        hospital: true,
        patient: { include: { user: { select: { name: true } } } },
        episode: true,
        prescriptions: true,
        labReports: true,
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit record not found.' });
    }

    return res.json(visit);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve visit record.' });
  }
}
