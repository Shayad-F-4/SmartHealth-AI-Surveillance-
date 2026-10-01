import React, { useEffect, useState } from 'react';
import { ShieldCheck, User, Calendar, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const ReferralsPage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true);
      try {
        const url = patientId ? `/referrals/patient/${patientId}` : '/referrals';
        const res = await api.get(url);
        setReferrals(res.data);
      } catch (err) {
        console.error('Failed to load referrals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [patientId]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={24} color="var(--primary-600)" /> Specialist Referrals
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Clinical specialist and hospital referrals generated during consultations.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading referrals...
        </div>
      ) : referrals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No specialist referrals active or recorded.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {referrals.map((ref) => (
            <div key={ref.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span className="badge badge-purple">{ref.targetSpecialty}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                    {ref.reason}
                  </h3>
                </div>
                <span
                  className={`badge ${
                    ref.status === 'COMPLETED'
                      ? 'badge-success'
                      : ref.status === 'ACCEPTED'
                      ? 'badge-info'
                      : 'badge-warning'
                  }`}
                >
                  {ref.status}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Priority: </strong>
                  <span style={{ color: ref.priority === 'EMERGENCY' ? '#dc2626' : '#0284c7', fontWeight: 700 }}>
                    {ref.priority}
                  </span>
                </div>
                <div>
                  <strong>Referring Doctor: </strong>
                  {ref.referringDoctor?.user?.name} ({ref.referringDoctor?.specialty})
                </div>
                {ref.clinicalNotes && (
                  <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Notes: {ref.clinicalNotes}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'right' }}>
                Generated on: {new Date(ref.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
