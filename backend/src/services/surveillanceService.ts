import prisma from '../config/prisma';
import { detectHotspotsWithML, forecastCasesWithML } from './mlClient';

// Contagious / notifiable diseases tracked for public surveillance
export const SURVEILLANCE_DISEASES = [
  'Malaria',
  'Dengue',
  'Typhoid',
  'COVID-19',
  'Cholera',
  'Viral Hepatitis',
  'Tuberculosis',
  'Pneumonia',
];

export async function processSurveillanceOnNewCase(record: {
  id?: string;
  disease: string;
  locationDistrict: string;
  lat: number;
  lng: number;
  patientId?: string;
  age?: number;
  gender?: string;
  severity: string;
  source?: string;
}) {
  const isTracked = SURVEILLANCE_DISEASES.some((d) => d.toLowerCase() === record.disease.toLowerCase());
  if (!isTracked) {
    return;
  }

  // 1. Determine age group
  let ageGroup = '18-45';
  if (record.age) {
    if (record.age < 18) ageGroup = '<18';
    else if (record.age <= 45) ageGroup = '18-45';
    else if (record.age <= 60) ageGroup = '46-60';
    else ageGroup = '60+';
  }

  // 2. Create DiseaseReport record
  await prisma.diseaseReport.create({
    data: {
      recordId: record.id || null,
      disease: record.disease,
      district: record.locationDistrict,
      lat: record.lat,
      lng: record.lng,
      ageGroup,
      gender: record.gender || 'UNKNOWN',
      severity: record.severity || 'MODERATE',
      source: record.source || 'CLINICAL_VISIT',
      reportDate: new Date(),
    },
  });

  // 3. Trigger asynchronous background surveillance evaluation
  runSurveillanceEvaluation(record.disease, record.locationDistrict).catch((err) => {
    console.error('[Surveillance Engine] Evaluation error:', err);
  });
}

export async function runSurveillanceEvaluation(disease: string, district: string) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Recent case counts
  const currentWeekCases = await prisma.diseaseReport.count({
    where: {
      disease: { equals: disease, mode: 'insensitive' },
      district: { equals: district, mode: 'insensitive' },
      reportDate: { gte: oneWeekAgo },
    },
  });

  const previousWeekCases = await prisma.diseaseReport.count({
    where: {
      disease: { equals: disease, mode: 'insensitive' },
      district: { equals: district, mode: 'insensitive' },
      reportDate: { gte: twoWeeksAgo, lt: oneWeekAgo },
    },
  });

  const totalCases = await prisma.diseaseReport.count({
    where: {
      disease: { equals: disease, mode: 'insensitive' },
      district: { equals: district, mode: 'insensitive' },
    },
  });

  // Calculate weekly growth rate %
  const growthRate = previousWeekCases > 0
    ? ((currentWeekCases - previousWeekCases) / previousWeekCases) * 100
    : (currentWeekCases > 0 ? 100 : 0);

  // Determine risk level based on configurable thresholds
  // High risk: >= 15 cases this week OR (>= 8 cases and growth >= 50%)
  // Warning: >= 6 cases this week OR (>= 3 cases and growth >= 30%)
  let riskLevel = 'NORMAL';
  if (currentWeekCases >= 15 || (currentWeekCases >= 8 && growthRate >= 50)) {
    riskLevel = 'HIGH_RISK';
  } else if (currentWeekCases >= 6 || (currentWeekCases >= 3 && growthRate >= 30)) {
    riskLevel = 'WARNING';
  }

  // Generate readable epidemiological AI insight
  let insight = `${disease} in ${district} shows normal baseline activity (${currentWeekCases} case(s) this week).`;
  let recommendedAction = 'Routine district surveillance monitoring.';

  if (riskLevel === 'HIGH_RISK') {
    insight = `CRITICAL ALERT: ${disease} cases in ${district} escalated to ${currentWeekCases} this week (Growth: +${growthRate.toFixed(0)}% vs previous week). Cluster density indicates active localized transmission.`;
    recommendedAction = `Immediate Public Health Intervention: Deploy vector control/sanitation units and organize a targeted Community ${disease} Screening Camp.`;
  } else if (riskLevel === 'WARNING') {
    insight = `SURVEILLANCE WARNING: Emerging cluster of ${disease} in ${district} with ${currentWeekCases} cases (Growth: +${growthRate.toFixed(0)}%). Early transmission signal detected.`;
    recommendedAction = `Increase community health awareness advisories and monitor clinical fever presentations.`;
  }

  // Upsert LocationRisk
  const locationRisk = await prisma.locationRisk.upsert({
    where: {
      district_disease: {
        district,
        disease,
      },
    },
    update: {
      totalCases,
      activeCases: currentWeekCases,
      weeklyGrowthRate: growthRate,
      riskLevel,
      aiInsight: insight,
      recommendedAction,
      lastEvaluatedAt: new Date(),
    },
    create: {
      district,
      disease,
      totalCases,
      activeCases: currentWeekCases,
      weeklyGrowthRate: growthRate,
      riskLevel,
      aiInsight: insight,
      recommendedAction,
      lastEvaluatedAt: new Date(),
    },
  });

  // If WARNING or HIGH_RISK, trigger Location-Based Community Alert & Patient Notifications
  if (riskLevel === 'HIGH_RISK' || riskLevel === 'WARNING') {
    await triggerLocationCommunityAlert(district, disease, riskLevel, currentWeekCases);
  }

  // If HIGH_RISK, automatically recommend a Community Health Camp
  if (riskLevel === 'HIGH_RISK') {
    await autoRecommendHealthCamp(district, disease, currentWeekCases);
  }

  return locationRisk;
}

