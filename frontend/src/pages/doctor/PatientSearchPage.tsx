import React, { useState, useEffect } from 'react';
import {
  Search,
  QrCode,
  User,
  Clock,
  Layers,
  GitFork,
  FileText,
  PlusCircle,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { SmartHealthCard } from '../../components/SmartHealthCard';
import { MedicalTimelinePage } from '../patient/MedicalTimelinePage';
import { DiseaseEpisodesPage } from '../patient/DiseaseEpisodesPage';
import { FamilyTree } from '../../components/FamilyTree';
import { LabReportsPage } from '../patient/LabReportsPage';
import api from '../../services/api';

export const PatientSearchPage: React.FC<{
  onStartConsultation: (patient: any) => void;
}> = ({ onStartConsultation }) => {
  const [query, setQuery] = useState('SHC-2026-000001'); // Pre-fill default demo ID
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [familyData, setFamilyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'episodes' | 'family' | 'labs' | 'card'>('timeline');
  const [loading, setLoading] = useState(false);
  const [showQrSimulator, setShowQrSimulator] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get('/doctors/patients', { params: { q: query } });
      setPatients(res.data);
      if (res.data.length === 1) {
        loadPatientDetails(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to search patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patientId: string) => {
    try {
      const [fullRes, famRes] = await Promise.all([
        api.get(`/doctors/patients/${patientId}/full-history`),
        api.get(`/family/tree/${patientId}`),
      ]);
      setSelectedPatient(fullRes.data);
      setFamilyData(famRes.data);
    } catch (err) {
      console.error('Failed to load patient full history:', err);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Search size={24} color="var(--primary-600)" /> Patient Health ID & QR Scanner
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Authorized clinical intake. Search by Smart Health ID (e.g. SHC-2026-000001), name, or phone number.
          </p>
        </div>

        <button
          onClick={() => setShowQrSimulator(!showQrSimulator)}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <QrCode size={18} /> QR Scanner Terminal
        </button>
      </div>

      {/* QR Scanner Simulator Modal/Panel */}
      {showQrSimulator && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#0f172a', color: 'white', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <QrCode size={20} color="#38bdf8" /> Optical QR Reader Terminal
            </div>
            <button onClick={() => setShowQrSimulator(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              &times; Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div style={{ border: '2px dashed #0284c7', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: 'rgba(2, 132, 199, 0.08)' }}>
              <QrCode size={48} color="#0284c7" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Camera Scanner Ready</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Point camera at patient's Smart Health Card QR Code</div>
            </div>

            <div>
              <div style={{ fontSize: '0.82rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Or simulate instant scan of demo patient:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => { setQuery('SHC-2026-000001'); handleSearch(); setShowQrSimulator(false); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}
                >
                  ⚡ Scan QR: Rahul Verma (SHC-2026-000001)
                </button>
                <button
                  type="button"
                  onClick={() => { setQuery('SHC-2026-000002'); handleSearch(); setShowQrSimulator(false); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}
                >
                  ⚡ Scan QR: Patient 2 (SHC-2026-000002)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Health ID (SHC-2026-000001), Patient Name, or Phone..."
            style={{ fontSize: '0.95rem' }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 1.5rem', whiteSpace: 'nowrap' }}>
            <Search size={16} /> {loading ? 'Searching...' : 'Search Records'}
          </button>
        </form>
      </div>

      {/* Search Results & Selected Patient View */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '340px 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Results List */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Matching Patient Records ({patients.length})
          </div>

          {patients.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No matching records found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {patients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => loadPatientDetails(p.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: selectedPatient?.id === p.id ? '2px solid var(--primary-500)' : '1px solid var(--border-light)',
                    background: selectedPatient?.id === p.id ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {p.user?.name}
                    </div>
                    <span className="badge badge-danger">{p.bloodGroup}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-700)', marginTop: '0.2rem' }}>
                    {p.healthId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {p.district} &bull; {p.user?.phone}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Patient Full Clinical File */}
        {selectedPatient && (
          <div>
            {/* Patient Header Banner */}
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem', background: '#f8fafc', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedPatient.user?.name}
                    </h3>
                    <span className="badge badge-danger" style={{ fontSize: '0.85rem' }}>
                      Blood: {selectedPatient.bloodGroup}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      {selectedPatient.healthId}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <strong>District:</strong> {selectedPatient.district} &bull; <strong>Allergies:</strong>{' '}
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>
                      {selectedPatient.allergies || 'None reported'}
                    </span>{' '}
                    &bull; <strong>Chronic:</strong> {selectedPatient.chronicConditions || 'None'}
                  </div>
                </div>

                <button
                  onClick={() => onStartConsultation(selectedPatient)}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.25rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}
                >
                  <PlusCircle size={18} /> Start Consultation with this Patient
                </button>
              </div>

              {/* Sub-tabs for patient detail */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <Clock size={14} /> Medical Timeline ({selectedPatient.medicalRecords?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('episodes')}
                  className={`btn ${activeTab === 'episodes' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <Layers size={14} /> Disease Episodes ({selectedPatient.diseaseEpisodes?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('family')}
                  className={`btn ${activeTab === 'family' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <GitFork size={14} /> Family Tree
                </button>
                <button
                  onClick={() => setActiveTab('labs')}
                  className={`btn ${activeTab === 'labs' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <FileText size={14} /> Lab Diagnostics ({selectedPatient.labReports?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('card')}
                  className={`btn ${activeTab === 'card' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <CreditCard size={14} /> Smart Health Card
                </button>
              </div>
            </div>

            {/* Active Tab Contents */}
            {activeTab === 'timeline' && <MedicalTimelinePage patientId={selectedPatient.id} />}
            {activeTab === 'episodes' && <DiseaseEpisodesPage patientId={selectedPatient.id} />}
            {activeTab === 'family' && familyData && (
              <FamilyTree treeData={familyData} onRefresh={() => loadPatientDetails(selectedPatient.id)} canEdit={false} />
            )}
            {activeTab === 'labs' && <LabReportsPage patientId={selectedPatient.id} />}
            {activeTab === 'card' && (
              <SmartHealthCard
                cardData={{
                  patientName: selectedPatient.user?.name,
                  healthId: selectedPatient.healthId,
                  gender: selectedPatient.gender,
                  bloodGroup: selectedPatient.bloodGroup,
                  district: selectedPatient.district,
                  emergencyContactName: selectedPatient.emergencyContactName,
                  emergencyContactPhone: selectedPatient.emergencyContactPhone,
                  allergies: selectedPatient.allergies,
                  chronicConditions: selectedPatient.chronicConditions,
                  qrValue: `${window.location.origin}/emergency/${selectedPatient.healthId}`,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
