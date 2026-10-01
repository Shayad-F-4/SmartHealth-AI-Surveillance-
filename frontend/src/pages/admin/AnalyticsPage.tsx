import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart2,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Tent,
  Bell,
  Flame,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const DISEASE_COLORS = [
  '#1677E8', '#EF4444', '#F59E0B', '#10B981',
  '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
];
const AGE_COLOR = ['#0EA5E9', '#6366F1', '#F59E0B', '#EF4444'];
const GENDER_COLOR = ['#1677E8', '#EC4899', '#8B5CF6'];

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}> = ({ label, value, sub, change, icon, iconBg, iconColor }) => (
  <div className="metric-card">
    <div>
      <div className="metric-label">{label}</div>
      <div className="metric-val">{value}</div>
      {sub && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</span>
      )}
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
          {change > 0 ? (
            <ArrowUpRight size={14} color="#EF4444" />
          ) : change < 0 ? (
            <ArrowDownRight size={14} color="#10B981" />
          ) : (
            <Minus size={14} color="#94A3B8" />
          )}
          <span style={{
            fontSize: '0.78rem', fontWeight: 700,
            color: change > 15 ? '#EF4444' : change < -10 ? '#10B981' : '#94A3B8',
          }}>
            {change > 0 ? '+' : ''}{change}% vs last week
          </span>
        </div>
      )}
    </div>
    <div className="metric-icon" style={{ background: iconBg, color: iconColor }}>
      {icon}
    </div>
  </div>
);

