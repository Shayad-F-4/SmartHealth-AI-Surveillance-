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
  MapPin,
  Building2,
  Phone,
  FileCheck,
  Bell,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import { GenericLabTrendChart } from '../../components/HealthCharts';

interface PatientDashboardProps {
  onNavigate: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Patient-specific data state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [activeEpisodes, setActiveEpisodes] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [recentLabs, setRecentLabs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);

  // Motion preference detection
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Fetch only patient-specific real data from backend
  const loadPatientData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        appointmentsRes,
        timelineRes,
        episodesRes,
        prescriptionsRes,
        labsRes,
        notificationsRes,
        riskRes,
        trendsRes,
      ] = await Promise.allSettled([
        api.get('/appointments/my-appointments'),
        api.get('/patients/timeline'),
        api.get('/patients/episodes'),
        api.get('/prescriptions'),
        api.get('/labs'),
        api.get('/notifications'),
        api.get('/patients/risk'),
        api.get('/patients/health-trends'),
      ]);

      if (appointmentsRes.status === 'fulfilled') {
        const apts = appointmentsRes.value.data.appointments || appointmentsRes.value.data;
        if (Array.isArray(apts)) setAppointments(apts);
      }

      if (timelineRes.status === 'fulfilled' && Array.isArray(timelineRes.value.data)) {
        setMedicalRecords(timelineRes.value.data);
      }

      if (episodesRes.status === 'fulfilled' && Array.isArray(episodesRes.value.data)) {
        setActiveEpisodes(episodesRes.value.data.filter((e: any) => e.status === 'ACTIVE'));
      }

      if (prescriptionsRes.status === 'fulfilled') {
        const rxList = prescriptionsRes.value.data.prescriptions || prescriptionsRes.value.data;
        if (Array.isArray(rxList)) setRecentPrescriptions(rxList);
      }

      if (labsRes.status === 'fulfilled') {
        const labList = labsRes.value.data.labs || labsRes.value.data;
        if (Array.isArray(labList)) setRecentLabs(labList);
      }

      if (notificationsRes.status === 'fulfilled') {
        const notifList = notificationsRes.value.data.notifications || notificationsRes.value.data;
        if (Array.isArray(notifList)) setNotifications(notifList);
      }

      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value.data.latestRiskAssessment || riskRes.value.data);
      }

      if (trendsRes.status === 'fulfilled') {
        setTrendsData(trendsRes.value.data);
      }
    } catch (err: any) {
      console.error('Failed to load patient data:', err);
      setError('Unable to load some personal health data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [user]);

  // Extract patient display attributes
  const patientName = user?.name?.split(' ')[0] || 'Patient';
  const fullName = user?.name || 'Patient';
  const healthId = user?.patient?.healthId || 'SHC-2026-000001';
  const locality =
    user?.patient?.locality ||
    user?.patient?.subLocality ||
    user?.patient?.city ||
    user?.patient?.district ||
    'Registered Locality';

  const currentAvatarUrl = user?.avatarUrl
    ? user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `http://localhost:5000${user.avatarUrl}`
    : null;

  // Active chronic conditions
  const chronicConditionsStr = user?.patient?.chronicConditions || '';
  const chronicConditions = useMemo(() => {
    return chronicConditionsStr
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s && s.toLowerCase() !== 'none' && s.toLowerCase() !== 'none reported');
  }, [chronicConditionsStr]);

  // ── 1. REAL NEXT UPCOMING APPOINTMENT ─────────────────────────────────────
  const nextAppointment = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;

    const now = new Date();
    // Consider active/upcoming statuses
    const validStatuses = ['PENDING', 'APPROVED'];
    const upcoming = appointments
      .filter((a) => validStatuses.includes(a.status))
      .filter((a) => {
        const aptDate = new Date(a.appointmentDate);
        // Compare by date or time
        return aptDate.getTime() + 24 * 60 * 60 * 1000 >= now.getTime();
      })
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

    return upcoming.length > 0 ? upcoming[0] : null;
  }, [appointments]);

  // ── 2. REAL OVERALL HEALTH STATUS ─────────────────────────────────────────
  const overallHealth = useMemo(() => {
    const hasActiveEpisodes = activeEpisodes.length > 0;
    const hasAbnormalLab = recentLabs.some((l) => l.status === 'ABNORMAL');
    const riskScore = riskData?.riskScore;

    if (hasActiveEpisodes) {
      return {
        status: 'Monitoring',
        label: 'Active Care',
        badgeColor: '#0284c7',
        badgeBg: '#e0f2fe',
        borderColor: '#bae6fd',
        explanation: `Under active observation for ${activeEpisodes[0].disease}.`,
        ctaText: 'View Care Summary →',
      };
    }

    if (hasAbnormalLab) {
      return {
        status: 'Follow-up Advised',
        label: 'Clinical Review',
        badgeColor: '#d97706',
        badgeBg: '#fef3c7',
        borderColor: '#fde68a',
        explanation: 'Recent diagnostic lab report has parameters requiring doctor review.',
        ctaText: 'View Lab Reports →',
      };
    }

    if (typeof riskScore === 'number') {
      if (riskScore >= 70) {
        return {
          status: 'Attention Needed',
          label: 'Elevated Risk',
          badgeColor: '#dc2626',
          badgeBg: '#fee2e2',
          borderColor: '#fecaca',
          explanation: 'AI cardiometabolic risk indicators are elevated. Follow-up is recommended.',
          ctaText: 'View Health Summary →',
        };
      }
      if (riskScore <= 40) {
        return {
          status: 'Stable',
          label: 'Optimal',
          badgeColor: '#059669',
          badgeBg: '#d1fae5',
          borderColor: '#a7f3d0',
          explanation: 'Your key health information is currently stable and being monitored.',
          ctaText: 'View Health Summary →',
        };
      }
      return {
        status: 'Monitoring',
        label: 'Moderate',
        badgeColor: '#d97706',
        badgeBg: '#fef3c7',
        borderColor: '#fde68a',
        explanation: 'Your health metrics are being monitored. Regular checkups advised.',
        ctaText: 'View Health Summary →',
      };
    }

    if (medicalRecords.length > 0) {
      return {
        status: 'Monitoring',
        label: 'Monitored',
        badgeColor: '#0284c7',
        badgeBg: '#e0f2fe',
        borderColor: '#bae6fd',
        explanation: 'Your health information is currently being monitored.',
        ctaText: 'View Health Summary →',
      };
    }

    return {
      status: 'Health status unavailable',
      label: 'No Records',
      badgeColor: '#64748b',
      badgeBg: '#f1f5f9',
      borderColor: '#e2e8f0',
      explanation: 'No clinical health assessments or records available yet.',
      ctaText: 'Add Medical Record →',
    };
  }, [activeEpisodes, recentLabs, riskData, medicalRecords]);

  // ── 3. REAL PATIENT-SPECIFIC HEALTH ALERTS ────────────────────────────────
  const patientAlerts = useMemo(() => {
    const list: Array<{ id: string; title: string; subtitle: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; date: string }> = [];

    // Pending/Upcoming appointment alert
    if (nextAppointment && nextAppointment.status === 'PENDING') {
      list.push({
        id: `apt-pending-${nextAppointment.id}`,
        title: 'Appointment Awaiting Confirmation',
        subtitle: `Requested slot with Dr. ${nextAppointment.doctor?.user?.name || 'Doctor'} on ${new Date(nextAppointment.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}.`,
        severity: 'INFO',
        date: new Date(nextAppointment.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      });
    }

    // Abnormal Lab Alerts
    const abnormalLabs = recentLabs.filter((l) => l.status === 'ABNORMAL');
    if (abnormalLabs.length > 0) {
      list.push({
        id: `lab-abnormal-${abnormalLabs[0].id}`,
        title: `Abnormal Result: ${abnormalLabs[0].testName}`,
        subtitle: `Report from ${abnormalLabs[0].doctor?.user?.name ? `Dr. ${abnormalLabs[0].doctor.user.name}` : 'Laboratory'} requires follow-up.`,
        severity: 'WARNING',
        date: new Date(abnormalLabs[0].reportDate || abnormalLabs[0].createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      });
    }

    // Unread system notifications
    const unreadNotifs = notifications.filter((n) => !n.isRead);
    unreadNotifs.slice(0, 2).forEach((n) => {
      list.push({
        id: `notif-${n.id}`,
        title: n.title,
        subtitle: n.message,
        severity: n.priority === 'HIGH' ? 'WARNING' : 'INFO',
        date: new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      });
    });

    return list;
  }, [nextAppointment, recentLabs, notifications]);

  // ── 4. REAL RECENT ACTIVITY ──────────────────────────────────────────────
  const latestActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      title: string;
      category: string;
      date: Date;
      formattedDate: string;
      doctorOrFacility: string;
      linkTab: string;
    }> = [];

    // Visits / Consultations
    medicalRecords.forEach((r) => {
      activities.push({
        id: `rec-${r.id}`,
        title: r.disease ? `Consultation: ${r.disease}` : 'Clinical Consultation',
        category: 'Consultation',
        date: new Date(r.visitDate),
        formattedDate: new Date(r.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        doctorOrFacility: r.doctor?.user?.name ? `Dr. ${r.doctor.user.name}` : r.hospital?.name || 'Healthcare Center',
        linkTab: 'records',
      });
    });

    // Lab Reports
    recentLabs.forEach((l) => {
      activities.push({
        id: `lab-${l.id}`,
        title: `Lab Report: ${l.testName}`,
        category: 'Lab Report',
        date: new Date(l.reportDate || l.createdAt),
        formattedDate: new Date(l.reportDate || l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        doctorOrFacility: l.doctor?.user?.name ? `Dr. ${l.doctor.user.name}` : 'Diagnostic Laboratory',
        linkTab: 'records',
      });
    });

    // Prescriptions
    recentPrescriptions.forEach((p) => {
      activities.push({
        id: `rx-${p.id}`,
        title: `Prescription: ${p.medicines?.[0]?.name || p.diagnosis || 'Medication Issued'}`,
        category: 'Prescription',
        date: new Date(p.prescribedAt || p.createdAt),
        formattedDate: new Date(p.prescribedAt || p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        doctorOrFacility: p.doctor?.user?.name ? `Dr. ${p.doctor.user.name}` : 'Attending Physician',
        linkTab: 'records',
      });
    });

    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    return activities;
  }, [medicalRecords, recentLabs, recentPrescriptions]);

  const topRecentActivity = latestActivity[0] || null;

  // ── 5. RECENT MEDICAL RECORDS (3-5 real items) ─────────────────────────────
  const recentRecordsList = useMemo(() => {
    return medicalRecords.slice(0, 4);
  }, [medicalRecords]);

  // ── 6. REAL AI RISK METRICS (For Health Intelligence Section ONLY) ──────────
  const riskScore = typeof riskData?.riskScore === 'number' ? Math.round(riskData.riskScore) : null;
  const riskCategory = riskData?.riskCategory || (riskScore !== null ? (riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MODERATE' : 'LOW') : null);
  const riskLabel = riskCategory === 'HIGH' ? 'High Risk' : riskCategory === 'MODERATE' ? 'Moderate Risk' : riskCategory === 'LOW' ? 'Low Risk' : 'Unavailable';

  // Available trend data for chart
  const availableTrend = useMemo(() => {
    if (!trendsData) return null;
    if (Array.isArray(trendsData.trends)) {
      const valid = trendsData.trends.find((t: any) => t.points && t.points.length >= 2);
      return valid || null;
    }
    return null;
  }, [trendsData]);

  // ── LOADING SKELETON ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1140, margin: '0 auto', paddingBottom: '3rem' }}>
        <div style={{ height: 86, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.25rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 110, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }} />
          ))}
        </div>
        <div style={{ height: 140, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }} />
        <div style={{ height: 180, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1140, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Error Retry Banner */}
      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 14, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#be123c', fontSize: '0.82rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} color="#be123c" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadPatientData}
            style={{ background: '#be123c', color: 'white', border: 'none', borderRadius: 8, padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* ── 1. WELCOME HEADER (Clean, Patient-Focused) ──────────────────────── */}
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
              fontSize: '1.15rem',
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
              fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'PT'
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                Welcome back, {patientName}
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
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={13} color="#0284c7" /> {locality} &bull; Personal Health Portal
            </p>
          </div>
        </div>

        {/* Smart Health Card ID Button */}
        <button
          onClick={() => onNavigate('card')}
          title="View Smart Health Card"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.95rem',
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

      {/* ── 2. TOP 4 PATIENT-FOCUSED SUMMARY CARDS ──────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* CARD 1 — OVERALL HEALTH */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Overall Health
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: overallHealth.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={16} color={overallHealth.badgeColor} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                {overallHealth.status}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 999,
                  background: overallHealth.badgeBg,
                  color: overallHealth.badgeColor,
                  border: `1px solid ${overallHealth.borderColor}`,
                }}
              >
                {overallHealth.label}
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
              {overallHealth.explanation}
            </p>
          </div>

          <button
            onClick={() => onNavigate('health-insights')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              textAlign: 'left',
            }}
          >
            {overallHealth.ctaText}
          </button>
        </div>

        {/* CARD 2 — NEXT APPOINTMENT */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Next Appointment
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: nextAppointment ? '#f0fdf4' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={16} color={nextAppointment ? '#16a34a' : '#64748b'} />
              </div>
            </div>

            {nextAppointment ? (
              <>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Dr. {nextAppointment.doctor?.user?.name || 'Verified Doctor'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, marginTop: '0.15rem' }}>
                  {nextAppointment.doctor?.specialty || 'General Physician'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                    {new Date(nextAppointment.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {nextAppointment.startTime}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.45rem',
                      borderRadius: 999,
                      background: nextAppointment.status === 'APPROVED' ? '#dcfce7' : '#fef3c7',
                      color: nextAppointment.status === 'APPROVED' ? '#15803d' : '#92400e',
                    }}
                  >
                    {nextAppointment.status === 'APPROVED' ? 'Confirmed' : 'Pending'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
                  No upcoming appointments
                </div>
                <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                  Schedule consultations with verified specialists.
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigate('appointments')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              textAlign: 'left',
            }}
          >
            {nextAppointment ? 'View Appointment →' : 'Book Appointment →'}
          </button>
        </div>

        {/* CARD 3 — HEALTH ALERTS */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Health Alerts
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: patientAlerts.length > 0 ? '#fff7ed' : '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {patientAlerts.length > 0 ? (
                  <Bell size={16} color="#ea580c" />
                ) : (
                  <CheckCircle2 size={16} color="#16a34a" />
                )}
              </div>
            </div>

            {patientAlerts.length > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    {patientAlerts.length} Action Item{patientAlerts.length > 1 ? 's' : ''}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 999,
                      background: '#ffedd5',
                      color: '#c2410c',
                      border: '1px solid #fed7aa',
                    }}
                  >
                    Attention
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.35rem 0 0 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {patientAlerts[0].title}
                </p>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    No new health alerts
                  </span>
                  <Check size={16} color="#16a34a" />
                </div>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
                  All prescriptions and notifications are up to date.
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigate('records')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              textAlign: 'left',
            }}
          >
            {patientAlerts.length > 0 ? 'View Alerts →' : 'View History →'}
          </button>
        </div>

        {/* CARD 4 — RECENT HEALTH ACTIVITY */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Recent Activity
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity size={16} color="#0284c7" />
              </div>
            </div>

            {topRecentActivity ? (
              <>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topRecentActivity.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {topRecentActivity.doctorOrFacility}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 600 }}>
                  {topRecentActivity.formattedDate}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
                  No recent activity
                </div>
                <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                  Encounter notes and test reports will be logged here.
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigate('records')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              textAlign: 'left',
            }}
          >
            View Records →
          </button>
        </div>
      </div>

      {/* ── 3. PROMINENT UPCOMING APPOINTMENT SECTION ──────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.35rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#0284c7" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Upcoming Appointment
            </h3>
          </div>
          {nextAppointment && (
            <button
              onClick={() => onNavigate('appointments')}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              Manage Appointments <ChevronRight size={14} />
            </button>
          )}
        </div>

        {nextAppointment ? (
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)',
              border: '1px solid #bae6fd',
              borderRadius: 14,
              padding: '1.25rem 1.4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 260 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  flexShrink: 0,
                }}
              >
                <Stethoscope size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    Dr. {nextAppointment.doctor?.user?.name || 'Verified Practitioner'}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.55rem',
                      borderRadius: 999,
                      background: nextAppointment.status === 'APPROVED' ? '#dcfce7' : '#fef3c7',
                      color: nextAppointment.status === 'APPROVED' ? '#15803d' : '#92400e',
                      border: `1px solid ${nextAppointment.status === 'APPROVED' ? '#bbf7d0' : '#fde68a'}`,
                    }}
                  >
                    {nextAppointment.status === 'APPROVED' ? '✓ Confirmed' : '◷ Awaiting Approval'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700, marginTop: '0.15rem' }}>
                  {nextAppointment.doctor?.specialty || 'General Physician'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={13} /> {nextAppointment.doctor?.hospital?.name || 'SmartHealth Medical Center'}
                </div>
              </div>
            </div>

            {/* Time & Consultation Type */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                background: '#ffffff',
                padding: '0.75rem 1.25rem',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Date & Time
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                  <Clock size={14} color="#0284c7" />
                  {new Date(nextAppointment.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {nextAppointment.startTime}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Consultation
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginTop: '0.15rem' }}>
                  {nextAppointment.type === 'TELE_CONSULT' ? 'Tele-Consultation' : 'In-Person Consultation'}
                </div>
              </div>

              <button
                onClick={() => onNavigate('appointments')}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 10,
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                }}
              >
                View Details
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '1.75rem',
              borderRadius: 14,
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#1e293b' }}>
                No upcoming appointments scheduled
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Consult with verified doctors across Kopargaon & Rahata for in-person or tele-consultations.
              </p>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              <Calendar size={15} /> Find a Verified Doctor
            </button>
          </div>
        )}
      </div>

      {/* ── 4. QUICK ACTIONS (Action-Oriented 4-Card Grid) ───────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <h3 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.85rem 0' }}>
          Quick Actions
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          {/* Action 1: Medical Records */}
          <button
            onClick={() => onNavigate('records')}
            style={{
              padding: '0.95rem 1rem',
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={17} color="#0284c7" />
              Medical Records
            </span>
            <ChevronRight size={16} />
          </button>

          {/* Action 2: Appointments */}
          <button
            onClick={() => onNavigate('appointments')}
            style={{
              padding: '0.95rem 1rem',
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={17} color="#0284c7" />
              Appointments
            </span>
            <ChevronRight size={16} />
          </button>

          {/* Action 3: AI Assistant */}
          <button
            onClick={() => onNavigate('ai-assistant')}
            style={{
              padding: '0.95rem 1rem',
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={17} color="#7c3aed" />
              AI Assistant
            </span>
            <ChevronRight size={16} />
          </button>

          {/* Action 4: Smart Health Card */}
          <button
            onClick={() => onNavigate('card')}
            style={{
              padding: '0.95rem 1rem',
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CreditCard size={17} color="#059669" />
              Emergency Card
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── 5. RECENT MEDICAL RECORDS (3-5 Actual Real Records) ─────────────── */}
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
              Recent Medical Records
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              Recent clinical consultations and diagnostic encounters
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
            Full Medical History <ArrowRight size={14} />
          </button>
        </div>

        {recentRecordsList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentRecordsList.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onNavigate('records')}
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
                  flexWrap: 'wrap',
                  gap: '0.75rem',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 200, flex: 1 }}>
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
                    <FileCheck size={18} color="#0284c7" />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: 999, background: '#e0f2fe', color: '#0369a1' }}>
                        Clinical Visit
                      </span>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rec.disease ? rec.disease : 'General Medical Consultation'}
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                      {rec.doctor?.user?.name ? `Dr. ${rec.doctor.user.name}` : rec.hospital?.name || 'Healthcare Facility'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>
                    {new Date(rec.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ color: '#0284c7', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                    View &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>No medical records recorded yet</p>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>
              Encounter records and prescriptions from clinical visits will appear here.
            </span>
          </div>
        )}
      </div>

      {/* ── 6. HEALTH INTELLIGENCE SECTION (AI-Assisted Decision Support) ────── */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain size={20} color="#7c3aed" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Health Intelligence
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0', fontWeight: 500 }}>
              AI-assisted health insights based on your available health data.
            </p>
          </div>

          <button
            onClick={() => onNavigate('health-insights')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#7c3aed',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            Detailed Health Analytics <ArrowRight size={14} />
          </button>
        </div>

        {/* Informational Disclaimer Banner */}
        <div
          style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: 10,
            padding: '0.6rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.74rem',
            color: '#6b21a8',
            fontWeight: 600,
          }}
        >
          <Info size={14} color="#7c3aed" style={{ flexShrink: 0 }} />
          <span>
            Decision Support Notice: AI models provide informational risk evaluation. This is not a substitute for clinical judgment or a professional medical diagnosis.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* LEFT: AI RISK ASSESSMENT */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Health Risk Assessment
                </span>
                {riskScore !== null && (
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#581c87' }}>
                    {riskScore}%
                  </span>
                )}
              </div>

              {riskScore !== null ? (
                <>
                  <div style={{ position: 'relative', height: '10px', borderRadius: 999, background: 'linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%)', overflow: 'hidden', margin: '0.75rem 0' }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${riskScore}%`,
                        background: 'rgba(255, 255, 255, 0.35)',
                        transition: reducedMotion ? 'none' : 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, color: '#7e22ce' }}>
                    <span>LOW (0–39%)</span>
                    <span>MODERATE (40–69%)</span>
                    <span>HIGH (70–100%)</span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#581c87', marginTop: '0.85rem', fontWeight: 600 }}>
                    Risk Level: <strong>{riskLabel}</strong> ({riskScore}%). Based on available health data.
                  </p>
                </>
              ) : (
                <div style={{ padding: '1rem 0' }}>
                  <p style={{ fontSize: '0.85rem', color: '#581c87', fontWeight: 700, margin: 0 }}>
                    Risk assessment unavailable
                  </p>
                  <p style={{ fontSize: '0.76rem', color: '#7e22ce', margin: '0.25rem 0 0 0' }}>
                    Clinical vitals and diagnostic lab results will train and populate your risk model.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => (riskScore !== null ? setShowRiskModal(true) : onNavigate('health-insights'))}
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
              View Detailed Analysis <ArrowRight size={14} />
            </button>
          </div>

          {/* RIGHT: LONGITUDINAL HEALTH TRENDS */}
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
            {availableTrend ? (
              <>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Health Trend: {availableTrend.title}
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                        {availableTrend.latestValue} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{availableTrend.unit}</span>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: 999, background: '#ffffff', color: '#0284c7', border: '1px solid #93c5fd' }}>
                      {availableTrend.trendDirection}
                    </span>
                  </div>

                  <div style={{ marginTop: '0.75rem', background: '#ffffff', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e0f2fe', boxShadow: '0 1px 4px rgba(2, 132, 199, 0.05)' }}>
                    <GenericLabTrendChart
                      title={availableTrend.title}
                      unit={availableTrend.unit}
                      data={availableTrend.points.map((p: any) => ({
                        date: p.date,
                        value: p.value,
                        status: p.status || (p.value > 100 ? 'ABNORMAL' : 'NORMAL'),
                      }))}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid #bae6fd', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Last updated: {new Date(availableTrend.lastUpdated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <button
                    onClick={() => onNavigate('health-insights')}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    View All Trends &rarr;
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', color: '#0369a1', padding: '1rem 0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Longitudinal Health Trends
                </span>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '0.4rem' }}>
                  No historical trend measurements recorded
                </p>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                  Repeated clinical visits and lab reports will populate longitudinal systolic, diastolic and biomarker curves.
                </p>
                <button
                  onClick={() => onNavigate('records')}
                  style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                >
                  View Records &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RISK FACTORS MODAL ────────────────────────────────────────────── */}
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRiskModal(false);
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
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
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Contributing Risk Factors
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

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem 1rem', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>
                  Risk Assessment
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#581c87', marginTop: '0.15rem' }}>
                  {riskLabel} ({riskScore}%)
                </div>
                <p style={{ fontSize: '0.78rem', color: '#6b21a8', margin: '0.25rem 0 0 0' }}>
                  {riskData?.explanation?.summary || 'Cardiometabolic risk calculated from available vital signs and diagnostic history.'}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  Clinical Contributing Factors:
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
                        &bull; Diagnostic Blood Glucose &amp; HbA1c observations
                      </div>
                      <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                        &bull; Body Mass Index (BMI) &amp; Demographic context
                      </div>
                    </>
                  )}
                </div>
              </div>

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
