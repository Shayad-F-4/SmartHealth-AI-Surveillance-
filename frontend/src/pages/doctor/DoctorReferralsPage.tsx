import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import api from '../../services/api';

export const DoctorReferralsPage: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/referrals');
      setReferrals(res.data);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/referrals/${id}/status`, { status });
      fetchReferrals();
    } catch (err: any) {
      alert('Failed to update status');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={24} color="var(--primary-600)" /> Clinical Specialist Referrals
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Manage cross-specialty clinical referrals, triage urgency, and record resolution notes.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading clinical referrals...
        </div>
      ) : referrals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No specialist referrals found.
        </div>
      ) : (
        <div className="card" style={{ padding: '1rem' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Target Specialty</th>
                  <th>Priority</th>
                  <th>Reason</th>
                  <th>Referring Doctor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="badge badge-purple">{r.targetSpecialty}</span>
                    </td>
                    <td>
                      <span className={`badge ${r.priority === 'EMERGENCY' ? 'badge-danger' : 'badge-info'}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td>
                      <strong>{r.reason}</strong>
                      {r.clinicalNotes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.clinicalNotes}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{r.referringDoctor?.user?.name}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${r.status === 'COMPLETED' ? 'badge-success' : (r.status === 'ACCEPTED' ? 'badge-info' : 'badge-warning')}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {r.status === 'GENERATED' && (
                          <button onClick={() => handleUpdateStatus(r.id, 'ACCEPTED')} className="btn btn-secondary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}>
                            Accept
                          </button>
                        )}
                        {r.status === 'ACCEPTED' && (
                          <button onClick={() => handleUpdateStatus(r.id, 'COMPLETED')} className="btn btn-primary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}>
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
