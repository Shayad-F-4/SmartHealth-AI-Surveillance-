import React, { useEffect, useState } from 'react';
import { Pill, AlertTriangle, ShieldCheck, Clock, User } from 'lucide-react';
import api from '../../services/api';

export const PrescriptionsPage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const url = patientId ? `/prescriptions/patient/${patientId}` : '/prescriptions';
        const res = await api.get(url);
        setPrescriptions(res.data);
      } catch (err) {
        console.error('Failed to load prescriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [patientId]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Pill size={24} color="var(--primary-600)" /> Prescriptions & Medication Management
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Active and historical medications with automated cross-referencing against documented drug allergy profiles.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading prescriptions...
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No active or previous medications on record.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {prescriptions.map((rx) => (
            <div key={rx.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                      {rx.medicineName}
                    </h3>
                    <span style={{ fontSize: '0.82rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                      {rx.dosage}
                    </span>
                  </div>
                  <span className={`badge ${rx.status === 'ACTIVE' ? 'badge-success' : 'badge-info'}`}>
                    {rx.status}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong>Schedule:</strong> {rx.frequency}
                  </div>
                  <div>
                    <strong>Duration:</strong> {rx.durationDays} days
                  </div>
                  {rx.instructions && (
                    <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Instructions: {rx.instructions}
                    </div>
                  )}
                </div>

                {/* Allergy Conflict Warning Banner */}
                {rx.allergyWarningTriggered && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <AlertTriangle size={16} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.4 }}>
                      <strong>Allergy Conflict Flagged:</strong> {rx.allergyWarningNote || 'Medication cross-checked and explicitly confirmed by clinician.'}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Prescribed by: <strong>{rx.doctor?.user?.name || 'Authorized Doctor'}</strong></span>
                <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
