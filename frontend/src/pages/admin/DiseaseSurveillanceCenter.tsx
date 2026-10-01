import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  MapPin,
  Flame,
  LineChart,
  Brain,
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
  Users,
  Tent,
  RefreshCw,
  BarChart2,
  Compass,
} from 'lucide-react';
import { LeafletDiseaseMap } from '../../components/LeafletDiseaseMap';
import { HotspotsPage } from './HotspotsPage';
import { ForecastPage } from './ForecastPage';
import { AnalyticsPage } from './AnalyticsPage';
import { InsightsPage } from './InsightsPage';
import { DiseaseDistributionChart } from '../../components/HealthCharts';
import api from '../../services/api';

export type SurveillanceTab = 'overview' | 'map' | 'hotspots' | 'forecast' | 'analytics' | 'insights';

interface DiseaseSurveillanceCenterProps {
  initialTab?: SurveillanceTab;
  onNavigate?: (tab: string) => void;
}

export const DiseaseSurveillanceCenter: React.FC<DiseaseSurveillanceCenterProps> = ({
  initialTab = 'overview',
  onNavigate = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<SurveillanceTab>(initialTab);
  const [overview, setOverview] = useState<any>(null);
  const [analyticsKpis, setAnalyticsKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchSurveillanceHeader = useCallback(async () => {
    try {
      const [overviewRes, analyticsRes] = await Promise.allSettled([
        api.get('/surveillance/overview'),
        api.get('/surveillance/analytics'),
      ]);
      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (analyticsRes.status === 'fulfilled') setAnalyticsKpis(analyticsRes.value.data?.kpis);
    } catch (err) {
      console.error('Failed to load surveillance KPIs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveillanceHeader();
  }, [fetchSurveillanceHeader]);

  const totalReports = overview?.summary?.totalDiseaseReports ?? analyticsKpis?.totalDiseaseReports ?? 0;
  const activeAlerts = overview?.summary?.activeAlertsCount ?? analyticsKpis?.activeAlerts ?? 0;
  const highRiskAreas = overview?.summary?.highRiskAreasCount ?? analyticsKpis?.highRiskZones ?? 0;
  const weeklyChange = analyticsKpis?.weeklyChangePercent ?? 0;

  return (
    <div>
      {/* ── Command Center Header ────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Activity size={20} />
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                Disease Surveillance
              </h1>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>Command Center</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', marginTop: '0.35rem', marginBottom: 0 }}>
              Monitor disease activity, detect emerging hotspots and support timely intervention.
            </p>
          </div>

          <button onClick={fetchSurveillanceHeader} className="btn btn-outline" style={{ gap: '0.4rem', fontSize: '0.82rem' }}>
            <RefreshCw size={14} /> Refresh Surveillance
          </button>
        </div>

        {/* Workflow Progression Ribbon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.85rem',
          background: '#f8fafc',
          border: '1px solid var(--border-light)',
          borderRadius: '8px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          marginBottom: '1.25rem',
        }}>
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>SURVEILLANCE WORKFLOW:</span>
          <span>Disease Data</span>
          <span>&rarr;</span>
          <span>Trend Analysis</span>
          <span>&rarr;</span>
          <span>Geographic Analysis</span>
          <span>&rarr;</span>
          <span>Hotspot Detection</span>
          <span>&rarr;</span>
          <span>Forecast</span>
          <span>&rarr;</span>
          <span>AI Insights</span>
          <span>&rarr;</span>
          <span style={{ color: '#059669', fontWeight: 700 }}>Preventive Action</span>
        </div>

        {/* ── Top KPI Cards ──────────────────────────────────────────────── */}
        <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
          {/* KPI 1: Total Cases */}
          <div className="metric-card">
            <div>
              <div className="metric-label">Total Cases</div>
              <div className="metric-val">{totalReports}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contagious disease telemetry</span>
            </div>
            <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Activity size={24} />
            </div>
          </div>

          {/* KPI 2: Active Alerts */}
          <div className="metric-card">
            <div>
              <div className="metric-label">Active Alerts</div>
              <div className="metric-val" style={{ color: activeAlerts > 0 ? '#f59e0b' : 'var(--text-main)' }}>
                {activeAlerts}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Targeted district broadcasts</span>
            </div>
            <div className="metric-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
              <AlertTriangle size={24} />
            </div>
          </div>

          {/* KPI 3: High-Risk Areas */}
          <div className="metric-card">
            <div>
              <div className="metric-label">High-Risk Areas</div>
              <div className="metric-val" style={{ color: highRiskAreas > 0 ? '#ef4444' : '#10b981' }}>
                {highRiskAreas}
              </div>
              <span className={`badge ${highRiskAreas > 0 ? 'badge-danger' : 'badge-success'}`} style={{ marginTop: '0.3rem' }}>
                {highRiskAreas > 0 ? 'Active Outbreak' : 'Normal Baseline'}
              </span>
            </div>
            <div className="metric-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <Flame size={24} />
            </div>
          </div>

          {/* KPI 4: Weekly Change */}
          <div className="metric-card">
            <div>
              <div className="metric-label">Weekly Change</div>
              <div className="metric-val" style={{ color: weeklyChange > 15 ? '#ef4444' : (weeklyChange < -5 ? '#10b981' : 'var(--text-main)') }}>
                {weeklyChange > 0 ? `+${weeklyChange}%` : `${weeklyChange}%`}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Week-over-week velocity</span>
            </div>
            <div className="metric-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* ── Sub-navigation Tab Bar ──────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: '#f1f5f9',
          padding: '0.35rem',
          borderRadius: 12,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          border: '1px solid var(--border-light)',
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart2 },
            { id: 'map', label: 'Map', icon: MapPin },
            { id: 'hotspots', label: 'Hotspots', icon: Flame },
            { id: 'forecast', label: 'Forecast', icon: LineChart },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'insights', label: 'AI Insights', icon: Brain },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as SurveillanceTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.25rem',
                borderRadius: 9,
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === id ? '#ffffff' : 'transparent',
                color: activeTab === id ? 'var(--primary-700)' : 'var(--text-muted)',
                boxShadow: activeTab === id ? '0 2px 8px rgba(15,23,42,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} color={activeTab === id ? 'var(--primary-600)' : 'currentColor'} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT: Overview ────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          {/* Outbreak Alert Banner if High-Risk District Active */}
          {overview?.summary?.highRiskAreasCount > 0 && (
            <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.75rem' }}>
              <Flame size={26} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.2rem' }}>
                  🚨 CRITICAL SURVEILLANCE WARNING: {overview.summary.highRiskAreasCount} High-Risk Outbreak Zone(s) Active
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.4rem' }}>
                  Geospatial telemetry in <strong>Riverside District</strong> shows sharp weekly acceleration in Malaria cases (+75%). Automated DBSCAN cluster centroid detected. Municipal intervention and community screening recommended.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('hotspots')}
                    className="btn btn-danger"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    Inspect Hotspot Telemetry &rarr;
                  </button>
                  <button
                    onClick={() => onNavigate('health-camps')}
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', background: 'white' }}
                  >
                    Deploy Community Health Camp &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Disease Distribution & District Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            {/* Disease Distribution Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Layers size={18} color="var(--primary-600)" />
                  Population Disease Distribution
                </h3>
                <span className="badge badge-info">Tracked Contagions</span>
              </div>
              <DiseaseDistributionChart data={overview?.diseaseWise || []} />
            </div>

            {/* Location Risks & Growth Rates Table */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <MapPin size={18} color="var(--primary-600)" />
                  District Risk Classification &amp; Weekly Growth
                </h3>
                <button onClick={() => setActiveTab('hotspots')} className="btn btn-outline" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                  Hotspot Clusters &rarr;
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
                    {overview?.locationRisks?.map((lr: any) => (
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
      )}

      {/* ── TAB CONTENT: Map ─────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <div className="card" style={{ padding: '1rem' }}>
          <LeafletDiseaseMap />
        </div>
      )}

      {/* ── TAB CONTENT: Hotspots ────────────────────────────────────────── */}
      {activeTab === 'hotspots' && (
        <HotspotsPage onNavigate={(dest) => {
          if (dest === 'surveillance-map') setActiveTab('map');
          else onNavigate(dest);
        }} />
      )}

      {/* ── TAB CONTENT: Forecast ────────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <ForecastPage />
      )}

      {/* ── TAB CONTENT: Analytics ───────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <AnalyticsPage />
      )}

      {/* ── TAB CONTENT: AI Insights ─────────────────────────────────────── */}
      {activeTab === 'insights' && (
        <InsightsPage onNavigate={onNavigate} />
      )}
    </div>
  );
};
