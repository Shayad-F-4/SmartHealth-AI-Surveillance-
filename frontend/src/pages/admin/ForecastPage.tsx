import React, { useEffect, useState } from 'react';
import { LineChart, Filter, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { DiseaseForecastChart } from '../../components/HealthCharts';
import api from '../../services/api';

export const ForecastPage: React.FC = () => {
  const [disease, setDisease] = useState('Malaria');
  const [district, setDistrict] = useState('Riverside District');
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get('/surveillance/forecast', {
        params: { disease, district, weeks: 4 },
      });
      setForecastData(res.data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [disease, district]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <LineChart size={24} color="var(--primary-600)" /> Machine Learning Epidemiological Forecasting
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Autoregressive Lag Forecaster (Model D: Ridge Regression) predicting upcoming 4-week outbreak trajectories based on weekly case momentum.
        </p>
      </div>

      {/* Selectors */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Disease:</span>
          <select className="form-select" style={{ width: 'auto' }} value={disease} onChange={(e) => setDisease(e.target.value)}>
            <option value="Malaria">Malaria</option>
            <option value="Dengue">Dengue</option>
            <option value="Typhoid">Typhoid</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Surveillance District:</span>
          <select className="form-select" style={{ width: 'auto' }} value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="Riverside District">Riverside District (Outbreak Epicenter)</option>
            <option value="Metro North">Metro North</option>
            <option value="Downtown Central">Downtown Central</option>
            <option value="Green Valley">Green Valley</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Computing predictive autoregressive time-series trajectory...
        </div>
      ) : forecastData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Trajectory Summary Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div>
                <div className="metric-label">Current Weekly Cases</div>
                <div className="metric-val">{forecastData.current_weekly_cases}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Observed this week</span>
              </div>
              <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="metric-card">
              <div>
                <div className="metric-label">Projected Trend</div>
                <div className="metric-val" style={{ color: forecastData.trend === 'INCREASING' ? '#ef4444' : '#10b981' }}>
                  {forecastData.trend}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Growth: +{forecastData.projected_growth_rate_pct}%
                </span>
              </div>
              <div className="metric-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
            </div>

            <div className="metric-card">
              <div>
                <div className="metric-label">Outbreak Risk Classification</div>
                <div className="metric-val" style={{ fontSize: '1.4rem' }}>
                  <span className={`badge ${forecastData.risk_indicator === 'HIGH_RISK' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                    {forecastData.risk_indicator}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next 4 weeks horizon</span>
              </div>
              <div className="metric-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                <LineChart size={24} />
              </div>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <TrendingUp size={18} color="var(--primary-600)" />
                4-Week Projected Case Curve & Historical Trend
              </h3>
              <span className="badge badge-purple">{forecastData.model_used}</span>
            </div>

            <DiseaseForecastChart
              historical={forecastData.historicalSeries || []}
              forecast={forecastData.predicted_weekly_cases || []}
              diseaseName={disease}
            />

            {/* Numerical Weekly Projection Breakdown */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                Forecasted Weekly Case Volumes:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
                {forecastData.predicted_weekly_cases?.map((cases: number, i: number) => (
                  <div key={i} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Week +{i + 1}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c' }}>{cases}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>projected cases</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Info size={14} /> Disclaimer: {forecastData.disclaimer}
          </div>
        </div>
      ) : null}
    </div>
  );
};
