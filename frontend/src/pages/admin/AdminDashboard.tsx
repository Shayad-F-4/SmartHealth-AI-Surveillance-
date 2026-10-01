import React, { useEffect, useState } from 'react';
import {
  Activity,
  Users,
  MapPin,
  Flame,
  AlertTriangle,
  TrendingUp,
  Tent,
  FileText,
  Shield,
  Layers,
  Compass,
  ArrowRight,
  History,
  Bell,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { DiseaseDistributionChart } from '../../components/HealthCharts';
import api from '../../services/api';

export const AdminDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [overview, setOverview] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      setLoading(true);
      try {
        const [overviewRes, auditRes] = await Promise.allSettled([
          api.get('/surveillance/overview'),
          api.get('/audit?limit=5'),
        ]);
        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
        if (auditRes.status === 'fulfilled') setRecentAudits(auditRes.value.data?.logs || []);
      } catch (err) {
        console.error('Failed to load admin dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOverview();
  }, []);

  return (
    <div>
      {/* ── Executive Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Building2 size={22} />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Healthcare Operations Dashboard
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginTop: '0.35rem', marginBottom: 0 }}>
            System-wide operational telemetry, clinical encounters, disease surveillance readiness, and compliance audit trail.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('disease-surveillance')} className="btn btn-primary" style={{ gap: '0.5rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)' }}>
            <Activity size={17} /> Open Disease Surveillance Command Center &rarr;
          </button>
        </div>
      </div>

      {/* ── Active High-Risk Outbreak Alert Banner ───────────────────────── */}
      {overview?.summary?.highRiskAreasCount > 0 && (
        <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.75rem' }}>
          <Flame size={26} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.2rem' }}>
              🚨 CRITICAL SURVEILLANCE WARNING: {overview.summary.highRiskAreasCount} High-Risk Outbreak Zone(s) Active
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.4rem' }}>
              Surveillance intelligence detected accelerated transmission in <strong>Riverside District</strong>. Automated DBSCAN cluster identified. Immediate intervention recommended.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate('disease-surveillance')}
                className="btn btn-danger"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                Inspect in Surveillance Center &rarr;
              </button>
              <button
                onClick={() => onNavigate('health-camps')}
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', background: 'white' }}
              >
                Approve Recommended Camp &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── System Core KPIs ────────────────────────────────────────────── */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="metric-card">
          <div>
            <div className="metric-label">Registered Population</div>
            <div className="metric-val">{overview?.summary?.totalPatients || 0}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Digital Smart Health IDs</span>
          </div>
          <div className="metric-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Total Clinical Encounters</div>
            <div className="metric-val">{overview?.summary?.totalVisits || 0}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctor visits recorded</span>
          </div>
          <div className="metric-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Stethoscope size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Surveillance Reports</div>
            <div className="metric-val">{overview?.summary?.totalDiseaseReports || 0}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contagious disease telemetry</span>
          </div>
          <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Activity size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">High-Risk Zones</div>
            <div className="metric-val" style={{ color: '#ef4444' }}>
              {overview?.summary?.highRiskAreasCount || 0}
            </div>
            <span className="badge badge-danger" style={{ marginTop: '0.35rem' }}>Active Outbreak</span>
          </div>
          <div className="metric-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <Flame size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Active Community Alerts</div>
            <div className="metric-val" style={{ color: '#f59e0b' }}>
              {overview?.summary?.activeAlertsCount || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Broadcast advisories</span>
          </div>
          <div className="metric-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* ── Quick Module Action Cards ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div
          onClick={() => onNavigate('disease-surveillance')}
          className="card"
          style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid var(--primary-600)', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Compass size={22} color="var(--primary-600)" />
            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Disease Surveillance</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
            Full command center: Overview, Interactive Map, DBSCAN Hotspots, ML Forecasting, Analytics &amp; AI Insights.
          </p>
          <span style={{ fontSize: '0.82rem', color: 'var(--primary-600)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Open Command Center &rarr;
          </span>
        </div>

        <div
          onClick={() => onNavigate('alerts')}
          className="card"
          style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #f59e0b', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Bell size={22} color="#f59e0b" />
            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Community Alerts</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
            Broadcast localized advisories directly to registered residents in outbreak zones.
          </p>
          <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Manage Alerts &rarr;
          </span>
        </div>

        <div
          onClick={() => onNavigate('health-camps')}
          className="card"
          style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #10b981', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Tent size={22} color="#10b981" />
            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Health Camps</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
            Deploy field screening camps in hotspot areas and record attendee telemetry.
          </p>
          <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Deploy Camps &rarr;
          </span>
        </div>

        <div
          onClick={() => onNavigate('audit-logs')}
          className="card"
          style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #7c3aed', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Shield size={22} color="#7c3aed" />
            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Security &amp; Audit Logs</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
            HIPAA/GDPR-compliant security logs tracking clinical record access and system events.
          </p>
          <span style={{ fontSize: '0.82rem', color: '#7c3aed', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Review Logs &rarr;
          </span>
        </div>
      </div>

      {/* ── Charts & District Breakdown ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Disease Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Layers size={18} color="var(--primary-600)" />
              Population Disease Distribution
            </h3>
            <span className="badge badge-info">Active Telemetry</span>
          </div>
          <DiseaseDistributionChart data={overview?.diseaseWise || []} />
        </div>

        {/* District Risk Classification Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <MapPin size={18} color="var(--primary-600)" />
              District Risk Classification &amp; Growth
            </h3>
            <button onClick={() => onNavigate('disease-surveillance')} className="btn btn-outline" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
              Full Surveillance &rarr;
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Disease</th>
                  <th>Weekly Growth</th>
                  <th>Active Cases</th>
                  <th>Risk Status</th>
                </tr>
              </thead>
              <tbody>
                {overview?.locationRisks?.slice(0, 6).map((lr: any) => (
                  <tr key={lr.id}>
                    <td><strong>{lr.district}</strong></td>
                    <td>{lr.disease}</td>
                    <td>
                      <span style={{ color: lr.weeklyGrowthRate > 30 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                        {lr.weeklyGrowthRate > 0 ? `+${lr.weeklyGrowthRate.toFixed(0)}%` : `${lr.weeklyGrowthRate.toFixed(0)}%`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{lr.activeCases}</td>
                    <td>
                      <span className={`badge ${lr.riskLevel === 'HIGH_RISK' ? 'badge-danger' : (lr.riskLevel === 'WARNING' ? 'badge-warning' : 'badge-success')}`}>
                        {lr.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