async function triggerLocationCommunityAlert(district: string, disease: string, riskLevel: string, caseCount: number) {
  const isHighRisk = riskLevel === 'HIGH_RISK';
  const alertTitle = isHighRisk
    ? `🚨 High-Risk ${disease} Alert in ${district}`
    : `⚠️ Advisory: Elevated ${disease} Cases in ${district}`;

  const precautions = disease.toLowerCase().includes('malaria') || disease.toLowerCase().includes('dengue')
    ? 'Use mosquito repellents and bed nets. Eliminate stagnant water in open containers. Wear full-sleeve clothing. Seek immediate medical evaluation if high fever, chills, or severe headache develop.'
    : 'Maintain strict hand hygiene. Drink boiled or filtered water. Ensure food is cooked thoroughly. Consult a doctor immediately upon experiencing persistent fever, diarrhea, or dehydration.';

  const alertMessage = `${alertTitle}. Surveillance detected ${caseCount} cases in ${district} this week. Please follow recommended preventive precautions and consult an authorized clinic if symptoms appear.`;

  // 1. Create or update CommunityAlert
  const existingAlert = await prisma.communityAlert.findFirst({
    where: {
      district: { equals: district, mode: 'insensitive' },
      disease: { equals: disease, mode: 'insensitive' },
      isActive: true,
    },
  });

  if (!existingAlert) {
    await prisma.communityAlert.create({
      data: {
        district,
        disease,
        riskLevel,
        title: alertTitle,
        message: alertMessage,
        precautions,
        isActive: true,
      },
    });
  }

  // 2. Find all registered patients living in this district
  const residents = await prisma.patient.findMany({
    where: {
      district: { equals: district, mode: 'insensitive' },
    },
    include: { user: true },
  });

  // 3. Dispatch in-app notification to every resident in this district
  for (const resident of residents) {
    // Check if duplicate notification sent today
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        userId: resident.userId,
        relatedDisease: disease,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!alreadyNotified) {
      await prisma.notification.create({
        data: {
          userId: resident.userId,
          title: alertTitle,
          message: alertMessage,
          type: 'DISEASE_ALERT',
          priority: isHighRisk ? 'CRITICAL' : 'WARNING',
          district,
          relatedDisease: disease,
        },
      });
    }
  }
}

async function autoRecommendHealthCamp(district: string, disease: string, caseCount: number) {
  // Check if active or recommended camp already exists for this district & disease
  const existingCamp = await prisma.healthCamp.findFirst({
    where: {
      district: { equals: district, mode: 'insensitive' },
      targetDisease: { equals: disease, mode: 'insensitive' },
      status: { in: ['RECOMMENDED', 'APPROVED', 'IN_PROGRESS'] },
    },
  });

  if (!existingCamp) {
    const nextWeekDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    await prisma.healthCamp.create({
      data: {
        district,
        venue: `${district} Community Health & Civic Center`,
        targetDisease: disease,
        campDate: nextWeekDate,
        capacity: 250,
        doctorsAssigned: 'Dr. Sharma, Dr. Priya (Epidemiology Team)',
        status: 'RECOMMENDED',
        recommendationReason: `Auto-recommended due to HIGH_RISK outbreak of ${disease} (${caseCount} active cases). Rapid community screening and medication distribution required.`,
      },
    });
  }
}

// Global surveillance analytics aggregator
export async function getSurveillanceOverview() {
  const totalReports = await prisma.diseaseReport.count();
  const totalVisits = await prisma.medicalRecord.count();
  const totalPatients = await prisma.patient.count();
  const activeAlertsCount = await prisma.communityAlert.count({ where: { isActive: true } });
  const highRiskAreasCount = await prisma.locationRisk.count({ where: { riskLevel: 'HIGH_RISK' } });

  // Disease-wise counts
  const diseaseGroups = await prisma.diseaseReport.groupBy({
    by: ['disease'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  // District-wise counts
  const districtGroups = await prisma.diseaseReport.groupBy({
    by: ['district'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  // Age group breakdown
  const ageGroupBreakdown = await prisma.diseaseReport.groupBy({
    by: ['ageGroup'],
    _count: { id: true },
  });

  // Severity breakdown
  const severityBreakdown = await prisma.diseaseReport.groupBy({
    by: ['severity'],
    _count: { id: true },
  });

  // Location risks list
  const locationRisks = await prisma.locationRisk.findMany({
    orderBy: { activeCases: 'desc' },
  });

  return {
    summary: {
      totalDiseaseReports: totalReports,
      totalVisits,
      totalPatients,
      activeAlertsCount,
      highRiskAreasCount,
    },
    diseaseWise: diseaseGroups.map((g) => ({ disease: g.disease, count: g._count.id })),
    locationWise: districtGroups.map((g) => ({ district: g.district, count: g._count.id })),
    ageGroupWise: ageGroupBreakdown.map((g) => ({ ageGroup: g.ageGroup, count: g._count.id })),
    severityWise: severityBreakdown.map((g) => ({ severity: g.severity, count: g._count.id })),
    locationRisks,
  };
}
