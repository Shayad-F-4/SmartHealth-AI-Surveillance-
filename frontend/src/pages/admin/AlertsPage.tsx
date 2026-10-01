import React, { useEffect, useState } from 'react';
import { AlertTriangle, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form
  const [district, setDistrict] = useState('Riverside District');
  const [disease, setDisease] = useState('Malaria');
  const [riskLevel, setRiskLevel] = useState('HIGH_RISK');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [precautions, setPrecautions] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts/history');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/alerts', {
        district,
        disease,
        riskLevel,
        title,
        message,
        precautions,
      });
      setShowCreate(false);
      setTitle('');
      setMessage('');
      setPrecautions('');
      fetchAlerts();
    } catch (err: any) {
      alert('Failed to publish alert');
    }
  };

  const handleToggleStatus = async (id: string, current: boolean) => {
    try {
      await api.put(`/alerts/${id}/status`, { isActive: !current });
      fetchAlerts();
    } catch (err) {
      alert('Failed to update alert');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={24} color="#f59e0b" /> Community Health Outbreak Alerts
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Location-specific advisories automatically dispatched to registered residents living within active outbreak districts.
          </p>
        </div>

        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
          <Plus size={16} /> Broadcast Custom Advisory
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Broadcast Location-Based Advisory</h3>
          <form onSubmit={handleCreateAlert}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Target District</label>
                <select className="form-select" value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="Riverside District">Riverside District</option>
                  <option value="Metro North">Metro North</option>
                  <option value="Green Valley">Green Valley</option>
                  <option value="Highland Park">Highland Park</option>
                  <option value="Downtown Central">Downtown Central</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Disease Focus</label>
                <select className="form-select" value={disease} onChange={(e) => setDisease(e.target.value)}>
                  <option value="Malaria">Malaria</option>
                  <option value="Dengue">Dengue</option>
                  <option value="Typhoid">Typhoid</option>
                  <option value="COVID-19">COVID-19</option>
                  <option value="Cholera">Cholera</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Risk Escalation</label>
                <select className="form-select" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                  <option value="WARNING">Warning Advisory</option>
                  <option value="HIGH_RISK">Critical High Risk Alert</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alert Title *</label>
              <input required className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 🚨 High-Risk Malaria Alert in Riverside District" />
            </div>

            <div className="form-group">
              <label className="form-label">Public Advisory Message *</label>
              <textarea required rows={2} className="form-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Explain observed epidemiological increase..." />
            </div>

            <div className="form-group">
              <label className="form-label">Preventive Action Guidelines *</label>
              <textarea required rows={2} className="form-textarea" value={precautions} onChange={(e) => setPrecautions(e.target.value)} placeholder="Recommended resident precautions..." />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Broadcast to Residents
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Active & Historical Outbreak Bulletins</h3>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No alerts currently dispatched.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map((al) => (
              <div
                key={al.id}
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  background: al.isActive ? '#ffffff' : '#f8fafc',
                  opacity: al.isActive ? 1 : 0.65,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${al.riskLevel === 'HIGH_RISK' ? 'badge-danger' : 'badge-warning'}`}>
                      {al.riskLevel}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{al.title}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>&bull; {al.district}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {new Date(al.createdAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(al.id, al.isActive)}
                      className={`btn ${al.isActive ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      {al.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {al.message}
                </p>

                <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                  <strong>Resident Guidelines: </strong> {al.precautions}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
