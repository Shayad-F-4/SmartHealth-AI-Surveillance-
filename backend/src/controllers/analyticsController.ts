import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /surveillance/analytics
 * Comprehensive population-level public health analytics for the admin panel.
 * Returns aggregated epidemiological metrics, demographics, trend data, and KPIs.
 */
export async function getPopulationAnalytics(req: AuthRequest, res: Response) {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ── Core KPIs ──────────────────────────────────────────────────────────
    const [
      totalPatients,
      totalDiseaseReports,
      totalVisits,
      totalActiveCamps,
      activeAlerts,
      highRiskZones,
      thisWeekCases,
      lastWeekCases,
      last30DaysCases,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.diseaseReport.count(),
      prisma.medicalRecord.count(),
      prisma.healthCamp.count({ where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } } }),
      prisma.communityAlert.count({ where: { isActive: true } }),
      prisma.locationRisk.count({ where: { riskLevel: 'HIGH_RISK' } }),
      prisma.diseaseReport.count({ where: { reportDate: { gte: oneWeekAgo } } }),
      prisma.diseaseReport.count({ where: { reportDate: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.diseaseReport.count({ where: { reportDate: { gte: thirtyDaysAgo } } }),
    ]);

    const weeklyChange = lastWeekCases > 0
      ? ((thisWeekCases - lastWeekCases) / lastWeekCases) * 100
      : (thisWeekCases > 0 ? 100 : 0);

    // ── Disease-wise breakdown ─────────────────────────────────────────────
    const diseaseWise = await prisma.diseaseReport.groupBy({
      by: ['disease'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Disease week-over-week for each tracked disease
    const diseaseWiseWithTrends = await Promise.all(
      diseaseWise.map(async (dg) => {
        const [thisW, lastW] = await Promise.all([
          prisma.diseaseReport.count({ where: { disease: dg.disease, reportDate: { gte: oneWeekAgo } } }),
          prisma.diseaseReport.count({ where: { disease: dg.disease, reportDate: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
        ]);
        const growth = lastW > 0 ? ((thisW - lastW) / lastW) * 100 : (thisW > 0 ? 100 : 0);
        return {
          disease: dg.disease,
          totalCases: dg._count.id,
          thisWeek: thisW,
          lastWeek: lastW,
          weeklyGrowth: Math.round(growth),
          trend: growth > 15 ? 'INCREASING' : growth < -10 ? 'DECREASING' : 'STABLE',
        };
      })
    );

    // ── District-wise breakdown ────────────────────────────────────────────
    const districtWise = await prisma.diseaseReport.groupBy({
      by: ['district'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // ── Age group breakdown ────────────────────────────────────────────────
    const ageGroupBreakdown = await prisma.diseaseReport.groupBy({
      by: ['ageGroup'],
      _count: { id: true },
    });

    // ── Gender breakdown ───────────────────────────────────────────────────
    const genderBreakdown = await prisma.diseaseReport.groupBy({
      by: ['gender'],
      _count: { id: true },
    });

    // ── Severity breakdown ─────────────────────────────────────────────────
    const severityBreakdown = await prisma.diseaseReport.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    // ── Source breakdown (clinic vs camp screening) ────────────────────────
    const sourceBreakdown = await prisma.diseaseReport.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    // ── 8-week epidemic curve (weekly buckets) ────────────────────────────
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
    const recentReports = await prisma.diseaseReport.findMany({
      where: { reportDate: { gte: eightWeeksAgo } },
      select: { reportDate: true, disease: true },
    });

    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    const weeklyTotals: number[] = Array(8).fill(0);
    const startTime = eightWeeksAgo.getTime();

    recentReports.forEach((r) => {
      const diff = r.reportDate.getTime() - startTime;
      const weekIdx = Math.min(7, Math.max(0, Math.floor(diff / msInWeek)));
      weeklyTotals[weekIdx] += 1;
    });

    const epidemicCurveLabels = weeklyTotals.map((_, i) => {
      const weekStart = new Date(startTime + i * msInWeek);
      return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // ── Location Risk summary ──────────────────────────────────────────────
    const locationRisks = await prisma.locationRisk.findMany({
      orderBy: { weeklyGrowthRate: 'desc' },
      take: 10,
    });

    // ── Health camp stats ──────────────────────────────────────────────────
    const campStats = await prisma.healthCamp.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { screenedCount: true },
    });

    const totalScreened = campStats.reduce((acc, c) => acc + (c._sum.screenedCount || 0), 0);

    // ── Notification stats ─────────────────────────────────────────────────
    const alertsDispatched = await prisma.notification.count({
      where: { type: 'DISEASE_ALERT', createdAt: { gte: thirtyDaysAgo } },
    });

    // ── Top 5 hotspot districts (from location risks) ──────────────────────
    const topHotspotDistricts = locationRisks
      .filter((lr) => lr.riskLevel === 'HIGH_RISK' || lr.riskLevel === 'WARNING')
      .slice(0, 5)
      .map((lr) => ({
        district: lr.district,
        disease: lr.disease,
        activeCases: lr.activeCases,
        riskLevel: lr.riskLevel,
        weeklyGrowthRate: lr.weeklyGrowthRate,
      }));

    return res.json({
      kpis: {
        totalPatients,
        totalDiseaseReports,
        totalVisits,
        totalActiveCamps,
        activeAlerts,
        highRiskZones,
        thisWeekCases,
        lastWeekCases,
        weeklyChangePercent: Math.round(weeklyChange),
        last30DaysCases,
        totalScreened,
        alertsDispatched,
      },
      diseaseWise: diseaseWiseWithTrends,
      districtWise: districtWise.map((d) => ({ district: d.district, count: d._count.id })),
      ageGroupWise: ageGroupBreakdown.map((a) => ({ ageGroup: a.ageGroup, count: a._count.id })),
      genderWise: genderBreakdown.map((g) => ({ gender: g.gender, count: g._count.id })),
      severityWise: severityBreakdown.map((s) => ({ severity: s.severity, count: s._count.id })),
      sourceWise: sourceBreakdown.map((s) => ({ source: s.source, count: s._count.id })),
      epidemicCurve: {
        labels: epidemicCurveLabels,
        values: weeklyTotals,
      },
      locationRisks,
      topHotspotDistricts,
    });
  } catch (err: any) {
    console.error('[Analytics] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve population analytics.' });
  }
}