/* ─── Analytics Page ─────────────────────────────────────────────────────── */
export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/surveillance/analytics');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <Activity size={32} style={{ marginBottom: '1rem', animation: 'pulse 2s ease-in-out infinite' }} />
        <div>Aggregating population-level epidemiological datasets…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <AlertTriangle size={28} color="#EF4444" style={{ marginBottom: '0.75rem' }} />
        <div style={{ color: '#EF4444', fontWeight: 700 }}>{error}</div>
        <button onClick={fetchAnalytics} className="btn btn-outline" style={{ marginTop: '1rem' }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, diseaseWise, districtWise, ageGroupWise, genderWise, severityWise, sourceWise, epidemicCurve, topHotspotDistricts } = data;

  /* ── Chart Configs ────────────────────────────────────────────────────── */
  const diseaseBarData = {
    labels: diseaseWise.map((d: any) => d.disease),
    datasets: [{
      label: 'Total Cases',
      data: diseaseWise.map((d: any) => d.totalCases),
      backgroundColor: DISEASE_COLORS.slice(0, diseaseWise.length),
      borderRadius: 6,
    }],
  };

  const ageDonutData = {
    labels: ageGroupWise.map((a: any) => a.ageGroup),
    datasets: [{
      data: ageGroupWise.map((a: any) => a.count),
      backgroundColor: AGE_COLOR.slice(0, ageGroupWise.length),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const genderDonutData = {
    labels: genderWise.map((g: any) => g.gender),
    datasets: [{
      data: genderWise.map((g: any) => g.count),
      backgroundColor: GENDER_COLOR.slice(0, genderWise.length),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const epidemicLineData = {
    labels: epidemicCurve.labels,
    datasets: [{
      label: 'Weekly Disease Cases',
      data: epidemicCurve.values,
      borderColor: '#1677E8',
      backgroundColor: 'rgba(22, 119, 232, 0.12)',
      tension: 0.3,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: '#1677E8',
    }],
  };

  const severityBarData = {
    labels: severityWise.map((s: any) => s.severity),
    datasets: [{
      label: 'Case Count',
      data: severityWise.map((s: any) => s.count),
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#7C3AED'],
      borderRadius: 6,
    }],
  };

  const districtBarData = {
    labels: districtWise.slice(0, 8).map((d: any) => d.district),
    datasets: [{
      label: 'Total Cases',
      data: districtWise.slice(0, 8).map((d: any) => d.count),
      backgroundColor: 'rgba(22, 119, 232, 0.75)',
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  const donutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { padding: 12, usePointStyle: true } } },
    cutout: '60%',
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart2 size={24} color="var(--primary-600)" /> Population Health Analytics
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Real-time epidemiological surveillance aggregates — demographics, disease burdens, district-level risk and epidemic trajectories.
          </p>
        </div>
        <button onClick={fetchAnalytics} className="btn btn-outline">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ── KPI Row 1 ────────────────────────────────────────────────────── */}
      <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
        <KpiCard
          label="Registered Population"
          value={kpis.totalPatients.toLocaleString()}
          sub="Digital Smart Health IDs"
          icon={<Users size={24} />}
          iconBg="#ECFDF5" iconColor="#10B981"
        />
        <KpiCard
          label="Total Surveillance Reports"
          value={kpis.totalDiseaseReports.toLocaleString()}
          sub="Contagious disease telemetry"
          icon={<Activity size={24} />}
          iconBg="#E0F2FE" iconColor="#0284C7"
        />
        <KpiCard
          label="Cases This Week"
          value={kpis.thisWeekCases}
          sub={`${kpis.last30DaysCases} in last 30 days`}
          change={kpis.weeklyChangePercent}
          icon={<TrendingUp size={24} />}
          iconBg={kpis.weeklyChangePercent > 15 ? '#FEF2F2' : '#F0FDF4'}
          iconColor={kpis.weeklyChangePercent > 15 ? '#EF4444' : '#10B981'}
        />
        <KpiCard
          label="Active High-Risk Zones"
          value={kpis.highRiskZones}
          sub="District outbreak zones"
          icon={<Flame size={24} />}
          iconBg="#FEF2F2" iconColor="#EF4444"
        />
        <KpiCard
          label="Active Community Alerts"
          value={kpis.activeAlerts}
          sub="Broadcast to residents"
          icon={<Bell size={24} />}
          iconBg="#FFFBEB" iconColor="#F59E0B"
        />
        <KpiCard
          label="Camp Screenings Done"
          value={kpis.totalScreened.toLocaleString()}
          sub={`${kpis.totalActiveCamps} active camps`}
          icon={<Tent size={24} />}
          iconBg="#F5F3FF" iconColor="#7C3AED"
        />
      </div>

      {/* ── Epidemic Curve ────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <TrendingUp size={18} color="var(--primary-600)" />
            8-Week Population Epidemic Curve
          </h3>
          <span className="badge badge-info">All Diseases Combined</span>
        </div>
        <div style={{ height: '260px', padding: '0.5rem 0' }}>
          <Line
            data={epidemicLineData}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
              scales: { y: { beginAtZero: true, title: { display: true, text: 'Weekly Cases' } } },
            }}
          />
        </div>
      </div>

      {/* ── Row: Disease Distribution + District Breakdown ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Disease Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={18} color="var(--primary-600)" />
              Disease Burden Distribution
            </h3>
          </div>
          <div style={{ height: '260px' }}>
            <Bar data={diseaseBarData} options={chartOptions} />
          </div>
        </div>

        {/* District Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <MapPin size={18} color="var(--primary-600)" />
              District Case Burden
            </h3>
          </div>
          <div style={{ height: '260px' }}>
            <Bar data={districtBarData} options={{
              ...chartOptions,
              indexAxis: 'y' as const,
              scales: { x: { beginAtZero: true } },
            }} />
          </div>
        </div>
      </div>

      {/* ── Row: Demographics (Age + Gender + Severity) ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Age Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Age Group Distribution</h3>
            <span className="badge badge-info">Demographics</span>
          </div>
          <div style={{ height: '220px' }}>
            {ageGroupWise.length > 0
              ? <Doughnut data={ageDonutData} options={donutOptions} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No data available</div>
            }
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gender Distribution</h3>
            <span className="badge badge-info">Demographics</span>
          </div>
          <div style={{ height: '220px' }}>
            {genderWise.length > 0
              ? <Doughnut data={genderDonutData} options={donutOptions} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No data available</div>
            }
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Case Severity Profile</h3>
            <span className="badge badge-warning">Clinical</span>
          </div>
          <div style={{ height: '220px' }}>
            {severityWise.length > 0
              ? <Bar data={severityBarData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No data available</div>
            }
          </div>
        </div>
      </div>

      {/* ── Disease Weekly Trend Table ────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Activity size={18} color="var(--primary-600)" />
            Disease Trend Intelligence — Week-over-Week
          </h3>
          <span className="badge badge-purple">Live Telemetry</span>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Disease</th>
                <th>Total Cases</th>
                <th>This Week</th>
                <th>Last Week</th>
                <th>Weekly Growth</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {diseaseWise.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No disease report data in the system yet.
                  </td>
                </tr>
              ) : diseaseWise.map((d: any) => (
                <tr key={d.disease}>
                  <td><strong>{d.disease}</strong></td>
                  <td style={{ fontWeight: 700 }}>{d.totalCases}</td>
                  <td>{d.thisWeek}</td>
                  <td>{d.lastWeek}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: d.weeklyGrowth > 20 ? '#EF4444' : d.weeklyGrowth < -10 ? '#10B981' : '#F59E0B' }}>
                      {d.weeklyGrowth > 0 ? '+' : ''}{d.weeklyGrowth}%
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {d.trend === 'INCREASING'
                        ? <TrendingUp size={15} color="#EF4444" />
                        : d.trend === 'DECREASING'
                          ? <TrendingDown size={15} color="#10B981" />
                          : <Minus size={15} color="#94A3B8" />
                      }
                      <span className={`badge ${d.trend === 'INCREASING' ? 'badge-danger' : d.trend === 'DECREASING' ? 'badge-success' : 'badge-info'}`}>
                        {d.trend}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top Hotspot Districts ────────────────────────────────────────── */}
      {topHotspotDistricts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Flame size={18} color="#EF4444" />
              Active High-Risk &amp; Warning Districts
            </h3>
            <span className="badge badge-danger">Requires Intervention</span>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Disease</th>
                  <th>Active Cases</th>
                  <th>Weekly Growth</th>
                  <th>Risk Status</th>
                </tr>
              </thead>
              <tbody>
                {topHotspotDistricts.map((lr: any, i: number) => (
                  <tr key={i} style={{ background: lr.riskLevel === 'HIGH_RISK' ? '#FEF2F2' : '#FFFBEB' }}>
                    <td><strong>{lr.district}</strong></td>
                    <td>{lr.disease}</td>
                    <td style={{ fontWeight: 700 }}>{lr.activeCases}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: lr.weeklyGrowthRate > 30 ? '#EF4444' : '#F59E0B' }}>
                        +{lr.weeklyGrowthRate.toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${lr.riskLevel === 'HIGH_RISK' ? 'badge-danger' : 'badge-warning'}`}>
                        {lr.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {diseaseWise.length === 0 && topHotspotDistricts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <BarChart2 size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Analytics Data Available</div>
          <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
            Analytics populate automatically when doctors record clinical visits with contagious disease diagnoses.
            Seed disease data by creating patient consultations.
          </p>
        </div>
      )}
    </div>
  );
};
