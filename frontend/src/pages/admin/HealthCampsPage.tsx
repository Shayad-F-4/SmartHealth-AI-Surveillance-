import React, { useEffect, useState } from 'react';
import { Tent, Plus, CheckCircle2, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export const HealthCampsPage: React.FC = () => {
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [screeningCamp, setScreeningCamp] = useState<any>(null);

  // Camp Form
  const [district, setDistrict] = useState('Riverside District');
  const [venue, setVenue] = useState('Riverside Civic Hall');
  const [targetDisease, setTargetDisease] = useState('Malaria');
  const [campDate, setCampDate] = useState('2026-09-15');
  const [capacity, setCapacity] = useState('300');
  const [doctorsAssigned, setDoctorsAssigned] = useState('Dr. Priya Nair, Dr. Rajesh Sharma');

  // Screening Form
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('35');
  const [gender, setGender] = useState('FEMALE');
  const [symptoms, setSymptoms] = useState('Low grade fever, joint pain');
  const [suspectedDisease, setSuspectedDisease] = useState('Malaria');
  const [vitalsSummary, setVitalsSummary] = useState('BP 124/82, Temp 99.8°F');
  const [referred, setReferred] = useState(false);
  const [referralSpecialty, setReferralSpecialty] = useState('Infectious Diseases');

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/camps');
      setCamps(res.data);
    } catch (err) {
      console.error('Failed to load health camps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/camps', {
        district,
        venue,
        targetDisease,
        campDate,
        capacity: parseInt(capacity),
        doctorsAssigned,
      });
      setShowCreate(false);
      fetchCamps();
    } catch (err) {
      alert('Failed to create health camp');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/camps/${id}/status`, { status: 'APPROVED' });
      fetchCamps();
    } catch (err) {
      alert('Failed to approve camp');
    }
  };

  const handleRecordScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screeningCamp) return;
    try {
      await api.post(`/camps/${screeningCamp.id}/screenings`, {
        patientName,
        age: parseInt(age),
        gender,
        symptoms,
        suspectedDisease,
        vitalsSummary,
        referred,
        referralSpecialty: referred ? referralSpecialty : null,
      });
      alert(`Screening recorded! Disease telemetry for ${suspectedDisease} automatically streamed into central surveillance.`);
      setPatientName('');
      setScreeningCamp(null);
      fetchCamps();
    } catch (err) {
      alert('Failed to record screening');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tent size={24} color="var(--primary-600)" /> Community Outbreak Screening Camps
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            AI-recommended preventive health camps deployed to high-risk zones. Screening outcomes stream directly back into central surveillance.
          </p>
        </div>

        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
          <Plus size={16} /> Schedule Health Camp
        </button>
      </div>

      {/* Camp Scheduling Form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Deploy Community Health Camp</h3>
          <form onSubmit={handleCreateCamp}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Deployment District *</label>
                <select className="form-select" value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="Riverside District">Riverside District (Outbreak Epicenter)</option>
                  <option value="Metro North">Metro North</option>
                  <option value="Green Valley">Green Valley</option>
                  <option value="Downtown Central">Downtown Central</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Venue Location *</label>
                <input required className="form-input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Community Civic Center" />
              </div>

              <div className="form-group">
                <label className="form-label">Target Disease Focus *</label>
                <select className="form-select" value={targetDisease} onChange={(e) => setTargetDisease(e.target.value)}>
                  <option value="Malaria">Malaria</option>
                  <option value="Dengue">Dengue</option>
                  <option value="Typhoid">Typhoid</option>
                  <option value="General Fever & Vitals">General Fever & Vitals</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Camp Date *</label>
                <input type="date" required className="form-input" value={campDate} onChange={(e) => setCampDate(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Screening Capacity</label>
                <input type="number" className="form-input" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Medical Staff / Doctors</label>
                <input className="form-input" value={doctorsAssigned} onChange={(e) => setDoctorsAssigned(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm & Deploy Camp
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Screening Modal/Panel */}
      {screeningCamp && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f0fdf4', border: '2px solid #86efac' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 800, color: '#166534' }}>
              Record Field Screening Attendee &bull; {screeningCamp.venue} ({screeningCamp.district})
            </h3>
            <button onClick={() => setScreeningCamp(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              &times; Close
            </button>
          </div>

          <form onSubmit={handleRecordScreening}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Attendee Name *</label>
                <input required className="form-input" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Attendee name" />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" required className="form-input" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Suspected Disease</label>
                <input className="form-input" value={suspectedDisease} onChange={(e) => setSuspectedDisease(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Presenting Symptoms *</label>
                <input required className="form-input" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g. Fever, chills, body ache" />
              </div>

              <div className="form-group">
                <label className="form-label">Quick Vitals Summary</label>
                <input className="form-input" value={vitalsSummary} onChange={(e) => setVitalsSummary(e.target.value)} placeholder="e.g. BP 120/80, Temp 100.2°F" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <input type="checkbox" id="refCheck" checked={referred} onChange={(e) => setReferred(e.target.checked)} />
              <label htmlFor="refCheck" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Refer to Hospital / Specialist</label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setScreeningCamp(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save & Stream to Surveillance
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Camps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {camps.map((c) => (
          <div key={c.id} className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {c.venue}
                  </span>
                  <span className="badge badge-info">{c.district}</span>
                  <span className={`badge ${c.status === 'APPROVED' ? 'badge-success' : (c.status === 'RECOMMENDED' ? 'badge-danger' : 'badge-purple')}`}>
                    {c.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <strong>Target Disease:</strong> {c.targetDisease} &bull; <strong>Scheduled Date:</strong> {new Date(c.campDate).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {c.status === 'RECOMMENDED' && (
                  <button onClick={() => handleApprove(c.id)} className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
                    Approve Camp
                  </button>
                )}
                <button
                  onClick={() => { setScreeningCamp(c); setSuspectedDisease(c.targetDisease); }}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                >
                  + Record Attendee Screening
                </button>
              </div>
            </div>

            {c.recommendationReason && (
              <div style={{ background: '#fef2f2', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.82rem', color: '#991b1b', marginBottom: '0.75rem' }}>
                <strong>AI Outbreak Trigger:</strong> {c.recommendationReason}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
              <div>Capacity: <strong>{c.capacity}</strong></div>
              <div>Screened Attendees: <strong style={{ color: '#0284c7' }}>{c.screenedCount || 0}</strong></div>
              <div>Staff Assigned: <strong>{c.doctorsAssigned}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
