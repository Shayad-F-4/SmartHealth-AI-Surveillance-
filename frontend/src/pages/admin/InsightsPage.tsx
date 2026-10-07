import React, { useEffect, useState, useCallback } from 'react';
import {
  Brain,
  Activity,
  Flame,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  MapPin,
  LineChart,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Sparkles,
  Info,
  Clock,
  Compass,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

interface IntelligenceFinding {
  id: string;
  category: 'TREND' | 'HOTSPOT' | 'FORECAST' | 'EPIDEMIOLOGICAL_SIGNAL';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedLocation?: string;
  affectedDisease?: string;
  metric?: string;
}

interface HotspotClusterSummary {
  clusterId: string;
  disease: string;
  district: string;
  caseCount: number;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  severity: string;
  densityCasesPerKm2: number;
}

interface ForecastSummary {
  disease: string;
  district: string;
  currentWeeklyCases: number;
  projectedTotal4Weeks: number;
  projectedWeeklyCases: number[];
  projectedGrowthRatePct: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  riskIndicator: 'HIGH_RISK' | 'WARNING' | 'NORMAL';
  modelUsed: string;
}

interface PublicHealthIntervention {
  id: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
  title: string;
  action: string;
  targetDistrict: string;
  targetDisease: string;
  actionType: 'HEALTH_CAMP' | 'VECTOR_CONTROL' | 'WATER_TESTING' | 'COMMUNITY_BROADCAST' | 'CLINICAL_ALERT';
}

interface TraceableEvidenceItem {
  id: string;
  type: 'DISEASE_REPORT' | 'HOTSPOT_CLUSTER' | 'FORECAST_SERIES' | 'LOCATION_RISK';
  referenceId: string;
  label: string;
  timestamp?: string;
}

interface IntelligenceReport {
  summary: string;
  overallStatus: 'NORMAL' | 'ELEVATED' | 'HIGH_OUTBREAK_RISK';
  generatedBy: string;
  evaluatedAt: string;
  stats: {
    totalCasesAnalyzed: number;
    activeHotspotsCount: number;
    highRiskDistrictsCount: number;
    activeAlertsCount: number;
    recommendedCampsCount: number;
  };
  keyFindings: IntelligenceFinding[];
  hotspotClusters: HotspotClusterSummary[];
  forecasts: ForecastSummary[];
  interventions: PublicHealthIntervention[];
  evidence: TraceableEvidenceItem[];
  limitations: string[];
  requiresHumanReview: boolean;
}

export const InsightsPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [locationBulletins, setLocationBulletins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'findings' | 'clusters' | 'forecasts' | 'interventions'>('all');

  const fetchData = useCallback(async () => {
    try {
      const [intelRes, bulletinsRes] = await Promise.allSettled([
        api.get('/surveillance/intelligence'),
        api.get('/surveillance/insights'),
      ]);

      if (intelRes.status === 'fulfilled') {
        setReport(intelRes.value.data);
      }
      if (bulletinsRes.status === 'fulfilled') {
        setLocationBulletins(bulletinsRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load surveillance intelligence:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'HIGH_OUTBREAK_RISK':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}>
            <Flame size={14} /> High Outbreak Risk
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}>
            <AlertTriangle size={14} /> Elevated Surveillance
          </span>
        );
      default:
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}>
            <CheckCircle2 size={14} /> Normal Baseline
          </span>
        );
    }
  };

  const getFindingIcon = (category: string) => {
    switch (category) {
      case 'TREND':
        return <TrendingUp size={18} color="#0284c7" />;
      case 'HOTSPOT':
        return <Flame size={18} color="#ef4444" />;
      case 'FORECAST':
        return <LineChart size={18} color="#8b5cf6" />;
      case 'EPIDEMIOLOGICAL_SIGNAL':
        return <Activity size={18} color="#f59e0b" />;
      default:
        return <Info size={18} color="var(--primary-600)" />;
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--primary-600)' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Synthesizing Epidemiological Telemetry...
        </h3>
        <p style={{ fontSize: '0.9rem', maxWidth: 480, margin: '0 auto' }}>
          Aggregating verified electronic medical records, executing DBSCAN spatial clustering, and evaluating autoregressive forecast vectors.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Top Header & Intelligence Attribution ────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Brain size={20} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Disease Surveillance Intelligence
            </h2>
            {getStatusBadge(report?.overallStatus)}
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
            Unified explanatory intelligence synthesizing spatial DBSCAN clustering, autoregressive forecasting, and clinical presentation velocity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Engine Attribution Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.85rem',
            background: report?.generatedBy?.toLowerCase().includes('gemini') || report?.generatedBy?.toLowerCase().includes('open') ? '#f3e8ff' : '#eff6ff',
            border: `1px solid ${report?.generatedBy?.toLowerCase().includes('gemini') || report?.generatedBy?.toLowerCase().includes('open') ? '#d8b4fe' : '#bfdbfe'}`,
            borderRadius: 8,
            fontSize: '0.78rem',
            fontWeight: 700,
            color: report?.generatedBy?.toLowerCase().includes('gemini') || report?.generatedBy?.toLowerCase().includes('open') ? '#7e22ce' : '#1d4ed8',
          }}>
            <Sparkles size={14} />
            <span>Generated by: {report?.generatedBy || 'SmartHealth Expert Decision Engine (Deterministic)'}</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Re-evaluating...' : 'Refresh Intelligence'}
          </button>
        </div>
      </div>

      {/* ── High Outbreak Warning Banner if Applicable ───────────────────── */}
      {report?.overallStatus === 'HIGH_OUTBREAK_RISK' && (
        <div className="alert-banner alert-banner-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem 1.5rem' }}>
          <ShieldAlert size={28} style={{ flexShrink: 0, marginTop: '2px', color: '#b91c1c' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#991b1b', marginBottom: '0.25rem' }}>
              CRITICAL PUBLIC HEALTH WARNING: Outbreak Acceleration Detected
            </div>
            <p style={{ fontSize: '0.88rem', color: '#7f1d1d', lineHeight: 1.4, margin: '0 0 0.75rem' }}>
              Autonomous spatial telemetry confirms high-density clustering and accelerated week-over-week growth. Rapid epidemiological containment, localized testing camps, and targeted vector/sanitation protocols are strongly advised.
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate('health-camps')}
                className="btn btn-danger"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                Deploy Community Health Camp &rarr;
              </button>
              <button
                onClick={() => onNavigate('alerts')}
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', background: '#fff' }}
              >
                Broadcast District Advisory &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Intelligence Telemetry KPI Cards ─────────────────────────────── */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div>
            <div className="metric-label">Analyzed Clinical Cases</div>
            <div className="metric-val">{report?.stats?.totalCasesAnalyzed ?? 0}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified 60-day EHR records</span>
          </div>
          <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Layers size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">DBSCAN Spatial Hotspots</div>
            <div className="metric-val" style={{ color: (report?.stats?.activeHotspotsCount ?? 0) > 0 ? '#ef4444' : 'var(--text-main)' }}>
              {report?.stats?.activeHotspotsCount ?? 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Density-based geographic clusters</span>
          </div>
          <div className="metric-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <Flame size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">High-Risk District Zones</div>
            <div className="metric-val" style={{ color: (report?.stats?.highRiskDistrictsCount ?? 0) > 0 ? '#ef4444' : '#10b981' }}>
              {report?.stats?.highRiskDistrictsCount ?? 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Threshold breach (&gt;50% growth)</span>
          </div>
          <div className="metric-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Priority Interventions</div>
            <div className="metric-val" style={{ color: 'var(--primary-700)' }}>
              {report?.interventions?.length ?? 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Actionable public-health directives</span>
          </div>
          <div className="metric-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* ── Executive Surveillance Briefing Card ─────────────────────────── */}
      <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-light)', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={20} color="var(--primary-600)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Executive Epidemiological Briefing
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={13} /> Evaluated: {report?.evaluatedAt ? new Date(report.evaluatedAt).toLocaleString() : 'Recent'}
          </span>
        </div>

        {/* Narrative Synthesis Text */}
        <div style={{
          fontSize: '0.94rem',
          lineHeight: 1.65,
          color: 'var(--text-main)',
          background: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid var(--border-light)',
          whiteSpace: 'pre-line',
          fontFamily: 'inherit',
        }}>
          {report?.summary}
        </div>

        {report?.requiresHumanReview && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 8,
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.84rem',
            color: '#9f1239',
          }}>
            <ShieldAlert size={16} />
            <span>
              <strong>Human Public Health Review Advised:</strong> Rapid contagion growth detected. Epidemiological confirmation should precede large-scale civic quarantine or field measures.
            </span>
          </div>
        )}
      </div>

      {/* ── View Switcher Buttons ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: '#f1f5f9',
        padding: '0.35rem',
        borderRadius: 10,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}>
        {[
          { id: 'all', label: 'All Dimensions' },
          { id: 'findings', label: `Key Findings (${report?.keyFindings?.length || 0})` },
          { id: 'clusters', label: `Spatial Hotspots (${report?.hotspotClusters?.length || 0})` },
          { id: 'forecasts', label: `Autoregressive Forecasts (${report?.forecasts?.length || 0})` },
          { id: 'interventions', label: `Interventions (${report?.interventions?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeView === tab.id ? '#ffffff' : 'transparent',
              color: activeView === tab.id ? 'var(--primary-700)' : 'var(--text-muted)',
              boxShadow: activeView === tab.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SECTION 1: Key Epidemiological Findings ──────────────────────── */}
      {(activeView === 'all' || activeView === 'findings') && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <h3 className="card-title">
              <TrendingUp size={18} color="var(--primary-600)" />
              Key Epidemiological Findings &amp; Signals
            </h3>
            <span className="badge badge-purple">Multi-Stream Analysis</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {report?.keyFindings?.map((finding) => (
              <div
                key={finding.id}
                style={{
                  border: '1px solid var(--border-light)',
                  borderLeft: finding.severity === 'CRITICAL' ? '4px solid #ef4444' : (finding.severity === 'HIGH' ? '4px solid #f97316' : '4px solid #0284c7'),
                  borderRadius: 10,
                  padding: '1.25rem',
                  background: '#fafafa',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getFindingIcon(finding.category)}
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {finding.category.replace('_', ' ')}
                      </span>
                    </div>
                    <span className={`badge ${finding.severity === 'CRITICAL' ? 'badge-danger' : (finding.severity === 'HIGH' ? 'badge-warning' : 'badge-info')}`}>
                      {finding.severity}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
                    {finding.title}
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: '0 0 0.75rem' }}>
                    {finding.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {finding.affectedLocation ? `${finding.affectedLocation} (${finding.affectedDisease})` : 'System-Wide'}
                  </span>
                  {finding.metric && (
                    <span style={{ fontWeight: 700, color: 'var(--primary-700)', background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                      {finding.metric}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 2: DBSCAN Spatial Hotspots ───────────────────────────── */}
      {(activeView === 'all' || activeView === 'clusters') && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Flame size={18} color="#ef4444" />
                Detected Spatial Outbreak Clusters (DBSCAN)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Spatial clustering evaluates coordinate proximity (epsilon = 2.5 km, min samples = 3) to uncover localized transmission epicenters.
              </p>
            </div>
            <button
              onClick={() => onNavigate('surveillance-map')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', gap: '0.35rem' }}
            >
              <Compass size={14} /> Open GIS Map &rarr;
            </button>
          </div>

          {report?.hotspotClusters && report.hotspotClusters.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cluster ID</th>
                    <th>Contagion</th>
                    <th>District</th>
                    <th>Cases</th>
                    <th>Spatial Radius</th>
                    <th>Case Density</th>
                    <th>Severity Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.hotspotClusters.map((cluster) => (
                    <tr key={cluster.clusterId}>
                      <td style={{ fontWeight: 800, color: 'var(--primary-700)' }}>{cluster.clusterId}</td>
                      <td><strong>{cluster.disease}</strong></td>
                      <td>{cluster.district}</td>
                      <td style={{ fontWeight: 700, color: cluster.caseCount >= 10 ? '#ef4444' : 'inherit' }}>
                        {cluster.caseCount} cases
                      </td>
                      <td>{cluster.radiusKm} km</td>
                      <td>
                        <span style={{ fontWeight: 700, color: cluster.densityCasesPerKm2 > 3.0 ? '#b91c1c' : 'inherit' }}>
                          {cluster.densityCasesPerKm2} / km²
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${cluster.severity === 'HIGH_RISK' ? 'badge-danger' : 'badge-warning'}`}>
                          {cluster.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No dense spatial clusters flagged by DBSCAN. Cases remain geographically dispersed across districts.
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: Autoregressive Forecast Trajectories ──────────────── */}
      {(activeView === 'all' || activeView === 'forecasts') && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <LineChart size={18} color="#8b5cf6" />
                4-Week Autoregressive Case Forecasts
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Autoregressive models project forward caseload based on 8-week historical reporting velocity.
              </p>
            </div>
            <button
              onClick={() => onNavigate('forecast')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', gap: '0.35rem' }}
            >
              Interactive Curves &rarr;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {report?.forecasts?.map((fc, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 10,
                  padding: '1.25rem',
                  background: '#fcfcfc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {fc.district} &bull; {fc.disease}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Model: {fc.modelUsed}
                    </span>
                  </div>
                  <span className={`badge ${fc.trend === 'INCREASING' ? 'badge-danger' : (fc.trend === 'DECREASING' ? 'badge-success' : 'badge-info')}`}>
                    {fc.trend}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.84rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Current Weekly</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {fc.currentWeeklyCases}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>4-Wk Proj. Total</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: fc.trend === 'INCREASING' ? '#ef4444' : 'var(--primary-700)' }}>
                      {fc.projectedTotal4Weeks}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Projected Growth</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: fc.projectedGrowthRatePct > 15 ? '#ef4444' : '#10b981' }}>
                      {fc.projectedGrowthRatePct >= 0 ? `+${fc.projectedGrowthRatePct}%` : `${fc.projectedGrowthRatePct}%`}
                    </div>
                  </div>
                </div>

                {/* Weekly Projections Pill Sequence */}
                <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Forward Projections by Week:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                    {fc.projectedWeeklyCases.map((val, wIdx) => (
                      <div key={wIdx} style={{ background: '#ffffff', padding: '0.4rem 0.25rem', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Wk +{wIdx + 1}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 4: Grounded Public Health Interventions ──────────────── */}
      {(activeView === 'all' || activeView === 'interventions') && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <h3 className="card-title">
              <ShieldCheck size={18} color="#10b981" />
              Actionable Public Health Directives
            </h3>
            <span className="badge badge-success">Grounded Directives</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {report?.interventions?.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 10,
                  padding: '1.25rem',
                  background: item.priority === 'IMMEDIATE' ? '#fffaf8' : '#fafafa',
                  borderLeft: item.priority === 'IMMEDIATE' ? '5px solid #ef4444' : '5px solid #0284c7',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className={`badge ${item.priority === 'IMMEDIATE' ? 'badge-danger' : (item.priority === 'HIGH' ? 'badge-warning' : 'badge-info')}`}>
                      {item.priority}
                    </span>
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {item.title}
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Target: {item.targetDistrict} &bull; {item.targetDisease}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, margin: '0 0 0.85rem' }}>
                  {item.action}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  {item.actionType === 'HEALTH_CAMP' && (
                    <button
                      onClick={() => onNavigate('health-camps')}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                    >
                      Coordinate Health Camp <ArrowRight size={14} />
                    </button>
                  )}
                  {item.actionType === 'COMMUNITY_BROADCAST' && (
                    <button
                      onClick={() => onNavigate('alerts')}
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                    >
                      Broadcast Community Alert <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 5: District-by-District Risk Bulletins ────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <h3 className="card-title">
            <MapPin size={18} color="var(--primary-600)" />
            District Outbreak Risk Bulletins
          </h3>
          <span className="badge badge-info">Municipal Surveillance</span>
        </div>

        {locationBulletins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No active municipal risk alerts recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {locationBulletins.map((ins, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-light)',
                  borderLeft: ins.riskLevel === 'HIGH_RISK' ? '5px solid #ef4444' : (ins.riskLevel === 'WARNING' ? '5px solid #f59e0b' : '5px solid #10b981'),
                  borderRadius: 10,
                  padding: '1.25rem',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {ins.district} &bull; {ins.disease}
                    </span>
                    <span className={`badge ${ins.riskLevel === 'HIGH_RISK' ? 'badge-danger' : (ins.riskLevel === 'WARNING' ? 'badge-warning' : 'badge-success')}`}>
                      {ins.riskLevel}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Evaluated: {new Date(ins.lastEvaluatedAt).toLocaleString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '0.75rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 8 }}>
                  {ins.aiInsight}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                  <div style={{ fontSize: '0.84rem' }}>
                    <strong style={{ color: ins.riskLevel === 'HIGH_RISK' ? '#b91c1c' : 'var(--primary-700)' }}>
                      Recommended Intervention:{' '}
                    </strong>
                    <span>{ins.recommendedAction}</span>
                  </div>

                  {ins.riskLevel === 'HIGH_RISK' && (
                    <button
                      onClick={() => onNavigate('health-camps')}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      Deploy Camp Response &rarr;
                    </button>
                  )}
                </div>

                <div style={{ marginTop: '0.65rem', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div>Weekly Growth Rate: <strong style={{ color: ins.weeklyGrowthRate > 30 ? '#ef4444' : 'inherit' }}>+{ins.weeklyGrowthRate.toFixed(0)}%</strong></div>
                  <div>Active Weekly Cases: <strong>{ins.activeCases}</strong></div>
                  <div>Cumulative Total Cases: <strong>{ins.totalCases}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 6: Traceable Evidence & Clinical Limitations ─────────── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#fafafa', border: '1px solid var(--border-light)' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.5rem' }}>
          <FileCheck size={16} color="var(--primary-600)" />
          Traceable Evidence &amp; Governance Limitations
        </h4>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          {report?.limitations?.map((lim, idx) => (
            <div key={idx} style={{ marginBottom: '0.25rem' }}>&bull; {lim}</div>
          ))}
        </div>

        {report?.evidence && report.evidence.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'center' }}>
              VERIFIED AUDIT SOURCES:
            </span>
            {report.evidence.map((ev) => (
              <span
                key={ev.id}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.55rem',
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  color: 'var(--text-main)',
                }}
              >
                {ev.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
