import prisma from '../config/prisma';
import { predictRiskWithML } from './mlClient';
import { generateRiskExplanation } from './riskExplanationService';

export interface RetrievedPatientContext {
  patientProfile?: {
    id: string;
    healthId: string;
    name: string;
    age: number;
    gender: string;
    bloodGroup: string;
    district: string;
    allergies: string;
    chronicConditions: string;
  };
  recentLabs?: Array<{
    id: string;
    testName: string;
    measuredValue: number;
    unit: string;
    normalRangeMin: number;
    normalRangeMax: number;
    isOutOfRange: boolean;
    reportDate: string;
    notes?: string | null;
  }>;
  recentRecords?: Array<{
    id: string;
    visitDate: string;
    symptoms: string;
    diagnosis: string;
    disease: string;
    systolicBp?: number | null;
    diastolicBp?: number | null;
    glucose?: number | null;
    doctorName?: string;
  }>;
  prescriptions?: Array<{
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    status: string;
    createdAt: string;
  }>;
  diseaseEpisodes?: Array<{
    id: string;
    disease: string;
    status: string;
    startDate: string;
    summary?: string | null;
  }>;
  familyHistory?: Array<{
    id: string;
    relation: string;
    condition: string;
  }>;
  riskPrediction?: any;
}

export type IntentCategory =
  | 'LABS'
  | 'MEDICATIONS'
  | 'RISK'
  | 'TIMELINE'
  | 'EPISODES'
  | 'GENERAL_SUMMARY'
  | 'GENERAL_MEDICAL'
  | 'HYBRID_MEDICAL'
  | 'UNKNOWN';

