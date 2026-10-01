import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  MapPin,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ArrowRight,
  Shield,
  CheckCircle,
  Minus,
  Microscope,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface DiseaseRow {
  disease: string;
  cases: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  risk: 'High' | 'Moderate' | 'Low';
  lastReported: string;
  color: string;
}

interface AreaRow {
  area: string;
  totalCases: number;
  topDisease: string;
  trend: 'up' | 'down' | 'stable';
}

interface IncreasingDisease {
  disease: string;
  change: number;
  label: 'Rising' | 'Moderate Increase';
  color: string;
  bg: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
}

/* ─── Static mock data ───────────────────────────────────────────────────── */

const DISEASE_ROWS: DiseaseRow[] = [
  { disease: 'Dengue',               cases: 286, change:  42, trend: 'up',     risk: 'High',     lastReported: 'Today',      color: '#EF5350' },
  { disease: 'Malaria',              cases: 214, change:  24, trend: 'up',     risk: 'Moderate', lastReported: 'Today',      color: '#F59E0B' },
  { disease: 'Typhoid',              cases: 142, change:  17, trend: 'up',     risk: 'Moderate', lastReported: 'Yesterday',  color: '#8B5CF6' },
  { disease: 'Influenza',            cases: 198, change:  -8, trend: 'down',   risk: 'Low',      lastReported: 'Today',      color: '#1677E8' },
  { disease: 'Viral Fever',          cases: 176, change:  31, trend: 'up',     risk: 'High',     lastReported: 'Today',      color: '#F97316' },
  { disease: 'Chikungunya',          cases:  76, change:  12, trend: 'up',     risk: 'Moderate', lastReported: '2 days ago', color: '#06B6D4' },
  { disease: 'Tuberculosis',         cases:  54, change:  -3, trend: 'stable', risk: 'Low',      lastReported: '3 days ago', color: '#64748B' },
  { disease: 'Respiratory Infection',cases:  92, change:   5, trend: 'up',     risk: 'Low',      lastReported: 'Today',      color: '#10B981' },
  { disease: 'Diarrheal Disease',    cases:  46, change: -11, trend: 'down',   risk: 'Low',      lastReported: '4 days ago', color: '#84CC16' },
];

const AREA_ROWS: AreaRow[] = [
  { area: 'Riverside Central', totalCases: 428, topDisease: 'Dengue',      trend: 'up'     },
  { area: 'Riverside East',    totalCases: 291, topDisease: 'Malaria',     trend: 'up'     },
  { area: 'Riverside West',    totalCases: 216, topDisease: 'Influenza',   trend: 'stable' },
  { area: 'Riverside North',   totalCases: 189, topDisease: 'Typhoid',     trend: 'up'     },
  { area: 'Riverside South',   totalCases: 160, topDisease: 'Viral Fever', trend: 'up'     },
];

const INCREASING: IncreasingDisease[] = [
  { disease: 'Dengue',      change: 42, label: 'Rising',            color: '#EF5350', bg: '#FEF2F2', textColor: '#EF5350', badgeBg: '#FEE2E2', badgeText: '#991B1B' },
  { disease: 'Viral Fever', change: 31, label: 'Rising',            color: '#F97316', bg: '#FFF7ED', textColor: '#F97316', badgeBg: '#FFEDD5', badgeText: '#9A3412' },
  { disease: 'Malaria',     change: 24, label: 'Rising',            color: '#F59E0B', bg: '#FFFBEB', textColor: '#F59E0B', badgeBg: '#FEF3C7', badgeText: '#92400E' },
  { disease: 'Typhoid',     change: 17, label: 'Moderate Increase', color: '#8B5CF6', bg: '#F5F3FF', textColor: '#8B5CF6', badgeBg: '#EDE9FE', badgeText: '#5B21B6' },
];

/* ─── Helper sub-components ─────────────────────────────────────────────── */

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up')
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#EF5350', fontWeight: 700 }}>
        <TrendingUp size={15} /> ↑
      </span>
    );
  if (trend === 'down')
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#19B875', fontWeight: 700 }}>
        <TrendingDown size={15} /> ↓
      </span>
    );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#64748B', fontWeight: 700 }}>
      <Minus size={15} /> →
    </span>
  );
}

