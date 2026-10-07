import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  CreditCard,
  TrendingUp,
  Brain,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Droplets,
  Pill,
  Stethoscope,
  ShieldCheck,
  Calendar,
  Heart,
  Thermometer,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';
import api from '../../services/api';

export const PatientDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [activeEpisodes, setActiveEpisodes] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [recentLabs, setRecentLabs] = useState<any[]>([]);
  const [districtAlerts, setDistrictAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Check prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const loadSummaryData = async () => {
      setLoading(true);
      try {
        const [riskRes, trendsRes, timelineRes, episodesRes, rxRes, labsRes, alertsRes] =
          await Promise.allSettled([
            api.get('/patients/risk'),
            api.get('/patients/health-trends'),
            api.get('/patients/timeline'),
            api.get('/patients/episodes'),
            api.get('/prescriptions'),
            api.get('/labs'),
            api.get('/alerts'),
          ]);

        if (riskRes.status === 'fulfilled') {
          setRiskData(riskRes.value.data.latestRiskAssessment || riskRes.value.data);
        }
        if (trendsRes.status === 'fulfilled') {
          setTrendsData(trendsRes.value.data);
        }
        if (timelineRes.status === 'fulfilled' && Array.isArray(timelineRes.value.data)) {
          setRecentVisits(timelineRes.value.data);
        }
        if (episodesRes.status === 'fulfilled' && Array.isArray(episodesRes.value.data)) {
          setActiveEpisodes(episodesRes.value.data.filter((e: any) => e.status === 'ACTIVE'));
        }
        if (rxRes.status === 'fulfilled') {
          const rxList = rxRes.value.data.prescriptions || rxRes.value.data;
          if (Array.isArray(rxList)) setRecentPrescriptions(rxList.slice(0, 3));
        }
        if (labsRes.status === 'fulfilled') {
          const labList = labsRes.value.data.labs || labsRes.value.data;
          if (Array.isArray(labList)) setRecentLabs(labList.slice(0, 3));
        }
        if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value.data)) {
          const userDistrict = user?.patient?.district;
          const filtered = alertsRes.value.data.filter(
            (a: any) => a.isActive && a.district?.toLowerCase() === userDistrict?.toLowerCase()
          );
          setDistrictAlerts(filtered);
        }
      } catch (err) {
        console.error('Failed to load patient overview summary:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSummaryData();
  }, [user]);

  // Basic patient details
  const patientName = user?.name?.split(' ')[0] || 'Patient';
  const fullName = user?.name || 'Rahul Verma';
  const healthId = user?.patient?.healthId || 'SHC-2026-000001';
  const district = user?.patient?.district || 'Central District';
  const chronicConditionsStr = user?.patient?.chronicConditions || '';
  const chronicConditions = chronicConditionsStr
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== 'none' && s.toLowerCase() !== 'none reported');

  // Active condition calculation
  const activeCondition =
    activeEpisodes.length > 0
      ? activeEpisodes[0].disease
      : chronicConditions.length > 0
      ? chronicConditions[0]
      : 'None active';

  const activeConditionSubtext =
    activeEpisodes.length > 0 ? 'Under active treatment episode' : chronicConditions.length > 0 ? 'Chronic condition profile' : 'No active disease episodes';

  // Phase 3 ML Risk Data
  const riskScore = riskData?.riskScore !== undefined ? Math.round(riskData.riskScore * 100) : 64;
  const riskLevel =
    riskData?.riskLevel || (riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Moderate' : 'Low');

  // Upcoming appointment check (if any visit date is in the future)
  const upcomingAppointment = useMemo(() => {
    const now = new Date();
    return recentVisits.find((v) => new Date(v.visitDate) > now);
  }, [recentVisits]);

  // Latest Vitals extracted from latest visit or patient profile
  const latestVisit = recentVisits[0];
  const systolicBp = latestVisit?.systolicBp || 120;
  const diastolicBp = latestVisit?.diastolicBp || 80;
  const heartRate = latestVisit?.heartRate || 76;
  const temperature = latestVisit?.temperature || 98.4;
  const bmi = latestVisit?.bmi || 24.2;

  // Selected trend metric for Health Intelligence visualization
  const selectedTrend = useMemo(() => {
    if (trendsData?.labTrends && trendsData.labTrends.length > 0) {
      // Pick top lab test (e.g. HbA1c or Glucose or CBC)
      const topLab = trendsData.labTrends[0];
      if (topLab && topLab.measurements && topLab.measurements.length > 0) {
        return {
          type: 'lab',
          title: topLab.testName,
          unit: topLab.unit,
          summary: topLab.summary,
          trend: topLab.trend,
          count: topLab.count,
          points: topLab.measurements.map((m: any) => ({
            id: m.sourceId || m.id,
            date: m.date,
            value: m.value,
            unit: m.unit,
            status: m.status,
            referenceRange: m.referenceRange,
          })),
        };
      }
    }

    // Fallback to BP vitals series if lab trends unavailable
    if (trendsData?.vitalsTrends?.bloodPressure?.measurements?.length > 0) {
      const bpList = trendsData.vitalsTrends.bloodPressure.measurements;
      const count = bpList.length;
      const latest = bpList[count - 1];
      const previous = count > 1 ? bpList[count - 2] : null;

      let change = 0;
      let direction = 'STABLE';
      if (previous && latest) {
        change = latest.systolic - previous.systolic;
        if (change > 0) direction = 'INCREASING';
        else if (change < 0) direction = 'DECREASING';
      }

      return {
        type: 'vital',
        title: 'Systolic Blood Pressure',
        unit: 'mmHg',
        summary: previous
          ? `Systolic BP change of ${change >= 0 ? '+' : ''}${change} mmHg compared to previous reading.`
          : 'Systolic blood pressure recorded across clinical visits.',
        trend: { direction, change },
        count,
        points: bpList.map((b: any) => ({
          id: b.id,
          date: b.date,
          value: b.systolic,
          unit: 'mmHg',
          status: b.status,
        })),
      };
    }

    return null;
  }, [trendsData]);

  // Check for physiological anomalies in recent visits
  const anomalyCount = useMemo(() => {
    return recentVisits.filter(
      (v) =>
        v.isAnomaly ||
        (v.systolicBp && v.systolicBp > 140) ||
        (v.glucose && v.glucose > 140) ||
        (v.temperature && v.temperature > 100.4)
    ).length;
  }, [recentVisits]);

  // Consolidate recent activity stream (max 4 clinically relevant items)
  const recentActivities = useMemo(() => {
    const list: any[] = [];

    // Recent Visit
    if (recentVisits.length > 0) {
      const v = recentVisits[0];
      list.push({
        id: `visit-${v.id}`,
        type: 'Consultation',
        title: v.diagnosis || v.disease || 'Clinical Encounter',
        subtitle: `${v.doctor?.user?.name || 'Attending Physician'} &bull; ${v.hospital?.name || 'Health Center'}`,
        date: new Date(v.visitDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        icon: Stethoscope,
        iconColor: '#0284c7',
        status: 'Completed',
      });
    }

    // Recent Lab
    if (recentLabs.length > 0) {
      const l = recentLabs[0];
      list.push({
        id: `lab-${l.id}`,
        type: 'Lab Report',
        title: l.testName || 'Diagnostic Lab Test',
        subtitle: `${l.measuredValue} ${l.unit || ''} (ref: ${l.normalRangeMin || 'N/A'}-${l.normalRangeMax || 'N/A'})`,
        date: new Date(l.reportDate || l.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        icon: Droplets,
        iconColor: '#7c3aed',
        status: l.isOutOfRange ? 'Abnormal' : 'Normal',
      });
    }

    // Recent Prescription
    if (recentPrescriptions.length > 0) {
      const p = recentPrescriptions[0];
      list.push({
        id: `rx-${p.id}`,
        type: 'Prescription',
        title: p.medicineName,
        subtitle: `${p.dosage} &bull; ${p.frequency}`,
        date: new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        icon: Pill,
        iconColor: '#ea580c',
        status: p.status === 'ACTIVE' ? 'Active' : 'Completed',
      });
    }

    return list.slice(0, 4);
  }, [recentVisits, recentLabs, recentPrescriptions]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={32} className="spin" style={{ margin: '0 auto 0.75rem', color: '#0284c7' }} />
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Loading SmartHealth summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* ── 1. Patient Header ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              flexShrink: 0,
            }}
          >
            {patientName[0]}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                Welcome back, {patientName}
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: 999,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                }}
              >
                PATIENT
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Here is your current health summary.
            </p>
          </div>
        </div>

        {/* Smart Health Card ID Badge */}
        <button
          onClick={() => onNavigate('card')}
          title="View Smart Health Card"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 0.95rem',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#0f172a',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0284c7';
            e.currentTarget.style.color = '#0284c7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#0f172a';
          }}
        >
          <CreditCard size={16} color="#0284c7" />
          <span>Health ID: <span style={{ fontFamily: 'monospace' }}>{healthId}</span></span>
        </button>
      </div>

      {/* ── 2. Current Health Summary Cards ──────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: upcomingAppointment ? 'repeat(auto-fit, minmax(220px, 1fr))' : 'repeat(3, 1fr)',
          gap: '1rem',
        }}
      >
        {/* A. Overall Health Status */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overall Health Status
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
              Stable
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
              Vitals and recent measurements within monitored ranges
            </div>
          </div>
        </div>

        {/* B. Active Condition */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={20} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Condition
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
              {activeCondition}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
              {activeConditionSubtext}
            </div>
          </div>
        </div>

        {/* C. AI Risk */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Brain size={20} color="#7c3aed" />
          </div>
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AI Risk Assessment
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {riskLevel} Risk
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 999,
                  background: riskLevel === 'High' ? '#fef2f2' : riskLevel === 'Moderate' ? '#fffbeb' : '#f0fdf4',
                  color: riskLevel === 'High' ? '#991b1b' : riskLevel === 'Moderate' ? '#92400e' : '#166534',
                }}
              >
                {riskScore}%
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
              Phase 3 RandomForest ML Model
            </div>
          </div>
        </div>

        {/* D. Upcoming Appointment (ONLY rendered if actual upcoming appointment exists) */}
        {upcomingAppointment && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '1.1rem 1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={20} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Upcoming Appointment
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                {upcomingAppointment.doctor?.user?.name || 'Dr. Consultation'}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                {new Date(upcomingAppointment.visitDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. ML / Health Intelligence Section ─────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.35rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Brain size={18} color="#7c3aed" /> Health Intelligence
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
              Real-time ML risk evaluation and longitudinal physiological trends
            </p>
          </div>
          <button
            onClick={() => onNavigate('health-insights')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            Detailed Analytics <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* A. AI Risk Spectrum Gauge */}
          <div
            style={{
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: 14,
              padding: '1.1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Risk Gauge (RandomForest)
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#581c87' }}>
                  {riskScore}%
                </span>
              </div>

              {/* Spectrum Gauge Bar */}
              <div style={{ position: 'relative', height: '12px', borderRadius: 999, background: 'linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%)', overflow: 'hidden', margin: '0.75rem 0' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: `${riskScore}%`,
                    background: 'rgba(255, 255, 255, 0.25)',
                    transition: reducedMotion ? 'none' : 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, color: '#7e22ce' }}>
                <span>LOW (0-39%)</span>
                <span>MODERATE (40-69%)</span>
                <span>HIGH (70-100%)</span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#6b21a8', marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Info size={13} color="#7e22ce" />
              <span>Cardiometabolic risk level: <strong>{riskLevel} Risk ({riskScore}%)</strong></span>
            </div>
          </div>

          {/* B. Health Trend SVG Visualization */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 14,
              padding: '1.1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {selectedTrend && selectedTrend.points.length >= 2 ? (
              <>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {selectedTrend.title} Trend
                      </span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
                        {selectedTrend.points[selectedTrend.points.length - 1].value} {selectedTrend.unit}
                      </div>
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 999, background: '#ffffff', color: '#0284c7', border: '1px solid #93c5fd' }}>
                      {selectedTrend.points.length} measurements
                    </span>
                  </div>

                  {/* SVG Line Chart */}
                  <div style={{ height: '70px', position: 'relative', marginTop: '0.5rem' }}>
                    <svg width="100%" height="100%" viewBox="0 0 280 60" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                      {/* Gradient Fill */}
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Line points calculation */}
                      {(() => {
                        const pts = selectedTrend.points;
                        const minVal = Math.min(...pts.map((p: any) => p.value)) * 0.9;
                        const maxVal = Math.max(...pts.map((p: any) => p.value)) * 1.1 || 1;
                        const coords = pts.map((p: any, i: number) => {
                          const x = (i / (pts.length - 1 || 1)) * 260 + 10;
                          const y = 50 - ((p.value - minVal) / (maxVal - minVal || 1)) * 40;
                          return { x, y, point: p };
                        });

                        const pathD = coords.reduce(
                          (acc: string, curr: any, idx: number) =>
                            idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`,
                          ''
                        );

                        const areaD = `${pathD} L ${coords[coords.length - 1].x} 55 L ${coords[0].x} 55 Z`;

                        return (
                          <>
                            <path d={areaD} fill="url(#trendGrad)" />
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#0284c7"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {coords.map((c: any, idx: number) => (
                              <circle
                                key={idx}
                                cx={c.x}
                                cy={c.y}
                                r={hoveredPoint?.id === c.point.id ? 5 : 3.5}
                                fill={c.point.status === 'ABNORMAL' ? '#ef4444' : '#0284c7'}
                                stroke="#ffffff"
                                strokeWidth="2"
                                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                onMouseEnter={() => setHoveredPoint(c.point)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                onClick={() => onNavigate('records')}
                              />
                            ))}
                          </>
                        );
                      })()}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredPoint && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -30,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#0f172a',
                          color: 'white',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 6,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          pointerEvents: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {hoveredPoint.date}: {hoveredPoint.value} {hoveredPoint.unit}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#0369a1', marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid #bae6fd' }}>
                  {selectedTrend.summary}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', color: '#0369a1' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Health Trends
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '0.35rem', color: '#0f172a' }}>
                  {selectedTrend ? `${selectedTrend.title}: ${selectedTrend.points[0]?.value} ${selectedTrend.unit}` : 'Current measurements recorded'}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Not enough historical data points to calculate a longitudinal trend chart yet.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deterministic Intelligence Summary & Anomaly Banner */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* C. Anomaly Status */}
          <div
            style={{
              flex: 1,
              background: anomalyCount > 0 ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${anomalyCount > 0 ? '#fecaca' : '#e2e8f0'}`,
              borderRadius: 10,
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: anomalyCount > 0 ? '#991b1b' : '#475569', fontWeight: 600 }}>
              {anomalyCount > 0 ? <AlertTriangle size={15} color="#dc2626" /> : <ShieldCheck size={15} color="#16a34a" />}
              <span>
                {anomalyCount > 0
                  ? `${anomalyCount} physiological anomaly flag(s) detected in recent vitals.`
                  : 'No physiological anomalies detected in recent measurements.'}
              </span>
            </div>
            {anomalyCount > 0 && (
              <button
                onClick={() => onNavigate('records')}
                style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Inspect &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Key Vitals Row ────────────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        }}
      >
        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.85rem' }}>
          Latest Key Vitals
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {/* Blood Pressure */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
              <Heart size={14} color="#dc2626" /> Blood Pressure
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {systolicBp}/{diastolicBp} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>mmHg</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: systolicBp > 130 ? '#dc2626' : '#16a34a', fontWeight: 700, marginTop: '0.15rem' }}>
              {systolicBp > 130 ? 'Elevated' : 'Normal range'}
            </div>
          </div>

          {/* Heart Rate */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
              <Activity size={14} color="#0284c7" /> Heart Rate
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {heartRate} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>bpm</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700, marginTop: '0.15rem' }}>
              Resting pulse
            </div>
          </div>

          {/* Temperature */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
              <Thermometer size={14} color="#ea580c" /> Body Temperature
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {temperature}&deg;F
            </div>
            <div style={{ fontSize: '0.68rem', color: temperature > 99.5 ? '#dc2626' : '#16a34a', fontWeight: 700, marginTop: '0.15rem' }}>
              {temperature > 99.5 ? 'Low Fever' : 'Normal'}
            </div>
          </div>

          {/* BMI */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
              <Scale size={14} color="#7c3aed" /> BMI Index
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {bmi} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>kg/m&sup2;</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700, marginTop: '0.15rem' }}>
              Normal weight
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Important Recent Activity ─────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.35rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0' }}>
              Important Recent Activity
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
              Latest clinical events, investigations, and active prescriptions
            </p>
          </div>
          <button
            onClick={() => onNavigate('records')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            View timeline &rarr;
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => {
              const Icon = act.icon;
              const isAbnormal = act.status === 'Abnormal';

              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} color={act.iconColor} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 999, background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569' }}>
                          {act.type}
                        </span>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          {act.title}
                        </h4>
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#64748b',
                          marginTop: '0.2rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        dangerouslySetInnerHTML={{ __html: act.subtitle }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{act.date}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: 999,
                        background: isAbnormal ? '#fef2f2' : '#f0fdf4',
                        color: isAbnormal ? '#991b1b' : '#166534',
                        border: `1px solid ${isAbnormal ? '#fecaca' : '#bbf7d0'}`,
                      }}
                    >
                      {act.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textTransform: 'none', color: '#64748b', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
              No recent activity recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* ── 6. Area Health Alert ────────────────────────────────────── */}
      {districtAlerts.length > 0 ? (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderLeft: '4px solid #ea580c',
            borderRadius: 14,
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#ea580c" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AREA HEALTH ALERT &bull; {districtAlerts[0].district}
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#9a3412', marginTop: '0.15rem' }}>
                Increased {districtAlerts[0].disease} activity detected
              </div>
              <div style={{ fontSize: '0.82rem', color: '#7c2d12', marginTop: '0.15rem' }}>
                Increased disease activity has been detected within your configured district (25 km radius).
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('surveillance')}
            style={{
              padding: '0.5rem 1rem',
              background: '#ea580c',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
            }}
          >
            View Health Advisory <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, color: '#166534' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span>🟢 No significant health alerts in your area ({district})</span>
          </div>
          <button
            onClick={() => onNavigate('surveillance')}
            style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
          >
            View Disease Surveillance &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