export const PatientContextService = {
  detectIntent(question: string): IntentCategory {
    const q = question.toLowerCase().trim();

    // Check for personal ownership or reference to user's personal health data
    const hasPersonalReference =
      /\b(my|i|me|mine|am i|my latest|my recent|prescribed to me|my doctor|my bp|my blood|my report|my lab|my result|my cholesterol|my hba1c|my glucose)\b/i.test(
        q
      );

    // Check if query is seeking general medical definition, guideline, explanation, or concept
    const isGeneralInquiry =
      /\b(what is|what are|what does|define|definition|difference between|how does|why do|symptoms of|causes of|guidelines|normal range|reference range|how is .* diagnosed)\b/i.test(
        q
      );

    // 1. HYBRID: Patient mentions their personal metric/report AND asks what it generally means/implies
    if (hasPersonalReference && (isGeneralInquiry || /\b(mean|implies|consequence|dangerous|worry|elevated|high|low)\b/i.test(q))) {
      return 'HYBRID_MEDICAL';
    }

    // 2. GENERAL MEDICAL: Purely educational medical inquiry without personal data request
    if (!hasPersonalReference && (isGeneralInquiry || /\b(hypertension|hba1c|diabetes|cholesterol|anemia|malaria|dengue|hemoglobin|systolic|diastolic|triglycerides|ldl|hdl)\b/i.test(q))) {
      return 'GENERAL_MEDICAL';
    }

    // 3. Patient EHR specific intents
    if (q.includes('lab') || q.includes('test') || q.includes('result') || q.includes('blood work') || q.includes('glucose') || q.includes('hemoglobin') || q.includes('cholesterol')) {
      return 'LABS';
    }
    if (q.includes('medication') || q.includes('medicine') || q.includes('prescription') || q.includes('drug') || q.includes('pill') || q.includes('dosage')) {
      return 'MEDICATIONS';
    }
    if (q.includes('risk') || q.includes('score') || q.includes('anomaly') || q.includes('prediction') || q.includes('future') || q.includes('danger')) {
      return 'RISK';
    }
    if (q.includes('episode') || q.includes('disease') || q.includes('illness') || q.includes('infection') || q.includes('malaria') || q.includes('fever')) {
      return 'EPISODES';
    }
    if (q.includes('history') || q.includes('timeline') || q.includes('summary') || q.includes('visit') || q.includes('doctor') || q.includes('consultation')) {
      return 'TIMELINE';
    }

    return 'GENERAL_SUMMARY';
  },

  async retrieveContext(patientId: string, intent: IntentCategory): Promise<RetrievedPatientContext> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { name: true } },
        familyMembers: true,
      },
    });

    if (!patient) {
      throw new Error('Authorized patient profile not found.');
    }

    const age = Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const context: RetrievedPatientContext = {
      patientProfile: {
        id: patient.id,
        healthId: patient.healthId,
        name: patient.user.name,
        age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        district: patient.district,
        allergies: patient.allergies || 'None reported',
        chronicConditions: patient.chronicConditions || 'None reported',
      },
    };

    // Targeted retrieval based on detected intent
    if (intent === 'LABS' || intent === 'GENERAL_SUMMARY' || intent === 'HYBRID_MEDICAL') {
      const labs = await prisma.labReport.findMany({
        where: { patientId },
        orderBy: { reportDate: 'desc' },
        take: 8,
      });
      context.recentLabs = labs.map((l) => ({
        id: l.id,
        testName: l.testName,
        measuredValue: l.measuredValue,
        unit: l.unit,
        normalRangeMin: l.normalRangeMin,
        normalRangeMax: l.normalRangeMax,
        isOutOfRange: l.isOutOfRange,
        reportDate: l.reportDate.toISOString().split('T')[0],
        notes: l.notes,
      }));
    }

    if (intent === 'MEDICATIONS' || intent === 'GENERAL_SUMMARY') {
      const prescriptions = await prisma.prescription.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });
      context.prescriptions = prescriptions.map((p) => ({
        id: p.id,
        medicineName: p.medicineName,
        dosage: p.dosage,
        frequency: p.frequency,
        durationDays: p.durationDays,
        status: p.status,
        createdAt: p.createdAt.toISOString().split('T')[0],
      }));
    }

    if (intent === 'TIMELINE' || intent === 'EPISODES' || intent === 'GENERAL_SUMMARY' || intent === 'HYBRID_MEDICAL') {
      const records = await prisma.medicalRecord.findMany({
        where: { patientId },
        include: { doctor: { include: { user: { select: { name: true } } } } },
        orderBy: { visitDate: 'desc' },
        take: 5,
      });
      context.recentRecords = records.map((r) => ({
        id: r.id,
        visitDate: r.visitDate.toISOString().split('T')[0],
        symptoms: r.symptoms,
        diagnosis: r.diagnosis,
        disease: r.disease,
        systolicBp: r.systolicBp,
        diastolicBp: r.diastolicBp,
        glucose: r.glucose,
        doctorName: r.doctor?.user?.name,
      }));

      const episodes = await prisma.diseaseEpisode.findMany({
        where: { patientId },
        orderBy: { startDate: 'desc' },
        take: 4,
      });
      context.diseaseEpisodes = episodes.map((e) => ({
        id: e.id,
        disease: e.disease,
        status: e.status,
        startDate: e.startDate.toISOString().split('T')[0],
        summary: e.summary,
      }));
    }

    if (intent === 'RISK' || intent === 'GENERAL_SUMMARY') {
      const latestRecord = await prisma.medicalRecord.findFirst({
        where: { patientId },
        orderBy: { visitDate: 'desc' },
      });

      const vitals = {
        age,
        bmi: latestRecord?.bmi || 24.5,
        systolic: latestRecord?.systolicBp || 120,
        diastolic: latestRecord?.diastolicBp || 80,
        glucose: latestRecord?.glucose || 95,
        familyHistoryFlag: patient.familyMembers.some((f) => f.condition && f.condition.toLowerCase() !== 'none') ? 1 : 0,
        chronicCount: patient.chronicConditions ? patient.chronicConditions.split(',').filter(Boolean).length : 0,
      };

      const mlRes = await predictRiskWithML({
        age,
        bmi: vitals.bmi,
        systolic_bp: vitals.systolic,
        diastolic_bp: vitals.diastolic,
        fasting_glucose: vitals.glucose,
        family_history_flag: vitals.familyHistoryFlag,
        chronic_conditions_count: vitals.chronicCount,
      });

      const explanation = generateRiskExplanation(
        mlRes.risk_level || 'MODERATE',
        mlRes.risk_score || 50,
        vitals,
        mlRes.feature_importances
      );

      context.riskPrediction = {
        riskLevel: mlRes.risk_level,
        riskScore: mlRes.risk_score,
        probabilities: mlRes.probabilities,
        summary: explanation.summary,
        contributingFactors: explanation.contributingFactors,
      };
    }

    if (patient.familyMembers && patient.familyMembers.length > 0) {
      context.familyHistory = patient.familyMembers.map((f) => ({
        id: f.id,
        relation: f.relation,
        condition: f.condition,
      }));
    }

    return context;
  },
};