function RiskPill({ risk }: { risk: 'High' | 'Moderate' | 'Low' }) {
  const map = {
    High:     { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
    Moderate: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    Low:      { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  };
  const s = map[risk];
  return (
    <span style={{
      padding: '0.3rem 0.7rem',
      borderRadius: 9999,
      fontSize: '0.76rem',
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      letterSpacing: '0.02em',
    }}>
      {risk}
    </span>
  );
}

function DiseaseIcon({ color }: { color: string }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 7,
      background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Microscope size={16} color={color} />
    </div>
  );
}

/* ─── Chart builder ──────────────────────────────────────────────────────── */

function buildChartData(days: number) {
  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date('2026-09-10');
    d.setDate(d.getDate() - (days - i - 1));
    return days <= 7
      ? d.toLocaleDateString('en-US', { weekday: 'short' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const seed = (base: number, growth: number, vol: number) =>
    Array.from({ length: days }, (_, i) =>
      Math.max(0, Math.round(base + growth * i + Math.sin(i * 0.7 + base) * vol))
    );

  return {
    labels,
    datasets: [
      { label: 'Dengue',      data: seed(6, 0.18, 3),   borderColor: '#EF5350', backgroundColor: 'rgba(239,83,80,0.07)',   tension: 0.45, borderWidth: 2.5, pointRadius: days <= 7 ? 4 : 2, pointHoverRadius: 6, fill: false },
      { label: 'Viral Fever', data: seed(5, 0.14, 2.5), borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.07)',  tension: 0.45, borderWidth: 2.5, pointRadius: days <= 7 ? 4 : 2, pointHoverRadius: 6, fill: false },
      { label: 'Malaria',     data: seed(4, 0.10, 2),   borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.07)',  tension: 0.45, borderWidth: 2,   pointRadius: days <= 7 ? 4 : 2, pointHoverRadius: 6, fill: false },
      { label: 'Typhoid',     data: seed(3, 0.07, 2),   borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.07)', tension: 0.45, borderWidth: 2,   pointRadius: days <= 7 ? 4 : 2, pointHoverRadius: 6, fill: false },
      { label: 'Influenza',   data: seed(6,-0.03, 2),   borderColor: '#1677E8', backgroundColor: 'rgba(22,119,232,0.07)', tension: 0.45, borderWidth: 2,   pointRadius: days <= 7 ? 4 : 2, pointHoverRadius: 6, fill: false },
    ],
  };
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: true,
        pointStyleWidth: 10,
        padding: 16,
        font: { size: 12, family: 'Plus Jakarta Sans, sans-serif' },
        color: '#475569',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(11,23,64,0.93)',
      padding: 12,
      titleFont: { size: 13, weight: 'bold' as const },
      bodyFont: { size: 12 },
      cornerRadius: 10,
      boxPadding: 4,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#F1F5F9' },
      border: { display: false },
      ticks: { font: { size: 11 }, color: '#94A3B8', padding: 6 },
    },
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 11 }, color: '#94A3B8', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
    },
  },
};

/* ─── Page component ─────────────────────────────────────────────────────── */

