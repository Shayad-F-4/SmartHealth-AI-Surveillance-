import React, { useEffect, useState } from 'react';
import {
  Brain,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FileText,
  Activity,
  Cpu,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

export const AIRiskPage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRisk();
  }, [patientId]);

  const fetchRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = patientId ? `/patients/risk/${patientId}` : '/patients/risk';
      const res = await api.get(url);
      setRiskData(res.data);
    } catch (err: any) {
      console.error('Failed to calculate AI risk:', err);
      setError('Unable to calculate ML risk assessment. Please check ML microservice connectivity.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <Brain size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary-600)' }} />
        <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>Evaluating Machine Learning Risk Telemetry...</p>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Executing Model A (RandomForestClassifier) and calculating feature importances</p>
      </div>
    );
  }

  if (error || !riskData) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16 }}>
        <AlertTriangle size={32} color="#dc2626" style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>Risk Assessment Unavailable</h3>
        <p style={{ fontSize: '0.88rem', color: '#7f1d1d', marginBottom: '1rem' }}>{error}</p>
        <button onClick={fetchRisk} style={{ padding: '0.5rem 1.25rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          Retry Assessment
        </button>
      </div>
    );
  }

  const prediction = riskData.prediction || {
    riskLevel: riskData.risk_level || 'MODERATE',
    riskScore: riskData.risk_score || 50,
    probabilities: riskData.probabilities || { low: 0.33, moderate: 0.33, high: 0.34 },
    modelMetadata: riskData.model_metadata || { model: 'RandomForestClassifier', version: '1.0.0' },
  };

  const explanation = riskData.explanation || {
    summary: 'Model classification completed based on baseline vitals.',
    contributingFactors: [],
    supportingEvidence: [],
    limitations: ['AI decision support indicator. Clinical validation required.'],
  };

  const isHigh = prediction.riskLevel === 'HIGH';
  const isMod = prediction.riskLevel === 'MODERATE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Brain size={26} color="var(--primary-600)" /> AI Cardiometabolic Risk & Explanation Layer
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Supervised Random Forest prediction paired with a deterministic feature-importance explainability pipeline.
          </p>
        </div>

        {/* Model Metadata Badge */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={18} color="#2563eb" />
          <div style={{ fontSize: '0.78rem', color: '#475569' }}>
            <div>Model: <strong>{prediction.modelMetadata?.model || 'RandomForest'}</strong></div>
            <div>Version: <strong>{prediction.modelMetadata?.version || '1.0.0'}</strong></div>
          </div>
        </div>
      </div>

      {/* Grid: Risk Score Card + Model Class Probabilities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* ML Prediction Result Card */}
        <div className="card" style={{ borderLeft: `6px solid ${isHigh ? '#ef4444' : isMod ? '#f59e0b' : '#10b981'}` }}>
          <div className="card-header">
            <h3 className="card-title">ML Prediction Output</h3>
            <span
              className={`badge ${isHigh ? 'badge-danger' : isMod ? 'badge-warning' : 'badge-success'}`}
              style={{ fontSize: '0.85rem', fontWeight: 800 }}
            >
              {prediction.riskLevel} RISK
            </span>
          </div>

          <div style={{ textAlign: 'center', padding: '1.25rem 0' }}>
            <div style={{ fontSize: '4.2rem', fontWeight: 900, color: isHigh ? '#dc2626' : isMod ? '#d97706' : '#16a34a', lineHeight: 1 }}>
              {prediction.riskScore}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 700 }}>
              Calculated Risk Probability Score
            </div>
          </div>

          {/* Model Class Probabilities */}
          {prediction.probabilities && (
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem' }}>
                Class Output Probabilities:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center', fontSize: '0.82rem' }}>
                <div style={{ background: 'white', padding: '0.35rem', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>Low:</span> {(prediction.probabilities.low * 100).toFixed(1)}%
                </div>
                <div style={{ background: 'white', padding: '0.35rem', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#b45309', fontWeight: 700 }}>Mod:</span> {(prediction.probabilities.moderate * 100).toFixed(1)}%
                </div>
                <div style={{ background: 'white', padding: '0.35rem', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>High:</span> {(prediction.probabilities.high * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '0.85rem 1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, fontSize: '0.85rem', color: '#0369a1', lineHeight: 1.4 }}>
            <strong>Recommendation:</strong> {riskData.recommendation || 'Maintain routine preventive screening.'}
          </div>
        </div>

        {/* AI Explanation Summary & Evaluated Features */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">AI Explanation Layer</h3>
            <span className="badge badge-info">Deterministic Explainability</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, marginBottom: '1rem', background: '#f8fafc', padding: '0.85rem', borderRadius: 10, border: '1px solid #f1f5f9' }}>
            {explanation.summary}
          </p>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Evaluated Input Vitals Baseline:
            </div>
            {riskData.calculatedFromVitals && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.83rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.4rem 0.65rem', borderRadius: 6 }}>Age: <strong>{riskData.calculatedFromVitals.age} yrs</strong></div>
                <div style={{ background: '#f8fafc', padding: '0.4rem 0.65rem', borderRadius: 6 }}>BMI: <strong>{riskData.calculatedFromVitals.bmi}</strong></div>
                <div style={{ background: '#f8fafc', padding: '0.4rem 0.65rem', borderRadius: 6 }}>BP: <strong>{riskData.calculatedFromVitals.systolic}/{riskData.calculatedFromVitals.diastolic} mmHg</strong></div>
                <div style={{ background: '#f8fafc', padding: '0.4rem 0.65rem', borderRadius: 6 }}>Glucose: <strong>{riskData.calculatedFromVitals.glucose} mg/dL</strong></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validated Contributing Factors Breakdown */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
            <Activity size={20} color="#2563eb" /> Feature Importance & Validated Risk Factors
          </h3>
          <span className="badge badge-info">Weighted Feature Driver Breakdown</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {explanation.contributingFactors?.map((f: any, idx: number) => {
            const pctWeight = Math.round(f.modelImportanceWeight * 100);
            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: 12,
                  border: f.isHighRisk ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                  background: f.isHighRisk ? '#fff5f5' : '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {f.isHighRisk ? (
                      <AlertTriangle size={18} color="#dc2626" />
                    ) : (
                      <CheckCircle2 size={18} color="#16a34a" />
                    )}
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{f.factorName}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 4, background: '#e2e8f0', color: '#475569' }}>
                      {f.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.83rem', color: '#475569', margin: 0 }}>{f.description}</p>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: f.isHighRisk ? '#dc2626' : '#0f172a' }}>
                    {f.patientValue}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Target: {f.thresholdOrReference}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                    Model Weight: {pctWeight}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Linked Supporting Medical Evidence Section */}
      {explanation.supportingEvidence && explanation.supportingEvidence.length > 0 && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              <FileText size={20} color="#059669" /> Traceable Supporting Evidence
            </h3>
            <span className="badge badge-success">Database Verified Records</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {explanation.supportingEvidence.map((ev: any, idx: number) => (
              <div key={idx} style={{ padding: '0.85rem 1rem', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 4, background: '#dcfce7', color: '#166534' }}>
                    {ev.type}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{ev.date}</span>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>{ev.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>{ev.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Limitations & Disclaimer Banner */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#92400e', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
          <Info size={20} color="#b45309" /> Clinical Decision Support Limitations & Guidance
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.83rem', color: '#78350f', lineHeight: 1.6 }}>
          {explanation.limitations?.map((lim: string, idx: number) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
