import React, { useEffect, useState } from 'react';
import { TrendingUp, HeartPulse, Activity } from 'lucide-react';
import { BpTrendChart, GlucoseTrendChart } from '../../components/HealthCharts';
import api from '../../services/api';

export const HealthTrendsPage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const url = patientId ? `/patients/analytics/${patientId}` : '/patients/analytics';
        const res = await api.get(url);
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load health analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [patientId]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <TrendingUp size={24} color="var(--primary-600)" /> Personal Health Trends & Biometrics
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Longitudinal tracking of blood pressure, fasting glycemia, and physiological vitals across clinical encounters.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading biometric trends...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Blood Pressure Trends Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <HeartPulse size={18} color="#ef4444" />
                Blood Pressure Progression (Systolic & Diastolic)
              </h3>
              <span className="badge badge-info">Target: &lt; 120/80 mmHg</span>
            </div>
            <BpTrendChart data={analytics?.bpSeries || []} />
          </div>

          {/* Blood Glucose Trends Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Activity size={18} color="#f59e0b" />
                Fasting Blood Glucose Progression
              </h3>
              <span className="badge badge-info">Normal: 70 - 99 mg/dL</span>
            </div>
            <GlucoseTrendChart data={analytics?.glucoseSeries || []} />
          </div>
        </div>
      )}
    </div>
  );
};