export const SurveillancePage: React.FC<{ onNavigate?: (tab: string) => void }> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [timeRange, setTimeRange]   = useState<7 | 30 | 90>(30);
  const [chartData, setChartData]   = useState<any>(null);
  const [topAlert, setTopAlert]     = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [refreshing, setRefreshing] = useState(false);

  const district = user?.patient?.district || 'Riverside District';

  const totalCases     = DISEASE_ROWS.reduce((s, d) => s + d.cases, 0);
  const activeDiseases = DISEASE_ROWS.length;
  const risingCount    = DISEASE_ROWS.filter(d => d.trend === 'up' && d.change > 15).length;
  const highRiskAreas  = AREA_ROWS.filter(a => a.trend === 'up' && a.totalCases > 250).length;

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const alertsRes = await api.get('/alerts');
      const filtered  = (alertsRes.data as any[]).filter(
        (a: any) => a.isActive && a.district?.toLowerCase() === district.toLowerCase()
      );
      setTopAlert(filtered[0] ?? null);
    } catch {
      // use static fallback
    }
    setChartData(buildChartData(timeRange));
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
    setRefreshing(false);
  }, [timeRange, district]);

  useEffect(() => { loadData(); }, [loadData]);

  /* loading state */
  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
        <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.25 }} />
        <p style={{ fontSize: '0.95rem' }}>Loading surveillance data…</p>
      </div>
    );
  }

  const card: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E3ECF5',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0B1740', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            Disease Surveillance
          </h2>
          <p style={{ fontSize: '0.94rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.5 }}>
            Stay informed about disease activity and health trends in your area.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.875rem', background: '#EEF6FF', borderRadius: 9, fontSize: '0.875rem', color: '#1677E8', fontWeight: 600, border: '1px solid #BFDBFE' }}>
              <MapPin size={15} /> {district}
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.875rem', background: 'white', border: '1px solid #E3ECF5', borderRadius: 9, fontSize: '0.85rem', color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
              Change Area <ChevronDown size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>
          <span><span style={{ fontWeight: 600, color: '#475569' }}>Last updated:</span> {lastUpdated}</span>
          <button onClick={loadData} title="Refresh" style={{ padding: '0.45rem', background: 'white', border: '1px solid #E3ECF5', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={16} color="#64748B" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.125rem' }}>

        <div style={{ ...card, padding: '1.25rem 1.375rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Reported Cases</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0B1740', lineHeight: 1, marginBottom: '0.375rem' }}>{totalCases.toLocaleString()}</p>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Last 30 days</p>
            </div>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#EEF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity size={22} color="#1677E8" />
            </div>
          </div>
        </div>

        <div style={{ ...card, padding: '1.25rem 1.375rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Active Diseases</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0B1740', lineHeight: 1, marginBottom: '0.375rem' }}>{activeDiseases}</p>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Currently monitored</p>
            </div>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Microscope size={22} color="#EF5350" />
            </div>
          </div>
        </div>

        <div style={{ ...card, padding: '1.25rem 1.375rem', border: '1px solid #FED7AA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Rising Diseases</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#EA580C', lineHeight: 1, marginBottom: '0.375rem' }}>{risingCount}</p>
              <p style={{ fontSize: '0.78rem', color: '#FB923C' }}>Compared with previous period</p>
            </div>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={22} color="#F59E0B" />
            </div>
          </div>
        </div>

        <div style={{ ...card, padding: '1.25rem 1.375rem', border: '1px solid #FECACA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>High-Risk Areas</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626', lineHeight: 1, marginBottom: '0.375rem' }}>{highRiskAreas}</p>
              <p style={{ fontSize: '0.78rem', color: '#F87171' }}>Require attention</p>
            </div>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={22} color="#EF5350" />
            </div>
          </div>
        </div>

      </div>

      {/* ── Trend Chart ─────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.375rem', flexWrap: 'wrap', gap: '0.875rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0B1740', marginBottom: '0.2rem' }}>Disease Activity Trends</h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B' }}>Reported cases over the last {timeRange} days</p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {([7, 30, 90] as const).map(d => (
              <button key={d} onClick={() => setTimeRange(d)} style={{ padding: '0.45rem 0.9rem', background: timeRange === d ? '#1677E8' : 'white', color: timeRange === d ? 'white' : '#475569', border: `1px solid ${timeRange === d ? '#1677E8' : '#E3ECF5'}`, borderRadius: 8, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}>
                {d} Days
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 300 }}>
          {chartData && <Line data={chartData} options={CHART_OPTIONS} />}
        </div>
      </div>

      {/* ── Two-column: Increasing + Area ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.375rem' }}>

        {/* Recently Increasing */}
        <div style={{ ...card, padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.125rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0B1740', marginBottom: '0.2rem' }}>Recently Increasing</h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B' }}>Diseases showing a significant increase in reported cases</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {INCREASING.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: d.bg, border: `1px solid ${d.color}22`, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: `${d.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={19} color={d.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0B1740', marginBottom: '0.1rem' }}>{d.disease}</p>
                    <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Last 30 days</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: d.textColor, marginBottom: '0.2rem' }}>+{d.change}%</p>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.22rem 0.6rem', borderRadius: 9999, background: d.badgeBg, color: d.badgeText, letterSpacing: '0.02em' }}>{d.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area Comparison */}
        <div style={{ ...card, padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.125rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0B1740', marginBottom: '0.2rem' }}>Disease Activity by Area</h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B' }}>Overview across different zones of {district}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', padding: '0 0.75rem 0.625rem', borderBottom: '1px solid #E3ECF5', marginBottom: '0.5rem' }}>
            {['Area', 'Cases', 'Top Disease', 'Trend'].map(h => (
              <span key={h} style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {AREA_ROWS.map((a, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', alignItems: 'center', padding: '0.75rem', background: i % 2 === 0 ? '#FAFBFC' : 'white', borderRadius: 9, border: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0B1740' }}>{a.area}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0B1740', textAlign: 'right' }}>{a.totalCases}</span>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500, textAlign: 'center' }}>{a.topDisease}</span>
                <span style={{ textAlign: 'right' }}><TrendBadge trend={a.trend} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── All Diseases Table ──────────────────────────────────────────── */}
      <div style={{ ...card, padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0B1740', marginBottom: '0.2rem' }}>Diseases Reported in Your Area</h3>
          <p style={{ fontSize: '0.84rem', color: '#64748B' }}>Overview of diseases reported in {district}</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E3ECF5' }}>
                {['Disease', 'Cases', 'Change', 'Trend', 'Risk', 'Last Reported'].map((h, ci) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: ci === 0 ? 'left' : 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FAFBFD' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISEASE_ROWS.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FBFF')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <DiseaseIcon color={d.color} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0B1740' }}>{d.disease}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0B1740' }}>{d.cases}</span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: d.change > 0 ? '#EF5350' : d.change < 0 ? '#19B875' : '#64748B' }}>
                      {d.change > 0 ? '+' : ''}{d.change}%
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}><TrendBadge trend={d.trend} /></td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}><RiskPill risk={d.risk} /></td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.84rem', color: '#64748B' }}>{d.lastReported}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom row: Alert + Area + Safety ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.375rem' }}>

        {/* Recent Health Alert */}
        <div style={{ ...card, padding: '1.25rem 1.375rem', background: '#FFFBF0', border: '1px solid #FED7AA' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={18} color="#F59E0B" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400E', marginBottom: '0.2rem' }}>Recent Health Alert</h4>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 9999, background: '#FDE68A', color: '#78350F' }}>AMBER</span>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#78350F', lineHeight: 1.6, marginBottom: '1rem' }}>
            {topAlert
              ? `${topAlert.title} — ${topAlert.message}`
              : 'Dengue cases have increased significantly in Riverside East during the last 30 days. Residents are advised to take preventive measures.'}
          </p>
          <button onClick={() => onNavigate?.('alerts')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.525rem 1rem', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 9, fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
            View Area Alert <ArrowRight size={14} />
          </button>
        </div>

        {/* Your Area */}
        <div style={{ ...card, padding: '1.25rem 1.375rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: '#EEF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={18} color="#1677E8" />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.15rem' }}>Your Area</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0B1740' }}>{district}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <CheckCircle size={16} color="#19B875" />
            <span style={{ fontSize: '0.84rem', color: '#19B875', fontWeight: 700 }}>Health awareness: Up to date</span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.55, marginBottom: '1rem' }}>
            You are receiving disease alerts relevant to your registered area.
          </p>
          <button onClick={() => onNavigate?.('settings')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.525rem 1rem', background: 'white', color: '#1677E8', border: '1.5px solid #1677E8', borderRadius: 9, fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
            <Bell size={14} /> Manage Alerts
          </button>
        </div>

        {/* Safety Panel */}
        <div style={{ ...card, padding: '1.25rem 1.375rem', background: 'linear-gradient(145deg,#F0FDF9 0%,#ECFDF5 100%)', border: '1px solid #A7F3D0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Shield size={18} color="#059669" />
            </div>
            <h4 style={{ fontSize: '0.97rem', fontWeight: 700, color: '#065F46', lineHeight: 1.3 }}>Stay Informed.<br />Stay Safe.</h4>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#047857', lineHeight: 1.6, marginBottom: '1rem', flex: 1 }}>
            Disease activity can change over time. Follow verified health guidance and contact a healthcare professional if you develop concerning symptoms.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => onNavigate?.('alerts')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.525rem 1rem', background: '#059669', color: 'white', border: 'none', borderRadius: 9, fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
              View Area Alerts <ArrowRight size={14} />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.525rem 1rem', background: 'white', color: '#059669', border: '1.5px solid #6EE7B7', borderRadius: 9, fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
              <ExternalLink size={13} /> Health Guidelines
            </button>
          </div>
        </div>

      </div>

      {/* ── Wide Safety Banner ──────────────────────────────────────────── */}
      <div style={{ padding: '1.5rem 1.75rem', background: 'linear-gradient(135deg,#EFF6FF 0%,#E0F2FE 100%)', border: '1px solid #BAE6FD', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', flexShrink: 0 }}>
            <Shield size={22} color="#1677E8" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0C4A6E', marginBottom: '0.25rem' }}>Stay Informed. Stay Safe.</h4>
            <p style={{ fontSize: '0.875rem', color: '#075985', lineHeight: 1.55, maxWidth: 560 }}>
              Disease activity can change over time. Follow verified health guidance from official sources and contact a healthcare professional if you develop concerning symptoms.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate?.('alerts')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.125rem', background: '#1677E8', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
            View Area Alerts <ArrowRight size={14} />
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.125rem', background: 'white', color: '#1677E8', border: '1.5px solid #93C5FD', borderRadius: 10, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
            <ExternalLink size={14} /> Health Guidelines
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

    </div>
  );
};
