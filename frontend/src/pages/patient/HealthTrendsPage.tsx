import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  HeartPulse,
  Activity,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Filter,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { BpTrendChart, GlucoseTrendChart, GenericLabTrendChart } from '../../components/HealthCharts';
import api from '../../services/api';

interface HealthTrendsPageProps {
  patientId?: string;
  onNavigateToRecord?: (recordId: string) => void;
}

export const HealthTrendsPage: React.FC<HealthTrendsPageProps> = ({ patientId, onNavigateToRecord }) => {
  const [trendsData, setTrendsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedTest, setSelectedTest] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ABNORMAL' | 'NORMAL'>('ALL');
  const [selectedLabForChart, setSelectedLabForChart] = useState<string | null>(null);

  useEffect(() => {
    fetchLongitudinalTrends();
  }, [patientId]);

  const fetchLongitudinalTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = patientId ? `/patients/health-trends/${patientId}` : '/patients/health-trends';
      const res = await api.get(url);
      setTrendsData(res.data);
      if (res.data?.labTrends && res.data.labTrends.length > 0) {
        setSelectedLabForChart(res.data.labTrends[0].testName);
      }
    } catch (err: any) {
      console.error('Failed to load longitudinal health trends:', err);
      setError('Unable to load longitudinal health trends. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <Activity size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary-600)' }} />
        <p style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b' }}>Analyzing Longitudinal Health History...</p>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Comparing historical lab reports, physiological vitals, and reference intervals</p>
      </div>
    );
  }

  if (error || !trendsData) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16 }}>
        <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>Failed to Load Health Trends</h3>
        <p style={{ fontSize: '0.88rem', color: '#7f1d1d', marginBottom: '1rem' }}>{error || 'No trend data returned.'}</p>
        <button onClick={fetchLongitudinalTrends} style={{ padding: '0.5rem 1.25rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          Retry Loading
        </button>
      </div>
    );
  }

  const labTrends = trendsData.labTrends || [];
  const bpTrends = trendsData.vitalsTrends?.bloodPressure || { measurements: [], count: 0 };
  const glucoseTrends = trendsData.vitalsTrends?.glucose || { measurements: [], count: 0 };

  // Filter lab trends based on selected dropdown
  const filteredLabTrends = labTrends.filter((item: any) => {
    if (selectedTest !== 'ALL' && item.testName !== selectedTest) return false;
    if (filterStatus === 'ABNORMAL' && item.latest?.status !== 'ABNORMAL') return false;
    if (filterStatus === 'NORMAL' && item.latest?.status !== 'NORMAL') return false;
    return true;
  });

  const activeChartTrend = labTrends.find((t: any) => t.testName === selectedLabForChart) || labTrends[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={26} color="var(--primary-600)" /> Longitudinal Health Analysis
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Historical comparison of laboratory parameters, physiological vitals, and reference interval changes over time.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FlaskConical size={18} color="#2563eb" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Analyzed Tests</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{labTrends.length}</div>
            </div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#059669" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Encounters</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{trendsData.totalClinicalEncounters}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
          <Filter size={16} color="#64748b" /> Filter Health Trends:
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Test Name Filter */}
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', background: 'white', cursor: 'pointer' }}
          >
            <option value="ALL">All Laboratory Tests ({labTrends.length})</option>
            {labTrends.map((t: any) => (
              <option key={t.testName} value={t.testName}>
                {t.testName} ({t.count} record{t.count > 1 ? 's' : ''})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', background: 'white', cursor: 'pointer' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ABNORMAL">Abnormal / Out of Range Only</option>
            <option value="NORMAL">Normal Range Only</option>
          </select>
        </div>
      </div>

      {/* Laboratory Test Trend Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FlaskConical size={20} color="#2563eb" /> Structured Laboratory Parameter Trends
        </h3>

        {filteredLabTrends.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#fafafa' }}>
            <Info size={32} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>No Matching Health Trends Found</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {labTrends.length === 0
                ? 'No laboratory records exist yet for longitudinal analysis. Upload lab reports in Medical Records to generate trend analysis.'
                : 'Try clearing selected filters to view all historical lab test parameters.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredLabTrends.map((t: any) => {
              const latest = t.latest;
              const prev = t.previous;
              const dir = t.trend?.direction;
              const isIncrease = dir === 'INCREASING';
              const isDecrease = dir === 'DECREASING';
              const isAbnormal = latest?.status === 'ABNORMAL';

              return (
                <div
                  key={t.testName}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isAbnormal ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                    background: isAbnormal ? '#fff5f5' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedLabForChart(t.testName)}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{t.testName}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ref: {t.referenceRange}</span>
                      </div>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: isAbnormal ? '#fee2e2' : '#dcfce7',
                          color: isAbnormal ? '#991b1b' : '#166534',
                          border: `1px solid ${isAbnormal ? '#fca5a5' : '#86efac'}`,
                        }}
                      >
                        {isAbnormal ? '⚠ Abnormal' : '✓ Normal'}
                      </span>
                    </div>

                    {/* Latest Value Display */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0 1rem' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: isAbnormal ? '#dc2626' : '#0f172a' }}>
                        {latest?.value}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>{t.unit}</span>

                      {/* Direction Pill */}
                      {dir && dir !== 'INSUFFICIENT_DATA' && (
                        <div
                          style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 8,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            background: isIncrease ? '#eff6ff' : isDecrease ? '#f0fdf4' : '#f8fafc',
                            color: isIncrease ? '#1d4ed8' : isDecrease ? '#15803d' : '#475569',
                          }}
                        >
                          {isIncrease && <ArrowUpRight size={16} />}
                          {isDecrease && <ArrowDownRight size={16} />}
                          {dir === 'STABLE' && <Minus size={16} />}
                          <span>{dir}</span>
                        </div>
                      )}
                    </div>

                    {/* Previous vs Current comparison details */}
                    {prev ? (
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 10, fontSize: '0.82rem', color: '#334155', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span>Previous ({prev.date}):</span>
                          <span style={{ fontWeight: 700 }}>{prev.value} {t.unit}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: t.trend?.change >= 0 ? '#1e40af' : '#15803d' }}>
                          <span>Absolute Change:</span>
                          <span>
                            {t.trend?.change >= 0 ? '+' : ''}{t.trend?.change} {t.unit}
                            {t.trend?.percentageChange !== null && ` (${t.trend?.change >= 0 ? '+' : ''}${t.trend?.percentageChange}%)`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: 10, fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                        One measurement available. Additional historical data required for trend calculation.
                      </div>
                    )}
                  </div>

                  {/* Summary sentence & source record link */}
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4, marginBottom: '0.5rem' }}>{t.summary}</p>
                    {latest?.sourceId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateToRecord) onNavigateToRecord(latest.sourceId);
                        }}
                        style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        Source: {latest.sourceTitle} ({latest.date}) <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Lab Time-Series Chart Section */}
      {activeChartTrend && activeChartTrend.measurements && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              <TrendingUp size={18} color="#2563eb" /> {activeChartTrend.testName} Time-Series Trajectory
            </h3>
            <span className="badge badge-info">Reference Range: {activeChartTrend.referenceRange}</span>
          </div>

          <GenericLabTrendChart
            title={activeChartTrend.testName}
            unit={activeChartTrend.unit}
            data={activeChartTrend.measurements.map((m: any) => ({
              date: m.date,
              value: m.value,
              status: m.status,
            }))}
          />
        </div>
      )}

      {/* Biometric Vitals Section (Blood Pressure & Fasting Glucose) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Blood Pressure Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <HeartPulse size={20} color="#ef4444" />
              Blood Pressure Progression (Systolic & Diastolic)
            </h3>
            <span className="badge badge-info">Target: &lt; 120/80 mmHg</span>
          </div>
          <BpTrendChart data={bpTrends.measurements || []} />
          {bpTrends.latest && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 10, fontSize: '0.83rem', color: '#334155' }}>
              <strong>Latest Reading:</strong> {bpTrends.latest.systolic}/{bpTrends.latest.diastolic} mmHg ({bpTrends.latest.date}) —{' '}
              <span style={{ color: bpTrends.latest.status === 'ABNORMAL' ? '#dc2626' : '#166534', fontWeight: 700 }}>
                {bpTrends.latest.status}
              </span>
            </div>
          )}
        </div>

        {/* Blood Glucose Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={20} color="#f59e0b" />
              Fasting Blood Glucose Progression
            </h3>
            <span className="badge badge-info">Target: 70 - 99 mg/dL</span>
          </div>
          <GlucoseTrendChart data={glucoseTrends.measurements || []} />
          {glucoseTrends.latest && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 10, fontSize: '0.83rem', color: '#334155' }}>
              <strong>Latest Reading:</strong> {glucoseTrends.latest.value} mg/dL ({glucoseTrends.latest.date}) —{' '}
              <span style={{ color: glucoseTrends.latest.status === 'ABNORMAL' ? '#dc2626' : '#166534', fontWeight: 700 }}>
                {glucoseTrends.latest.status}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
