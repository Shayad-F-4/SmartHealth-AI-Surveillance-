import React, { useEffect, useState } from 'react';
import { Brain, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export const InsightsPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const res = await api.get('/surveillance/insights');
        setInsights(res.data);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Brain size={24} color="var(--primary-600)" /> AI-Generated Epidemiological Bulletins
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Autonomous surveillance intelligence synthesizing multi-source data streams into actionable public health insights.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Generating real-time surveillance insights...
        </div>
      ) : insights.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No active epidemiological anomalies flagged.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {insights.map((ins, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                borderLeft: ins.riskLevel === 'HIGH_RISK' ? '5px solid #ef4444' : (ins.riskLevel === 'WARNING' ? '5px solid #f59e0b' : '5px solid #10b981'),
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
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

              {/* Natural Language Synthesis */}
              <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                {ins.aiInsight}
              </div>

              {/* Recommended Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong style={{ color: ins.riskLevel === 'HIGH_RISK' ? '#b91c1c' : 'var(--primary-700)' }}>
                    Recommended Intervention:{' '}
                  </strong>
                  <span>{ins.recommendedAction}</span>
                </div>

                {ins.riskLevel === 'HIGH_RISK' && (
                  <button onClick={() => onNavigate('health-camps')} className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
                    Deploy Camp Response &rarr;
                  </button>
                )}
              </div>

              {/* Underlying Metrics Bar */}
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div>Weekly Growth Rate: <strong style={{ color: ins.weeklyGrowthRate > 30 ? '#ef4444' : 'inherit' }}>+{ins.weeklyGrowthRate.toFixed(0)}%</strong></div>
                <div>Active Weekly Cases: <strong>{ins.activeCases}</strong></div>
                <div>Cumulative Total Cases: <strong>{ins.totalCases}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
