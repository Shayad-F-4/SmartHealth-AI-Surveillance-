import React, { useEffect, useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../services/api';

export const LabReportsPage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      try {
        const url = patientId ? `/labs/patient/${patientId}` : '/labs';
        const res = await api.get(url);
        setLabs(res.data);
      } catch (err) {
        console.error('Failed to fetch labs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, [patientId]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={24} color="var(--primary-600)" /> Laboratory Diagnostics & Trend Analytics
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Biochemical, hematological, and serological test results with automated reference-range checks and longitudinal trend anomaly flags.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading laboratory records...
        </div>
      ) : labs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No laboratory reports found.
        </div>
      ) : (
        <div className="card" style={{ padding: '1rem' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Category</th>
                  <th>Result Value</th>
                  <th>Normal Reference Range</th>
                  <th>Status Flag</th>
                  <th>Trend Signal</th>
                  <th>Date</th>
                  <th>Technician / Lab</th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr key={lab.id} style={{ background: lab.isOutOfRange ? '#fffbfb' : 'transparent' }}>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{lab.testName}</strong>
                      {lab.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lab.notes}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">{lab.testCategory}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: lab.isOutOfRange ? '#b91c1c' : 'var(--text-main)' }}>
                        {lab.measuredValue}
                      </span>{' '}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lab.unit}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {lab.normalRangeMin} - {lab.normalRangeMax} {lab.unit}
                      </span>
                    </td>
                    <td>
                      {lab.isOutOfRange ? (
                        <span className="badge badge-danger">
                          {lab.outOfRangeType === 'HIGH' ? '▲ HIGH' : '▼ LOW'}
                        </span>
                      ) : (
                        <span className="badge badge-success">✓ NORMAL</span>
                      )}
                    </td>
                    <td>
                      {lab.trendWarning ? (
                        <div style={{ color: '#b45309', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={14} color="#f59e0b" />
                          <span>{lab.trendWarning}</span>
                        </div>
                      ) : lab.trendDirection === 'UPWARD' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#0284c7' }}>
                          <TrendingUp size={14} /> Upward
                        </span>
                      ) : lab.trendDirection === 'DOWNWARD' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#64748b' }}>
                          <TrendingDown size={14} /> Downward
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.78rem' }}>&mdash;</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(lab.reportDate).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {lab.labTechnician || 'Diagnostic Laboratory'}
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
