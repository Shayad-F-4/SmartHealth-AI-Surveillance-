import React, { useEffect, useState } from 'react';
import { Clock, Stethoscope, Pill, FileText, AlertCircle, Building2 } from 'lucide-react';
import api from '../../services/api';

export const MedicalTimelinePage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const url = patientId ? `/patients/timeline/${patientId}` : '/patients/timeline';
        const res = await api.get(url);
        setRecords(res.data);
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [patientId]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Clock size={24} color="var(--primary-600)" /> Chronological Medical Timeline
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Immutable historical consultation log. Every doctor visit is cryptographically recorded with vitals, prescriptions, and lab orders.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading medical timeline...
        </div>
      ) : records.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No historical medical visits found.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '3px solid #cbd5e1' }}>
          {records.map((rec, index) => (
            <div
              key={rec.id}
              style={{
                position: 'relative',
                marginBottom: '2rem',
                paddingLeft: '1.25rem',
              }}
            >
              {/* Timeline Bullet */}
              <div
                style={{
                  position: 'absolute',
                  left: '-1.95rem',
                  top: '4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: rec.severity === 'SEVERE' ? '#ef4444' : (rec.severity === 'MODERATE' ? '#0284c7' : '#10b981'),
                  border: '3px solid white',
                  boxShadow: '0 0 0 2px #cbd5e1',
                }}
              />

              <div className="card" style={{ padding: '1.5rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {rec.disease}
                      </span>
                      <span className={`badge ${rec.severity === 'SEVERE' ? 'badge-danger' : 'badge-info'}`}>
                        {rec.severity}
                      </span>
                      {rec.visitClassification && (
                        <span className="badge badge-purple">
                          {rec.visitClassification.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span><strong>Doctor:</strong> {rec.doctor?.user?.name} ({rec.doctor?.specialty})</span>
                      {rec.hospital && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building2 size={13} /> {rec.hospital.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>{new Date(rec.visitDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                    <div style={{ fontSize: '0.75rem' }}>District: <strong>{rec.locationDistrict}</strong></div>
                  </div>
                </div>

                {/* Vitals Ribbon */}
                {(rec.systolicBp || rec.glucose || rec.bmi || rec.temperature) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      background: '#f8fafc',
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    {rec.systolicBp && rec.diastolicBp && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Blood Pressure: </span>
                        <strong>{rec.systolicBp}/{rec.diastolicBp} mmHg</strong>
                      </div>
                    )}
                    {rec.glucose && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Fasting Glucose: </span>
                        <strong>{rec.glucose} mg/dL</strong>
                      </div>
                    )}
                    {rec.bmi && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>BMI: </span>
                        <strong>{rec.bmi}</strong>
                      </div>
                    )}
                    {rec.heartRate && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Heart Rate: </span>
                        <strong>{rec.heartRate} bpm</strong>
                      </div>
                    )}
                    {rec.temperature && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Temp: </span>
                        <strong>{rec.temperature} °F</strong>
                      </div>
                    )}
                    {rec.aiAnomalyDetected && (
                      <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>
                        Anomaly Detected: {rec.aiAnomalyDetails}
                      </span>
                    )}
                  </div>
                )}

                {/* Symptoms & Diagnosis */}
                <div style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <p style={{ marginBottom: '0.35rem' }}>
                    <strong style={{ color: 'var(--text-main)' }}>Symptoms: </strong>
                    <span style={{ color: 'var(--text-muted)' }}>{rec.symptoms}</span>
                  </p>
                  <p style={{ marginBottom: '0.35rem' }}>
                    <strong style={{ color: 'var(--text-main)' }}>Diagnosis: </strong>
                    <span>{rec.diagnosis}</span>
                  </p>
                  {rec.clinicalNotes && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      Doctor Notes: {rec.clinicalNotes}
                    </p>
                  )}
                </div>

                {/* Prescriptions under this visit */}
                {rec.prescriptions?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                      <Pill size={15} /> Prescribed Medications:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {rec.prescriptions.map((p: any) => (
                        <div
                          key={p.id}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <strong>{p.medicineName}</strong> &bull; {p.dosage} ({p.frequency}) for {p.durationDays} days
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lab Reports ordered in this visit */}
                {rec.labReports?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                      <FileText size={15} /> Laboratory Findings:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {rec.labReports.map((l: any) => (
                        <div
                          key={l.id}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: l.isOutOfRange ? '#fef2f2' : '#ecfdf5',
                            border: l.isOutOfRange ? '1px solid #fecaca' : '1px solid #a7f3d0',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <strong>{l.testName}:</strong> {l.measuredValue} {l.unit}{' '}
                          {l.isOutOfRange && (
                            <span style={{ color: '#b91c1c', fontWeight: 700 }}>({l.outOfRangeType})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
