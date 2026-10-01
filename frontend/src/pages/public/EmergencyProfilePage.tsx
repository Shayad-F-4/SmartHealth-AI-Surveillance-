import React, { useEffect, useState } from 'react';
import { ShieldAlert, Phone, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

interface EmergencyData {
  healthId: string;
  patientName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  criticalAllergies: string[];
  existingChronicConditions: string[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  disclaimer: string;
}

export const EmergencyProfilePage: React.FC<{ healthId: string; onBack: () => void }> = ({
  healthId,
  onBack,
}) => {
  const [data, setData] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmergencyData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/emergency/${healthId}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'No emergency record found for this Smart Health ID.');
      } finally {
        setLoading(false);
      }
    };

    if (healthId) {
      fetchEmergencyData();
    }
  }, [healthId]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '1.25rem' }}>
          <ArrowLeft size={16} /> Return to Home
        </button>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Retrieving emergency vitals...</div>
          </div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <AlertTriangle size={40} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.5rem' }}>Lookup Error</h3>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        ) : data ? (
          <div
            className="card"
            style={{
              padding: '2rem',
              border: '2px solid #ef4444',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#991b1b', lineHeight: 1.2 }}>
                  FIRST-RESPONDER EMERGENCY PROFILE
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Smart Health ID Verification Token: <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.healthId}</strong>
                </span>
              </div>
            </div>

            {/* Blood Group Giant Badge */}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                BLOOD GROUP
              </div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
                {data.bloodGroup}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '0.4rem', fontWeight: 600 }}>
                {data.patientName} &bull; {data.age} yrs &bull; {data.gender}
              </div>
            </div>

            {/* Critical Allergies */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                ⚠️ Critical Allergies & Sensitivities
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.criticalAllergies.length > 0 && data.criticalAllergies[0] !== 'None' ? (
                  data.criticalAllergies.map((allergy, i) => (
                    <span key={i} className="badge badge-danger" style={{ fontSize: '0.88rem', padding: '0.35rem 0.85rem' }}>
                      {allergy}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={15} /> No critical drug allergies documented
                  </span>
                )}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Existing Chronic Medical Conditions
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.existingChronicConditions.length > 0 && data.existingChronicConditions[0] !== 'None' ? (
                  data.existingChronicConditions.map((cond, i) => (
                    <span key={i} className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                      {cond}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={15} /> No major chronic conditions documented
                  </span>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Primary Emergency Contact
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {data.emergencyContact.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Authorized Kin / Guardian</div>
                </div>
                <a
                  href={`tel:${data.emergencyContact.phone}`}
                  className="btn btn-primary"
                  style={{ gap: '0.4rem', textDecoration: 'none' }}
                >
                  <Phone size={15} /> Call: {data.emergencyContact.phone}
                </a>
              </div>
            </div>

            {/* Security & Disclaimer Footer */}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', lineHeight: 1.4 }}>
              <strong>Privacy Protocol:</strong> {data.disclaimer}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
