import React, { useEffect, useState } from 'react';
import { Flame, Filter, MapPin, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const HotspotsPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [diseaseFilter, setDiseaseFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const res = await api.get('/surveillance/hotspots', {
        params: { disease: diseaseFilter, district: districtFilter },
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load hotspots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, [diseaseFilter, districtFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Flame size={24} color="#ef4444" /> Geospatial DBSCAN Hotspot Detection
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Unsupervised density-based clustering identifying geographic disease clusters and transmission epicenters.
          </p>
        </div>

        <button onClick={() => onNavigate('surveillance-map')} className="btn btn-primary">
          <MapPin size={16} /> View on Map
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Disease:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={diseaseFilter}
            onChange={(e) => setDiseaseFilter(e.target.value)}
          >
            <option value="ALL">All Diseases</option>
            <option value="Malaria">Malaria</option>
            <option value="Dengue">Dengue</option>
            <option value="Typhoid">Typhoid</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>District:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="ALL">All Districts</option>
            <option value="Riverside District">Riverside District</option>
            <option value="Metro North">Metro North</option>
            <option value="Green Valley">Green Valley</option>
            <option value="Highland Park">Highland Park</option>
            <option value="Downtown Central">Downtown Central</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div>
            <div className="metric-label">Detected Spatial Clusters</div>
            <div className="metric-val" style={{ color: '#ef4444' }}>{data?.total_clusters || 0}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DBSCAN Density Metric</span>
          </div>
          <div className="metric-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <Flame size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Cases Inside Clusters</div>
            <div className="metric-val">{data?.total_cases_analyzed ? data.total_cases_analyzed - (data.noise_cases || 0) : 0}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clustered Outbreak Cases</span>
          </div>
          <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <MapPin size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Sporadic / Noise Cases</div>
            <div className="metric-val">{data?.noise_cases || 0}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Non-cluster presentations</span>
          </div>
          <div className="metric-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Clusters Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Identified Outbreak Cluster Hotspots</h3>
          <span className="badge badge-purple">Algorithm: DBSCAN (eps=2.5km, min_samples=3)</span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Running spatial clustering pipeline...</div>
        ) : data?.hotspots?.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No significant spatial hotspots detected under current filters.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Cluster Identifier</th>
                  <th>Disease</th>
                  <th>District</th>
                  <th>Centroid Coordinates</th>
                  <th>Active Cases</th>
                  <th>Cluster Radius</th>
                  <th>Severity Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.hotspots?.map((h: any) => (
                  <tr key={h.cluster_id} style={{ background: h.severity === 'HIGH_RISK' ? '#fef2f2' : '#ffffff' }}>
                    <td>
                      <strong style={{ color: h.severity === 'HIGH_RISK' ? '#b91c1c' : 'var(--text-main)' }}>
                        {h.cluster_id}
                      </strong>
                    </td>
                    <td>{h.disease}</td>
                    <td>{h.district}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {h.center_lat}, {h.center_lng}
                    </td>
                    <td>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: h.severity === 'HIGH_RISK' ? '#b91c1c' : '#b45309' }}>
                        {h.case_count}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>~{h.radius_km} km</td>
                    <td>
                      <span className={`badge ${h.severity === 'HIGH_RISK' ? 'badge-danger' : (h.severity === 'WARNING' ? 'badge-warning' : 'badge-success')}`}>
                        {h.severity}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onNavigate('health-camps')}
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                      >
                        Deploy Camp &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
