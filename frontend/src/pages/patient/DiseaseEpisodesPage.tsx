import React, { useEffect, useState } from 'react';
import { Layers, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export const DiseaseEpisodesPage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEpisodes = async () => {
      setLoading(true);
      try {
        const url = patientId ? `/patients/episodes/${patientId}` : '/patients/episodes';
        const res = await api.get(url);
        setEpisodes(res.data);
      } catch (err) {
        console.error('Failed to load disease episodes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [patientId]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Layers size={24} color="var(--primary-600)" /> Smart Disease Episode System
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Groups related clinical visits chronologically under longitudinal episodes, preventing redundant entries while capturing disease progression from diagnosis to full recovery.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading disease episodes...
        </div>
      ) : episodes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No active or resolved disease episodes recorded.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {episodes.map((ep) => (
            <div key={ep.id} className="card" style={{ padding: '1.75rem' }}>
              {/* Episode Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {ep.disease}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {ep.episodeCode}
                    </span>
                    <span className={`badge ${ep.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>
                      {ep.status === 'RESOLVED' ? '✓ RESOLVED' : '● ACTIVE EPISODE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <strong>Duration:</strong> {new Date(ep.startDate).toLocaleDateString()} &rarr;{' '}
                    {ep.resolvedDate ? new Date(ep.resolvedDate).toLocaleDateString() : 'Ongoing Management'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-purple">
                    {ep.visits?.length || 0} Clinical Encounters
                  </span>
                </div>
              </div>

              {ep.summary && (
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--primary-500)' }}>
                  <strong>Clinical Summary:</strong> {ep.summary}
                </div>
              )}

              {/* Episode Progression Stages */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '0.85rem' }}>
                  Episode Chronological Progression Stages:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {ep.visits?.map((v: any, vIdx: number) => (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: v.severity === 'SEVERE' ? '#fee2e2' : '#e0f2fe',
                            color: v.severity === 'SEVERE' ? '#dc2626' : '#0369a1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                          }}
                        >
                          {vIdx + 1}
                        </div>

                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)', marginRight: '0.5rem' }}>
                            {new Date(v.visitDate).toLocaleDateString()}
                          </span>
                          <span className={`badge ${v.visitClassification === 'IMPROVING' ? 'badge-success' : (v.visitClassification === 'WORSENING' ? 'badge-danger' : 'badge-info')}`}>
                            {v.visitClassification || 'CONSULTATION'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            {v.diagnosis}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        <span>{v.doctor?.user?.name}</span>
                        <span className={`badge ${v.severity === 'SEVERE' ? 'badge-danger' : 'badge-info'}`}>
                          {v.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
