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
  Info,
  X,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../services/api';
import { BpTrendChart, GlucoseTrendChart, GenericLabTrendChart } from '../../components/HealthCharts';

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
  const [error, setError] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Motion preference detection
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const loadSummaryData = async () => {
    setLoading(true);
    setError(null);
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
        if (Array.isArray(rxList)) setRecentPrescriptions(rxList);
      }
      if (labsRes.status === 'fulfilled') {
        const labList = labsRes.value.data.labs || labsRes.value.data;
        if (Array.isArray(labList)) setRecentLabs(labList);
      }
      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value.data)) {
        const userDistrict = user?.patient?.district;
        const filtered = alertsRes.value.data.filter(
          (a: any) => a.isActive && a.district?.toLowerCase() === userDistrict?.toLowerCase()
        );
        setDistrictAlerts(filtered);
      }
    } catch (err: any) {
      console.error('Failed to load patient overview data:', err);
      setError('Unable to load some health information. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, [user]);

  // Extract patient display details
  const patientName = user?.name?.split(' ')[0] || 'Patient';
  const fullName = user?.name || 'Rahul Verma';
  const healthId = user?.patient?.healthId || 'SHC-2026-000001';
  const district = user?.patient?.district || 'Central District';
  const currentAvatarUrl = user?.avatarUrl
    ? user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `http://localhost:5000${user.avatarUrl}`
    : null;

  const chronicConditionsStr = user?.patient?.chronicConditions || '';
  const chronicConditions = chronicConditionsStr
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => s && s.toLowerCase() !== 'none' && s.toLowerCase() !== 'none reported');

  // 1. Active Condition Calculation
  const activeCondition =
    activeEpisodes.length > 0
      ? activeEpisodes[0].disease
      : chronicConditions.length > 0
      ? chronicConditions[0]
      : 'No active condition';

  const activeConditionSubtext =
    activeEpisodes.length > 0
      ? 'Under active treatment episode'
      : chronicConditions.length > 0
      ? 'Chronic condition profile monitored'
      : 'No active disease episodes recorded';

  // 2. Real AI Risk Assessment Data
  const rawRiskScore = riskData?.prediction?.riskScore ?? riskData?.riskScore ?? riskData?.risk_score ?? 64;
  const riskScore = typeof rawRiskScore === 'number' ? Math.round(rawRiskScore > 1 ? rawRiskScore : rawRiskScore * 100) : 64;
  
  const rawRiskCategory = (riskData?.prediction?.riskLevel || riskData?.riskLevel || riskData?.risk_level || '').toUpperCase();
  const riskCategory: 'LOW' | 'MODERATE' | 'HIGH' =
    rawRiskCategory === 'HIGH' || riskScore >= 70
      ? 'HIGH'
      : rawRiskCategory === 'MODERATE' || riskScore >= 40
      ? 'MODERATE'
      : 'LOW';

  const riskLabelText = riskCategory === 'HIGH' ? 'High Risk' : riskCategory === 'MODERATE' ? 'Moderate Risk' : 'Low Risk';

  // 3. Overall Health Status Calculation
  const outOfRangeLabsCount = recentLabs.filter((l) => l.isOutOfRange).length;
  const overallHealthStatus =
    activeEpisodes.length > 0 || outOfRangeLabsCount > 1
      ? 'Watch'
      : riskCategory === 'HIGH'
      ? 'Action Needed'
      : 'Stable';

  const overallHealthSubtext =
    overallHealthStatus === 'Stable'
      ? 'Vitals and recent measurements are within monitored ranges.'
      : overallHealthStatus === 'Watch'
      ? 'Active condition or out-of-range lab result being monitored.'
      : 'Clinical follow-up recommended based on elevated risk indicators.';

  // 4. Extract Selected Trend Metric (Dynamic)
  const selectedTrend = useMemo(() => {
    if (trendsData?.labTrends && trendsData.labTrends.length > 0) {
      const topLab = trendsData.labTrends[0];
      if (topLab && topLab.measurements && topLab.measurements.length > 0) {
        const pts = topLab.measurements;
        const latest = pts[pts.length - 1];
        const previous = pts.length > 1 ? pts[pts.length - 2] : null;

        let trendDir: '↑ Increasing' | '↓ Decreasing' | '→ Stable' | '↕ Fluctuating' = '→ Stable';
        let changeVal = 0;
        let changePct = 0;

        if (previous && latest) {
          changeVal = Math.round((latest.value - previous.value) * 100) / 100;
          if (previous.value !== 0) {
            changePct = Math.round(((latest.value - previous.value) / previous.value) * 100);
          }
          if (changeVal > 0) trendDir = '↑ Increasing';
          else if (changeVal < 0) trendDir = '↓ Decreasing';
        }

        return {
          title: topLab.testName,
          unit: topLab.unit || '',
          latestValue: latest.value,
          previousValue: previous ? previous.value : null,
          changeVal,
          changePct,
          trendDirection: trendDir,
          lastUpdated: latest.date,
          points: pts,
        };
      }
    }

    if (trendsData?.vitalsTrends?.bloodPressure?.measurements?.length > 0) {
      const pts = trendsData.vitalsTrends.bloodPressure.measurements;
      const latest = pts[pts.length - 1];
      const previous = pts.length > 1 ? pts[pts.length - 2] : null;

      let trendDir: '↑ Increasing' | '↓ Decreasing' | '→ Stable' | '↕ Fluctuating' = '→ Stable';
      let changeVal = 0;
      if (previous && latest) {
        changeVal = latest.systolic - previous.systolic;
        if (changeVal > 0) trendDir = '↑ Increasing';
        else if (changeVal < 0) trendDir = '↓ Decreasing';
      }

      return {
        title: 'Systolic Blood Pressure',
        unit: 'mmHg',
        latestValue: latest.systolic,
        previousValue: previous ? previous.systolic : null,
        changeVal,
        changePct: previous ? Math.round((changeVal / previous.systolic) * 100) : 0,
        trendDirection: trendDir,
        lastUpdated: latest.date,
        points: pts.map((b: any) => ({ ...b, value: b.systolic, unit: 'mmHg' })),
      };
    }

    return null;
  }, [trendsData]);

  // 5. Consolidate Important Health Alerts (Real Data Only)
  const healthAlerts = useMemo(() => {
    const list: Array<{ id: string; title: string; explanation: string; date: string; severity: 'INFO' | 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT'; icon: any }> = [];

    // District Surveillance Alert
    if (districtAlerts.length > 0) {
      const a = districtAlerts[0];
      list.push({
        id: `dist-alert-${a.id}`,
        title: `Disease Surveillance Alert: ${a.disease}`,
        explanation: a.title || `Increased ${a.disease} activity reported in ${a.district} (25 km radius).`,
        date: new Date(a.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        severity: a.severity === 'HIGH' || a.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
        icon: AlertTriangle,
      });
    }

    // Out of Range Lab Alert
    const abnormalLab = recentLabs.find((l) => l.isOutOfRange);
    if (abnormalLab) {
      list.push({
        id: `lab-alert-${abnormalLab.id}`,
        title: `Lab Result Out of Reference Range`,
        explanation: `${abnormalLab.testName}: ${abnormalLab.measuredValue} ${abnormalLab.unit || ''} (ref: ${abnormalLab.normalRangeMin || '0'}-${abnormalLab.normalRangeMax || 'N/A'}).`,
        date: new Date(abnormalLab.reportDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        severity: 'MODERATE',
        icon: Droplets,
      });
    }

    // Active Disease Episode Alert
    if (activeEpisodes.length > 0) {
      const ep = activeEpisodes[0];
      list.push({
        id: `ep-alert-${ep.id}`,
        title: `Active Clinical Episode: ${ep.disease}`,
        explanation: `Under active treatment & monitoring cycle. Follow prescribed medication schedule.`,
        date: new Date(ep.startDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        severity: 'MODERATE',
        icon: Activity,
      });
    }

    return list;
  }, [districtAlerts, recentLabs, activeEpisodes]);

  // 6. Recent Health Activity Stream (Timeline)
  const recentActivities = useMemo(() => {
    const list: Array<{ id: string; type: string; title: string; date: string; icon: any; iconColor: string; linkTab: string }> = [];

    if (recentVisits.length > 0) {
      const v = recentVisits[0];
      list.push({
        id: `visit-${v.id}`,
        type: 'Consultation Completed',
        title: `${v.diagnosis || v.disease || 'Clinical Encounter'} — ${v.doctor?.user?.name || 'Attending Physician'}`,
        date: new Date(v.visitDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        icon: Stethoscope,
        iconColor: '#0284c7',
        linkTab: 'records',
      });
    }

    if (recentLabs.length > 0) {
      const l = recentLabs[0];
      list.push({
        id: `lab-${l.id}`,
        type: 'Lab Report Uploaded',
        title: `${l.testName} — ${l.measuredValue} ${l.unit || ''}`,
        date: new Date(l.reportDate || l.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        icon: Droplets,
        iconColor: '#7c3aed',
        linkTab: 'records',
      });
    }

    if (recentPrescriptions.length > 0) {
      const p = recentPrescriptions[0];
      list.push({
        id: `rx-${p.id}`,
        type: 'Prescription Added',
        title: `${p.medicineName} (${p.dosage} - ${p.frequency})`,
        date: new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        icon: Pill,
        iconColor: '#ea580c',
        linkTab: 'records',
      });
    }

    return list.slice(0, 4);
  }, [recentVisits, recentLabs, recentPrescriptions]);

  // 7. Active Medications list
  const activeMedications = useMemo(() => {
    return recentPrescriptions.filter((p) => p.status === 'ACTIVE' || !p.status);
  }, [recentPrescriptions]);

  // 8. Upcoming Care Check
  const upcomingCare = useMemo(() => {
    const now = new Date();
    return recentVisits.find((v) => new Date(v.visitDate) > now);
  }, [recentVisits]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1140, margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Skeleton Welcome Card */}
        <div style={{ height: 90, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0' }} />
            <div>
              <div style={{ width: 200, height: 18, background: '#e2e8f0', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 140, height: 12, background: '#f1f5f9', borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ width: 150, height: 36, background: '#e2e8f0', borderRadius: 10 }} />
        </div>

        {/* Skeleton Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 120, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.25rem' }}>
              <div style={{ width: 120, height: 12, background: '#e2e8f0', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: 90, height: 24, background: '#e2e8f0', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 180, height: 12, background: '#f1f5f9', borderRadius: 4 }} />
            </div>
          ))}
        </div>

        {/* Skeleton Health Intelligence */}
        <div style={{ height: 260, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ width: 180, height: 18, background: '#e2e8f0', borderRadius: 6, marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ height: 160, background: '#f8fafc', borderRadius: 12 }} />
            <div style={{ height: 160, background: '#f8fafc', borderRadius: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1140, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Error Retry Banner */}
      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 14, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#be123c', fontSize: '0.82rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} color="#be123c" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadSummaryData}
            style={{ background: '#be123c', color: 'white', border: 'none', borderRadius: 8, padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* ── 1. WELCOME HEADER (Compact) ─────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.15rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Avatar */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={patientName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'RV'
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                Welcome back, {patientName} 👋
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
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
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0 0', fontWeight: 500 }}>
              Here is your current health summary.
            </p>
          </div>
        </div>

        {/* Smart Health Card ID Link */}
        <button
          onClick={() => onNavigate('card')}
          title="View Smart Health Card"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.9rem',
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
          <span>Health ID: <strong style={{ fontFamily: 'monospace' }}>{healthId}</strong></span>
        </button>
      </div>

      {/* ── 2. KEY HEALTH SUMMARY (3 Primary Cards) ──────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* CARD 1 — OVERALL HEALTH STATUS */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem 1.35rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: overallHealthStatus === 'Stable' ? '#ecfdf5' : overallHealthStatus === 'Watch' ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${overallHealthStatus === 'Stable' ? '#a7f3d0' : overallHealthStatus === 'Watch' ? '#fde68a' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {overallHealthStatus === 'Stable' ? (
              <CheckCircle2 size={22} color="#059669" />
            ) : overallHealthStatus === 'Watch' ? (
              <AlertTriangle size={22} color="#d97706" />
            ) : (
              <ShieldAlert size={22} color="#dc2626" />
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overall Health Status
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{overallHealthStatus}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 999, background: overallHealthStatus === 'Stable' ? '#d1fae5' : '#fef3c7', color: overallHealthStatus === 'Stable' ? '#047857' : '#92400e' }}>
                Monitored
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
              {overallHealthSubtext}
            </p>
          </div>
        </div>

        {/* CARD 2 — ACTIVE CONDITION */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem 1.35rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Activity size={22} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Condition
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {activeCondition}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
              {activeConditionSubtext}
            </p>
          </div>
        </div>

        {/* CARD 3 — AI RISK ASSESSMENT */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem 1.35rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Brain size={22} color="#7c3aed" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AI Risk Assessment
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {riskLabelText}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: 999,
                  background: riskCategory === 'HIGH' ? '#fef2f2' : riskCategory === 'MODERATE' ? '#fffbeb' : '#ecfdf5',
                  color: riskCategory === 'HIGH' ? '#991b1b' : riskCategory === 'MODERATE' ? '#92400e' : '#047857',
                  border: `1px solid ${riskCategory === 'HIGH' ? '#fecaca' : riskCategory === 'MODERATE' ? '#fde68a' : '#a7f3d0'}`,
                }}
              >
                {riskScore}%
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
              Based on current clinical features
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. HEALTH INTELLIGENCE SECTION ─────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.35rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Brain size={18} color="#7c3aed" /> Health Intelligence
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              AI-assisted risk evaluation and longitudinal health trends
            </p>
          </div>
          <button
            onClick={() => onNavigate('health-insights')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            View Detailed Analytics <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* LEFT CARD — AI RISK ASSESSMENT */}
          <div
            style={{
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: 14,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Risk Assessment
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#581c87' }}>
                  {riskScore}%
                </span>
              </div>

              {/* Visual Horizontal Spectrum Gauge */}
              <div style={{ position: 'relative', height: '12px', borderRadius: 999, background: 'linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%)', overflow: 'hidden', margin: '0.85rem 0' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: `${riskScore}%`,
                    background: 'rgba(255, 255, 255, 0.3)',
                    transition: reducedMotion ? 'none' : 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#7e22ce' }}>
                <span>LOW (0–39%)</span>
                <span>MODERATE (40–69%)</span>
                <span>HIGH (70–100%)</span>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#581c87', marginTop: '1rem', fontWeight: 600 }}>
                Your current calculated risk is <strong>{riskLabelText} ({riskScore}%)</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowRiskModal(true)}
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e9d5ff',
                background: 'transparent',
                border: 'none',
                color: '#7e22ce',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              View Risk Factors <ArrowRight size={14} />
            </button>
          </div>

          {/* RIGHT CARD — HEALTH TREND */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 14,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {selectedTrend && selectedTrend.points.length >= 1 ? (
              <>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Health Trend: {selectedTrend.title}
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                        {selectedTrend.latestValue} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{selectedTrend.unit}</span>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.76rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: 999, background: '#ffffff', color: '#0284c7', border: '1px solid #93c5fd' }}>
                      {selectedTrend.trendDirection}
                    </span>
                  </div>

                  {/* Interactive Chart.js Visualization */}
                  <div style={{ marginTop: '0.75rem', background: '#ffffff', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e0f2fe', boxShadow: '0 1px 4px rgba(2, 132, 199, 0.05)' }}>
                    <GenericLabTrendChart
                      title={selectedTrend.title}
                      unit={selectedTrend.unit}
                      data={selectedTrend.points.map((p: any) => ({
                        date: p.date,
                        value: p.value,
                        status: p.status || (p.value > 100 ? 'ABNORMAL' : 'NORMAL'),
                      }))}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid #bae6fd', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Last updated: {new Date(selectedTrend.lastUpdated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <button
                    onClick={() => onNavigate('health-insights')}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    View Insights &rarr;
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', color: '#0369a1' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Health Trend
                </span>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginTop: '0.4rem' }}>
                  No sufficient historical measurements available
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Lab reports or vitals recorded during clinical visits will populate longitudinal trend charts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. IMPORTANT HEALTH ALERTS SECTION ──────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.35rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <AlertTriangle size={18} color="#ea580c" /> Important Health Alerts
        </h3>

        {healthAlerts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {healthAlerts.map((alert) => {
              const IconComp = alert.icon;
              const isUrgent = alert.severity === 'URGENT' || alert.severity === 'HIGH';

              return (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.15rem',
                    background: isUrgent ? '#fff7ed' : '#f8fafc',
                    border: `1px solid ${isUrgent ? '#fed7aa' : '#e2e8f0'}`,
                    borderLeft: `4px solid ${isUrgent ? '#ea580c' : '#0284c7'}`,
                    borderRadius: 12,
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComp size={18} color={isUrgent ? '#ea580c' : '#0284c7'} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 999, background: isUrgent ? '#ffedd5' : '#e0f2fe', color: isUrgent ? '#c2410c' : '#0369a1' }}>
                          {alert.severity}
                        </span>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          {alert.title}
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                        {alert.explanation}
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                    {alert.date}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 12,
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#047857',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#065f46' }}>You're all caught up!</strong>
              <span style={{ display: 'block', color: '#047857', fontSize: '0.78rem', marginTop: '0.1rem' }}>
                No important health alerts or clinical warnings at this time.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. RECENT HEALTH ACTIVITY (Timeline) ────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.35rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0' }}>
              Recent Health Activity
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              Timeline of recent clinical encounters, lab reports, and prescriptions
            </p>
          </div>
          <button
            onClick={() => onNavigate('records')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            View Medical Records <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => {
              const IconComponent = act.icon;

              return (
                <div
                  key={act.id}
                  onClick={() => onNavigate(act.linkTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.15rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={18} color={act.iconColor} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {act.type}
                      </div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {act.title}
                      </h4>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{act.date}</span>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
              No recent health activity recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* ── 6. CURRENT MEDICATIONS & UPCOMING CARE (2 Columns) ───────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* CURRENT MEDICATIONS CARD */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.35rem 1.5rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Pill size={18} color="#ea580c" /> Current Medications
            </h3>

            {activeMedications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {activeMedications.map((med) => (
                  <div
                    key={med.id}
                    style={{
                      padding: '0.75rem 0.95rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        {med.medicineName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {med.dosage} &bull; {med.frequency}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 999, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, padding: '0.75rem 0' }}>
                No active medications prescribed.
              </p>
            )}
          </div>

          <button
            onClick={() => onNavigate('records')}
            style={{
              marginTop: '1rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid #f1f5f9',
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            View All Prescriptions &rarr;
          </button>
        </div>

        {/* UPCOMING CARE CARD */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.35rem 1.5rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Calendar size={18} color="#0284c7" /> Upcoming Care
            </h3>

            {upcomingCare ? (
              <div style={{ padding: '0.85rem 1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Scheduled Consultation
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {upcomingCare.doctor?.user?.name || 'Dr. Attending Physician'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0369a1', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} /> {new Date(upcomingCare.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, padding: '0.75rem 0' }}>
                No upcoming care scheduled.
              </p>
            )}
          </div>

          <button
            onClick={() => onNavigate('records')}
            style={{
              marginTop: '1rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid #f1f5f9',
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            View Encounter History &rarr;
          </button>
        </div>
      </div>

      {/* ── 7. QUICK ACTIONS (4 Compact Buttons) ────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.85rem 0' }}>
          Quick Actions
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Action 1: View Medical Records */}
          <button
            onClick={() => onNavigate('records')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#0284c7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#0f172a';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="#0284c7" />
              View Medical Records
            </span>
            <ChevronRight size={16} />
          </button>

          {/* Action 2: Health Insights */}
          <button
            onClick={() => onNavigate('health-insights')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7c3aed';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#7c3aed';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#0f172a';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="#7c3aed" />
              Health Insights
            </span>
            <ChevronRight size={16} />
          </button>

          {/* Action 3: AI Assistant */}
          <button
            onClick={() => onNavigate('ai-assistant')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#0284c7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#0f172a';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="#0284c7" />
              AI Assistant
            </span>
            <ChevronRight size={16} />
          </button>

          {/* Action 4: Smart Health Card */}
          <button
            onClick={() => onNavigate('card')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#059669';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#0f172a';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={16} color="#059669" />
              Smart Health Card
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── RISK FACTORS MODAL ──────────────────────────────────────── */}
      {showRiskModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '540px',
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Brain size={20} color="#c084fc" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  AI Risk Evaluation Factors
                </h3>
              </div>
              <button
                onClick={() => setShowRiskModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0.4rem',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem 1rem', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>
                  Calculated Risk Score
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#581c87', marginTop: '0.15rem' }}>
                  {riskLabelText} ({riskScore}%)
                </div>
                <p style={{ fontSize: '0.78rem', color: '#6b21a8', margin: '0.2rem 0 0 0' }}>
                  {riskData?.explanation?.summary || 'Cardiometabolic risk calculated from vital signs, lab tests, and clinical history.'}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  Primary Contributing Clinical Features:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {riskData?.explanation?.contributingFactors?.length > 0 ? (
                    riskData.explanation.contributingFactors.map((factor: any, idx: number) => (
                      <div key={idx} style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                        &bull; {typeof factor === 'string' ? factor : factor.description || factor.factorName || JSON.stringify(factor)}
                      </div>
                    ))
                  ) : (
                    <>
                      <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                        &bull; Systolic &amp; Diastolic Blood Pressure trends
                      </div>
                      <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                        &bull; Fasting Glucose &amp; HbA1c diagnostic history
                      </div>
                      <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                        &bull; Body Mass Index (BMI) &amp; Demographic age context
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => {
                    setShowRiskModal(false);
                    onNavigate('health-insights');
                  }}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Full Risk Breakdown &rarr;
                </button>
                <button
                  onClick={() => setShowRiskModal(false)}
                  style={{ padding: '0.45rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
