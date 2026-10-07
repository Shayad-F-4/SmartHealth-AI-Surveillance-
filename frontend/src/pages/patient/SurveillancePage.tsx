import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  Shield,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

interface NearbySignal {
  disease: string;
  cases: number;
  trend: 'Increasing' | 'Stable' | 'Declining';
  risk: 'High' | 'Moderate' | 'Low';
  precaution: string;
  category: string;
}

const NEARBY_SIGNALS: NearbySignal[] = [
  {
    disease: 'Dengue Vector-Borne Fever',
    cases: 24,
    trend: 'Increasing',
    risk: 'High',
    precaution: 'Use mosquito repellents, wear long sleeves, and eliminate stagnant water around residential spaces.',
    category: 'Vector-Borne',
  },
  {
    disease: 'Viral Upper Respiratory Fever',
    cases: 18,
    trend: 'Increasing',
    risk: 'Moderate',
    precaution: 'Maintain hydration, avoid crowded poorly-ventilated rooms, and seek medical consultation if fever persists > 48 hours.',
    category: 'Respiratory',
  },
  {
    disease: 'Typhoid / Enteric Infection',
    cases: 9,
    trend: 'Stable',
    risk: 'Moderate',
    precaution: 'Consume boiled or filtered water, wash raw produce thoroughly, and ensure safe food hygiene.',
    category: 'Water-Borne',
  },
  {
    disease: 'Seasonal Influenza',
    cases: 14,
    trend: 'Declining',
    risk: 'Low',
    precaution: 'Practice frequent hand-washing and respiratory hygiene.',
    category: 'Viral',
  },
];

export const SurveillancePage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const district = user?.patient?.district || 'Riverside District';
  const [districtAlerts, setDistrictAlerts] = useState<any[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<NearbySignal | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts');
        const active = res.data.filter(
          (a: any) => a.isActive && a.district?.toLowerCase() === district.toLowerCase()
        );
        setDistrictAlerts(active);
      } catch {
        // fallback to standard nearby signals
      }
    };
    fetchAlerts();
  }, [district]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <Eye size={26} color="#0284c7" />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Nearby Health Signals
          </h2>
        </div>
        <p style={{ fontSize: '0.92rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          Aggregated community surveillance signals within your approved regional monitoring radius.
        </p>
      </div>

      {/* ── Privacy Assurance Banner ─────────────────────────────────── */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.84rem',
          color: '#475569',
        }}
      >
        <Shield size={18} color="#0284c7" style={{ flexShrink: 0 }} />
        <span>
          <strong>Privacy Protected:</strong> Telemetry is strictly anonymized and aggregated at district health center level. No personal names, home addresses, or individual GPS coordinates are ever revealed.
        </span>
      </div>

      {/* ── Area & Radius Context Card ───────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
          border: '1px solid #bae6fd',
          borderRadius: 14,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current Monitoring Zone
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
            <MapPin size={18} color="#0284c7" /> {district}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
            Standard 25 km public health surveillance radius &bull; Updated weekly from authorized hospitals
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.6rem 1rem', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Signals</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>{NEARBY_SIGNALS.length}</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.6rem 1rem', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Community Alerts</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: districtAlerts.length > 0 ? '#ea580c' : '#059669' }}>
              {districtAlerts.length > 0 ? districtAlerts.length : 'Normal'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Active District Alert If Present ─────────────────────────── */}
      {districtAlerts.length > 0 && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderLeft: '4px solid #ea580c',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#9a3412', margin: '0 0 0.25rem 0' }}>
              Community Awareness Advisory: {districtAlerts[0].disease}
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#7c2d12', margin: 0, lineHeight: 1.4 }}>
              {districtAlerts[0].message || `Health authorities report increased cases of ${districtAlerts[0].disease} in ${district}. Follow preventive precautions.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Nearby Signals Cards Grid ─────────────────────────────────── */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>
          Reported Health Signals Within Radius
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {NEARBY_SIGNALS.map((signal) => {
            const isHigh = signal.risk === 'High';
            const isModerate = signal.risk === 'Moderate';

            return (
              <div
                key={signal.disease}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '1.25rem',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 999, background: '#f1f5f9', color: '#475569' }}>
                      {signal.category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: 999,
                        background: isHigh ? '#fef2f2' : isModerate ? '#fffbeb' : '#f0fdf4',
                        color: isHigh ? '#991b1b' : isModerate ? '#92400e' : '#166534',
                        border: `1px solid ${isHigh ? '#fecaca' : isModerate ? '#fde68a' : '#bbf7d0'}`,
                      }}
                    >
                      {signal.risk} Risk
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                    {signal.disease}
                  </h4>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.84rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Reported: </span>
                      <strong style={{ color: '#0f172a' }}>{signal.cases} cases</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: '#64748b' }}>Trend: </span>
                      <strong style={{ color: signal.trend === 'Increasing' ? '#dc2626' : signal.trend === 'Declining' ? '#059669' : '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {signal.trend === 'Increasing' ? <TrendingUp size={14} /> : signal.trend === 'Declining' ? <TrendingDown size={14} /> : <Minus size={14} />}
                        {signal.trend}
                      </strong>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45, margin: 0, background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 8 }}>
                    <strong>Precaution:</strong> {signal.precaution}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Within 25 km radius</span>
                  <button
                    onClick={() => setSelectedSignal(signal)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    View Guidance <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Community Healthcare Support ─────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Need Personal Medical Advice?
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
            If you are experiencing symptoms, ask our AI Health Assistant or schedule a consultation with your doctor.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('ai-assistant')}
            style={{
              padding: '0.55rem 1.15rem',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={14} /> Ask AI Assistant
          </button>
        )}
      </div>

      {/* ── Guidance Modal ───────────────────────────────────────────── */}
      {selectedSignal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedSignal(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 14,
              padding: '1.75rem',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 60px rgba(15,23,42,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                  {selectedSignal.category} Health Signal
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0 0' }}>
                  {selectedSignal.disease}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '0.35rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block' }}>Nearby Cases</span>
                <strong style={{ color: '#0f172a' }}>{selectedSignal.cases} reported</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block' }}>Area Trajectory</span>
                <strong style={{ color: selectedSignal.trend === 'Increasing' ? '#dc2626' : '#059669' }}>{selectedSignal.trend}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.74rem', display: 'block' }}>Risk Triage</span>
                <strong style={{ color: selectedSignal.risk === 'High' ? '#dc2626' : '#d97706' }}>{selectedSignal.risk}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                Recommended Preventive Measures
              </span>
              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                {selectedSignal.precaution}
              </p>
            </div>

            <button
              onClick={() => setSelectedSignal(null)}
              style={{
                width: '100%',
                padding: '0.6rem',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveillancePage;
