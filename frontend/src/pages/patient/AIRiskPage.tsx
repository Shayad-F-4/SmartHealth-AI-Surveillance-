import React, { useEffect, useState } from 'react';
import { Brain, ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import api from '../../services/api';

export const AIRiskPage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      setLoading(true);
      try {
        const url = patientId ? `/patients/risk/${patientId}` : '/patients/risk';
        const res = await api.get(url);
        setRiskData(res.data);
      } catch (err) {
        console.error('Failed to calculate AI risk:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRisk();
  }, [patientId]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Brain size={24} color="var(--primary-600)" /> AI Cardiometabolic Risk & Anomaly Assessment
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Supervised Machine Learning evaluation (Model A: Random Forest) trained on structured cardiometabolic features.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Computing predictive risk telemetry...
        </div>
      ) : riskData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Main Risk Score Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Risk Classification Result</h3>
              <span
                className={`badge ${
                  riskData.risk_level === 'HIGH'
                    ? 'badge-danger'
                    : riskData.risk_level === 'MODERATE'
                    ? 'badge-warning'
                    : 'badge-success'
                }`}
              >
                {riskData.risk_level} RISK
              </span>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: riskData.risk_level === 'HIGH' ? '#ef4444' : '#0284c7', lineHeight: 1 }}>
                {riskData.risk_score}%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>
                Aggregate Cardiometabolic Risk Score
              </div>
            </div>

            {/* Probabilities Distribution */}
            {riskData.probabilities && (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Model Class Probabilities:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>Low:</span> {(riskData.probabilities.low * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span style={{ color: '#b45309', fontWeight: 700 }}>Mod:</span> {(riskData.probabilities.moderate * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>High:</span> {(riskData.probabilities.high * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding: '0.85rem 1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#0369a1', lineHeight: 1.4 }}>
              <strong>Clinical Action Plan:</strong> {riskData.recommendation}
            </div>
          </div>

          {/* Model Features & Contributing Indicators */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Contributing Risk Drivers</h3>
              <span className="badge badge-info">Feature Importance</span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Key clinical and biometric parameters driving the model prediction:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {riskData.contributing_factors?.map((f: string, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.85rem',
                      background: '#f8fafc',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                    }}
                  >
                    <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated from Vitals */}
            {riskData.calculatedFromVitals && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Baseline Vitals Evaluated:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <div>Age: <strong>{riskData.calculatedFromVitals.age} yrs</strong></div>
                  <div>BMI: <strong>{riskData.calculatedFromVitals.bmi}</strong></div>
                  <div>Blood Pressure: <strong>{riskData.calculatedFromVitals.systolic}/{riskData.calculatedFromVitals.diastolic} mmHg</strong></div>
                  <div>Glucose: <strong>{riskData.calculatedFromVitals.glucose} mg/dL</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Mandatory Clinical Disclaimer Banner */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem 1.25rem',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}
      >
        <Info size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.5 }}>
          <strong>Important Medical Notice:</strong> The SmartHealth AI engine serves as an automated decision-support awareness tool and does NOT generate a medical diagnosis. Clinicians remain solely responsible for therapeutic interventions. Patients should discuss all flags with their primary healthcare physician.
        </div>
      </div>
    </div>
  );
};
