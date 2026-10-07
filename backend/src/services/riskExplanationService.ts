export interface RiskExplanationFactor {
  factorName: string;
  category: 'VITALS' | 'DEMOGRAPHICS' | 'HEREDITARY' | 'COMORBIDITY';
  patientValue: string | number;
  thresholdOrReference: string;
  isHighRisk: boolean;
  modelImportanceWeight: number; // 0 to 1
  description: string;
}

export interface RiskSupportingEvidence {
  id: string;
  type: 'LAB_REPORT' | 'MEDICAL_RECORD' | 'FAMILY_MEMBER' | 'DISEASE_EPISODE';
  title: string;
  date: string;
  summary: string;
  status?: string;
  sourceId: string;
}

export interface RiskExplanationResult {
  summary: string;
  contributingFactors: RiskExplanationFactor[];
  supportingEvidence: RiskSupportingEvidence[];
  limitations: string[];
}

export function generateRiskExplanation(
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH',
  riskScore: number,
  vitals: {
    age: number;
    bmi: number;
    systolic: number;
    diastolic: number;
    glucose: number;
    familyHistoryFlag: number;
    chronicCount: number;
  },
  featureImportances?: Record<string, number>,
  patientRecords?: {
    labReports?: any[];
    medicalRecords?: any[];
    familyMembers?: any[];
  }
): RiskExplanationResult {
  const getImp = (key: string, def: number) => (featureImportances && featureImportances[key] !== undefined ? featureImportances[key] : def);

  const contributingFactors: RiskExplanationFactor[] = [];
  const supportingEvidence: RiskSupportingEvidence[] = [];

  // 1. Blood Pressure evaluation
  const isBpHigh = vitals.systolic >= 130 || vitals.diastolic >= 85;
  contributingFactors.push({
    factorName: 'Blood Pressure',
    category: 'VITALS',
    patientValue: `${vitals.systolic}/${vitals.diastolic} mmHg`,
    thresholdOrReference: '< 120/80 mmHg (Normal)',
    isHighRisk: isBpHigh,
    modelImportanceWeight: getImp('systolic_bp', 0.22),
    description: isBpHigh
      ? `Systolic (${vitals.systolic} mmHg) or Diastolic (${vitals.diastolic} mmHg) exceeds optimal targets.`
      : 'Blood pressure is within standard baseline limits.',
  });

  // 2. Glucose evaluation
  const isGlucoseHigh = vitals.glucose >= 100;
  contributingFactors.push({
    factorName: 'Fasting Blood Glucose',
    category: 'VITALS',
    patientValue: `${vitals.glucose} mg/dL`,
    thresholdOrReference: '70 - 99 mg/dL (Normal)',
    isHighRisk: isGlucoseHigh,
    modelImportanceWeight: getImp('fasting_glucose', 0.25),
    description: isGlucoseHigh
      ? `Fasting glycemia (${vitals.glucose} mg/dL) is above normal threshold (100 mg/dL).`
      : 'Fasting blood glucose is within normal glycemic limits.',
  });

  // 3. BMI evaluation
  const isBmiHigh = vitals.bmi >= 25.0;
  contributingFactors.push({
    factorName: 'Body Mass Index (BMI)',
    category: 'VITALS',
    patientValue: `${vitals.bmi}`,
    thresholdOrReference: '18.5 - 24.9 (Normal)',
    isHighRisk: isBmiHigh,
    modelImportanceWeight: getImp('bmi', 0.18),
    description: isBmiHigh
      ? `BMI (${vitals.bmi}) indicates overweight or obese category (>= 25.0).`
      : 'BMI is within normal weight range.',
  });

  // 4. Family History evaluation
  const isFamHigh = vitals.familyHistoryFlag === 1;
  contributingFactors.push({
    factorName: 'Hereditary Family History',
    category: 'HEREDITARY',
    patientValue: isFamHigh ? 'Documented' : 'None Reported',
    thresholdOrReference: 'No family history flag',
    isHighRisk: isFamHigh,
    modelImportanceWeight: getImp('family_history_flag', 0.15),
    description: isFamHigh
      ? 'Documented family history of chronic cardiovascular or metabolic conditions.'
      : 'No chronic family history flagged in medical record.',
  });

  // 5. Chronic Conditions evaluation
  const isChronicHigh = vitals.chronicCount > 0;
  contributingFactors.push({
    factorName: 'Chronic Conditions Count',
    category: 'COMORBIDITY',
    patientValue: `${vitals.chronicCount} condition(s)`,
    thresholdOrReference: '0 conditions',
    isHighRisk: isChronicHigh,
    modelImportanceWeight: getImp('chronic_conditions_count', 0.10),
    description: isChronicHigh
      ? `Patient has ${vitals.chronicCount} documented chronic condition(s).`
      : 'No active chronic comorbidity flags.',
  });

  // 6. Age evaluation
  const isAgeHigh = vitals.age >= 55;
  contributingFactors.push({
    factorName: 'Age Bracket',
    category: 'DEMOGRAPHICS',
    patientValue: `${vitals.age} years`,
    thresholdOrReference: '< 55 years',
    isHighRisk: isAgeHigh,
    modelImportanceWeight: getImp('age', 0.06),
    description: isAgeHigh
      ? `Age (${vitals.age} yrs) falls into an elevated clinical risk bracket.`
      : 'Age bracket carries lower baseline statistical weight.',
  });

  // Sort contributing factors by high risk first, then by model importance weight
  contributingFactors.sort((a, b) => {
    if (a.isHighRisk !== b.isHighRisk) return a.isHighRisk ? -1 : 1;
    return b.modelImportanceWeight - a.modelImportanceWeight;
  });

  // Link real supporting evidence from patient records
  if (patientRecords) {
    if (patientRecords.labReports && patientRecords.labReports.length > 0) {
      for (const lab of patientRecords.labReports.slice(0, 3)) {
        supportingEvidence.push({
          id: lab.id,
          type: 'LAB_REPORT',
          title: lab.testName,
          date: new Date(lab.reportDate).toISOString().split('T')[0],
          summary: `Measured ${lab.measuredValue} ${lab.unit} (${lab.isOutOfRange ? 'Abnormal' : 'Normal'}).`,
          status: lab.isOutOfRange ? 'ABNORMAL' : 'NORMAL',
          sourceId: lab.id,
        });
      }
    }

    if (patientRecords.medicalRecords && patientRecords.medicalRecords.length > 0) {
      for (const visit of patientRecords.medicalRecords.slice(0, 2)) {
        supportingEvidence.push({
          id: visit.id,
          type: 'MEDICAL_RECORD',
          title: visit.disease || visit.diagnosis || 'Clinical Consultation',
          date: new Date(visit.visitDate).toISOString().split('T')[0],
          summary: `Encounter recorded BP ${visit.systolicBp || vitals.systolic}/${visit.diastolicBp || vitals.diastolic} mmHg, Glucose ${visit.glucose || vitals.glucose} mg/dL.`,
          sourceId: visit.id,
        });
      }
    }

    if (patientRecords.familyMembers && patientRecords.familyMembers.length > 0) {
      const activeFamily = patientRecords.familyMembers.filter(
        (f: any) => f.condition && f.condition.toLowerCase() !== 'none'
      );
      for (const fam of activeFamily.slice(0, 2)) {
        supportingEvidence.push({
          id: fam.id,
          type: 'FAMILY_MEMBER',
          title: `Family History: ${fam.relation}`,
          date: new Date(fam.createdAt || Date.now()).toISOString().split('T')[0],
          summary: `Condition: ${fam.condition} (Diagnosed age ${fam.ageAtDiagnosis || 'N/A'}).`,
          sourceId: fam.id,
        });
      }
    }
  }

  // Construct structured summary text
  const highRiskCount = contributingFactors.filter((f) => f.isHighRisk).length;
  let summary = `Model predicted ${riskLevel} risk (${riskScore}%) based on ${contributingFactors.length} evaluated features. `;
  if (highRiskCount > 0) {
    summary += `${highRiskCount} parameter(s) exceed normal clinical thresholds, primary drivers being ${contributingFactors[0].factorName} and ${contributingFactors[1]?.factorName || 'vitals'}.`;
  } else {
    summary += `All evaluated physiological vitals and biometric parameters are currently within normal limits.`;
  }

  const limitations = [
    'This risk score is generated by a Machine Learning model (RandomForest) for decision-support and is not a medical diagnosis.',
    'Risk calculations reflect evaluated vitals and self-reported medical history; clinical context and physician judgement supersede model outputs.',
    'Predictions do not guarantee disease presence or absence; regular clinical checkups are recommended.',
  ];

  return {
    summary,
    contributingFactors,
    supportingEvidence,
    limitations,
  };
}
