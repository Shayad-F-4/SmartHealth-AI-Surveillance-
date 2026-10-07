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
  ArrowLeft,
  HeartPulse,
  Pill,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Brain,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { SmartHealthCard } from '../../components/SmartHealthCard';
import { MedicalTimelinePage } from '../patient/MedicalTimelinePage';
import { DiseaseEpisodesPage } from '../patient/DiseaseEpisodesPage';
import { FamilyTree } from '../../components/FamilyTree';
import { LabReportsPage } from '../patient/LabReportsPage';
import { HealthTrendsPage } from '../patient/HealthTrendsPage';
import { ClinicalDecisionSupportView } from '../../components/ClinicalDecisionSupportView';
import api from '../../services/api';

interface DoctorPatientsPageProps {
  initialPatient?: any;
  initialMode?: 'view' | 'consultation';
}

export const DoctorPatientsPage: React.FC<DoctorPatientsPageProps> = ({
  initialPatient = null,
  initialMode = 'view',
}) => {
  const [query, setQuery] = useState('SHC-2026-000001'); // Pre-fill default demo ID
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(initialPatient);
  const [familyData, setFamilyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'episodes' | 'trends' | 'family' | 'labs' | 'card' | 'cds'>('timeline');
  const [loading, setLoading] = useState(false);
  const [showQrSimulator, setShowQrSimulator] = useState(false);
  const [isConsulting, setIsConsulting] = useState(initialMode === 'consultation' && !!initialPatient);

  // ─── Consultation Form State ──────────────────────────────────────────
  const [systolicBp, setSystolicBp] = useState('130');
  const [diastolicBp, setDiastolicBp] = useState('84');
  const [glucose, setGlucose] = useState('110');
  const [bmi, setBmi] = useState('26.4');
  const [heartRate, setHeartRate] = useState('78');
  const [temperature, setTemperature] = useState('98.8');
  const [spo2, setSpo2] = useState('98');

  const [symptoms, setSymptoms] = useState('Fever, chills, and body aches for 3 days');
  const [diagnosis, setDiagnosis] = useState('Acute Malaria (Plasmodium vivax suspected)');
  const [disease, setDisease] = useState('Malaria');
  const [severity, setSeverity] = useState('MODERATE');
  const [clinicalNotes, setClinicalNotes] = useState('Prescribing ACT regimen. Patient instructed to hydrate and report if fever spikes.');
  const [visitClassification, setVisitClassification] = useState('NEW_CONDITION');

  const [prescriptions, setPrescriptions] = useState<any[]>([
    { medicineName: 'Artemether + Lumefantrine', dosage: '80mg/480mg', frequency: 'Twice daily with milk', durationDays: '3' },
  ]);

  const [labReports, setLabReports] = useState<any[]>([
    { testName: 'Peripheral Smear for Malaria', testCategory: 'Hematology', measuredValue: '1', unit: 'index', normalRangeMin: '0', normalRangeMax: '0' },
  ]);

  const [createReferral, setCreateReferral] = useState(false);
  const [referralSpecialty, setReferralSpecialty] = useState('Infectious Diseases');
  const [referralReason, setReferralReason] = useState('Severe thrombocytopenia review');
  const [referralPriority, setReferralPriority] = useState('ROUTINE');

  const [allergyConflicts, setAllergyConflicts] = useState<string[]>([]);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ─── Patient Search & Loading ──────────────────────────────────────────
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get('/doctors/patients', { params: { q: query } });
      setPatients(res.data);
      if (res.data.length === 1 && !selectedPatient) {
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
      setIsConsulting(false);
    } catch (err) {
      console.error('Failed to load patient full history:', err);
    }
  };

  useEffect(() => {
    if (initialPatient?.id) {
      loadPatientDetails(initialPatient.id);
      if (initialMode === 'consultation') {
        setIsConsulting(true);
      }
    } else {
      handleSearch();
    }
  }, [initialPatient]);

  // ─── Real-time Allergy Cross-Check ────────────────────────────────────
  useEffect(() => {
    if (!selectedPatient?.allergies) {
      setAllergyConflicts([]);
      return;
    }

    const patientAllergies = selectedPatient.allergies
      .toLowerCase()
      .split(/[,;]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    const conflicts: string[] = [];
    prescriptions.forEach((p) => {
      const medName = (p.medicineName || '').toLowerCase();
      patientAllergies.forEach((allergy: string) => {
        if (allergy && medName.includes(allergy)) {
          conflicts.push(`Prescription "${p.medicineName}" conflicts with known patient allergy: "${allergy.toUpperCase()}".`);
        }
      });
    });

    setAllergyConflicts(conflicts);
  }, [prescriptions, selectedPatient]);

  // ─── Prescription Helpers ─────────────────────────────────────────────
  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { medicineName: '', dosage: '', frequency: 'Once daily', durationDays: '5' }]);
  };

  const updatePrescriptionRow = (idx: number, field: string, val: any) => {
    const updated = [...prescriptions];
    updated[idx][field] = val;
    setPrescriptions(updated);
  };

  const removePrescriptionRow = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  // ─── Lab Helpers ──────────────────────────────────────────────────────
  const addLabRow = () => {
    setLabReports([...labReports, { testName: '', testCategory: 'Biochemistry', measuredValue: '', unit: '', normalRangeMin: '', normalRangeMax: '' }]);
  };

  const updateLabRow = (idx: number, field: string, val: any) => {
    const updated = [...labReports];
    updated[idx][field] = val;
    setLabReports(updated);
  };

  const removeLabRow = (idx: number) => {
    setLabReports(labReports.filter((_, i) => i !== idx));
  };

  // ─── Submit Consultation ──────────────────────────────────────────────
  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient first.');
      return;
    }

    if (allergyConflicts.length > 0) {
      const confirmed = window.confirm(
        '⚠️ CRITICAL ALLERGY CONFLICT DETECTED!\n\n' +
        allergyConflicts.join('\n') +
        '\n\nDo you want to proceed with this prescription despite the allergy alert?'
      );
      if (!confirmed) return;
    }

    setSavingConsultation(true);
    setSuccessMessage(null);

    try {
      const payload = {
        patientId: selectedPatient.id,
        symptoms,
        diagnosis,
        disease,
        severity,
        clinicalNotes,
        visitClassification,
        systolicBp: parseFloat(systolicBp) || null,
        diastolicBp: parseFloat(diastolicBp) || null,
        glucose: parseFloat(glucose) || null,
        bmi: parseFloat(bmi) || null,
        heartRate: parseFloat(heartRate) || null,
        temperature: parseFloat(temperature) || null,
        spo2: parseFloat(spo2) || null,
        locationDistrict: selectedPatient.district,
        prescriptions: prescriptions.filter((p) => p.medicineName.trim()),
        labReports: labReports.filter((l) => l.testName.trim()),
        referral: createReferral
          ? {
              targetSpecialty: referralSpecialty,
              reason: referralReason,
              priority: referralPriority,
            }
          : null,
      };

      const res = await api.post('/visits', payload);
      setSuccessMessage(
        `✓ Consultation recorded successfully! Visit ID: ${res.data.record?.id || 'Saved'}. ` +
        `Epidemiological data synchronized with surveillance command center.`
      );

      // Reload patient details to show new visit in timeline
      await loadPatientDetails(selectedPatient.id);
      setIsConsulting(false);
      setActiveTab('timeline');
    } catch (err: any) {
      console.error('Failed to create consultation:', err);
      alert('Failed to save consultation: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingConsultation(false);
    }
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Stethoscope size={26} color="var(--primary-600)" /> Unified Patients Workflow
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Search or scan patient QR, review comprehensive medical history, and record consultations in one seamless workflow.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowQrSimulator(!showQrSimulator)}
            className="btn btn-outline"
            style={{ gap: '0.5rem' }}
          >
            <QrCode size={17} /> QR Reader Terminal
          </button>
          {selectedPatient && !isConsulting && (
            <button
              onClick={() => setIsConsulting(true)}
              className="btn btn-primary"
              style={{ gap: '0.5rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)' }}
            >
              <PlusCircle size={18} /> Start Consultation
            </button>
          )}
        </div>
      </div>

      {/* ── Optical QR Reader Terminal Simulator ────────────────────────── */}
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
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Optical Camera Ready</div>
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

      {/* ── Success Alert Banner ────────────────────────────────────────── */}
      {successMessage && (
        <div className="alert-banner alert-banner-success" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
        </div>
      )}

      {/* ── Search Bar ──────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient by Smart Health ID (e.g. SHC-2026-000001), name, or phone number..."
            style={{ fontSize: '0.95rem' }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 1.5rem', whiteSpace: 'nowrap' }}>
            <Search size={16} /> {loading ? 'Searching...' : 'Search Patient'}
          </button>
        </form>
      </div>

      {/* ── Main Layout: Patient Selector + Workflow View ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '320px 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Patient Selection Column */}
        <div className="card" style={{ padding: '1rem', height: 'fit-content' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Search Results ({patients.length})
          </div>

          {patients.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No matching patient records. Try searching "SHC-2026-000001".
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {p.user?.name}
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>{p.bloodGroup}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-700)', marginTop: '0.2rem' }}>
                    {p.healthId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {p.district} &bull; {p.user?.phone || 'No phone'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Area: Either Patient File OR Consultation Form */}
        {selectedPatient ? (
          <div>
            {/* Patient File Header */}
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem', background: '#f8fafc', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {selectedPatient.user?.name}
                    </h3>
                    <span className="badge badge-danger" style={{ fontSize: '0.82rem' }}>
                      Blood: {selectedPatient.bloodGroup}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      {selectedPatient.healthId}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <strong>District:</strong> {selectedPatient.district} &bull;{' '}
                    <strong>Allergies:</strong>{' '}
                    <span style={{ color: selectedPatient.allergies ? '#dc2626' : 'inherit', fontWeight: selectedPatient.allergies ? 700 : 400 }}>
                      {selectedPatient.allergies || 'None reported'}
                    </span>{' '}
                    &bull; <strong>Chronic:</strong> {selectedPatient.chronicConditions || 'None'}
                  </div>
                </div>

                <div>
                  {isConsulting ? (
                    <button
                      onClick={() => setIsConsulting(false)}
                      className="btn btn-outline"
                      style={{ gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <ArrowLeft size={16} /> Back to Patient Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsConsulting(true)}
                      className="btn btn-primary"
                      style={{ gap: '0.5rem', padding: '0.65rem 1.25rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}
                    >
                      <PlusCircle size={18} /> Start Consultation
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-tabs when in viewing mode */}
              {!isConsulting && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
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
                    onClick={() => setActiveTab('trends')}
                    className={`btn ${activeTab === 'trends' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                  >
                    <TrendingUp size={14} /> Health Trends
                  </button>
                  <button
                    onClick={() => setActiveTab('family')}
                    className={`btn ${activeTab === 'family' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                  >
                    <GitFork size={14} /> Family Health Tree
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
                  <button
                    onClick={() => setActiveTab('cds')}
                    className={`btn ${activeTab === 'cds' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                  >
                    <Brain size={14} /> Clinical Decision Support
                  </button>
                </div>
              )}
            </div>

            {/* Mode 1: Active Consultation Encounter Form */}
            {isConsulting ? (
              <form onSubmit={handleSubmitConsultation}>
                {/* Allergy Conflict Warning Banner */}
                {allergyConflicts.length > 0 && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.25rem' }}>
                    <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        CRITICAL SAFETY WARNING: Patient Drug Allergy Conflict
                      </div>
                      {allergyConflicts.map((c, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>&bull; {c}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 1: Clinical Vitals & Anomaly Flagging */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <h3 className="card-title">
                      <HeartPulse size={18} color="#ef4444" />
                      Patient Vitals &amp; Biometric Triage
                    </h3>
                    <span className="badge badge-purple">Automated Anomaly Check</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Systolic BP (mmHg)</label>
                      <input type="number" required className="form-input" value={systolicBp} onChange={(e) => setSystolicBp(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Diastolic BP (mmHg)</label>
                      <input type="number" required className="form-input" value={diastolicBp} onChange={(e) => setDiastolicBp(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fasting Glucose (mg/dL)</label>
                      <input type="number" required className="form-input" value={glucose} onChange={(e) => setGlucose(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Heart Rate (bpm)</label>
                      <input type="number" required className="form-input" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temperature (°F)</label>
                      <input type="number" step="0.1" required className="form-input" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">SpO2 (%)</label>
                      <input type="number" required className="form-input" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">BMI</label>
                      <input type="number" step="0.1" required className="form-input" value={bmi} onChange={(e) => setBmi(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Clinical Assessment & Diagnosis */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <h3 className="card-title">
                      <Brain size={18} color="var(--primary-600)" />
                      Diagnosis &amp; Public Health Disease Classification
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Contagious / Monitored Disease *</label>
                      <select className="form-select" value={disease} onChange={(e) => setDisease(e.target.value)}>
                        <option value="Malaria">Malaria (High-Risk Surveillance)</option>
                        <option value="Dengue">Dengue (Vector-Borne Surveillance)</option>
                        <option value="Typhoid">Typhoid (Waterborne Surveillance)</option>
                        <option value="COVID-19">COVID-19</option>
                        <option value="Cholera">Cholera</option>
                        <option value="Tuberculosis">Tuberculosis</option>
                        <option value="Hypertension">Hypertension (Non-Contagious)</option>
                        <option value="Type 2 Diabetes">Type 2 Diabetes (Non-Contagious)</option>
                        <option value="General Viral Infection">General Viral Infection</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Clinical Severity *</label>
                      <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                        <option value="MILD">MILD</option>
                        <option value="MODERATE">MODERATE</option>
                        <option value="SEVERE">SEVERE</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Episode Longitudinal Status</label>
                      <select className="form-select" value={visitClassification} onChange={(e) => setVisitClassification(e.target.value)}>
                        <option value="NEW_CONDITION">NEW_CONDITION — Start New Episode</option>
                        <option value="FOLLOW_UP">FOLLOW_UP — Linked to Active Episode</option>
                        <option value="IMPROVING">IMPROVING — Responsive to treatment</option>
                        <option value="WORSENING">WORSENING — Clinical escalation</option>
                        <option value="RESOLVED">RESOLVED — Close Episode</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Chief Presenting Symptoms *</label>
                    <input required className="form-input" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g. High fever, intermittent chills, severe joint pain" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary Diagnosis *</label>
                    <input required className="form-input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute Plasmodium vivax Malaria" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Doctor's Clinical Notes</label>
                    <textarea rows={2} className="form-textarea" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} placeholder="Clinical observations, recovery instructions..." />
                  </div>
                </div>

                {/* Section 3: Prescriptions with Allergy Cross-Check */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <h3 className="card-title">
                      <Pill size={18} color="var(--primary-600)" />
                      Prescriptions (Safety Cross-Checked)
                    </h3>
                    <button type="button" onClick={addPrescriptionRow} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      + Add Medication
                    </button>
                  </div>

                  {prescriptions.map((rx, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <input className="form-input" placeholder="Medication Name (e.g. Paracetamol)" value={rx.medicineName} onChange={(e) => updatePrescriptionRow(idx, 'medicineName', e.target.value)} />
                      <input className="form-input" placeholder="Dosage (500mg)" value={rx.dosage} onChange={(e) => updatePrescriptionRow(idx, 'dosage', e.target.value)} />
                      <input className="form-input" placeholder="Frequency (Twice daily)" value={rx.frequency} onChange={(e) => updatePrescriptionRow(idx, 'frequency', e.target.value)} />
                      <input type="number" className="form-input" placeholder="Days (5)" value={rx.durationDays} onChange={(e) => updatePrescriptionRow(idx, 'durationDays', e.target.value)} />
                      <button type="button" onClick={() => removePrescriptionRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Section 4: Specialist Referral (Optional) */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: createReferral ? '1rem' : 0 }}>
                    <input type="checkbox" id="referralToggle" checked={createReferral} onChange={(e) => setCreateReferral(e.target.checked)} />
                    <label htmlFor="referralToggle" style={{ fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}>
                      Generate Secondary Specialist Referral for this Patient
                    </label>
                  </div>

                  {createReferral && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                      <div className="form-group">
                        <label className="form-label">Target Specialty</label>
                        <select className="form-select" value={referralSpecialty} onChange={(e) => setReferralSpecialty(e.target.value)}>
                          <option value="Infectious Diseases">Infectious Diseases</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Pulmonology">Pulmonology</option>
                          <option value="Endocrinology">Endocrinology</option>
                          <option value="Nephrology">Nephrology</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select className="form-select" value={referralPriority} onChange={(e) => setReferralPriority(e.target.value)}>
                          <option value="ROUTINE">ROUTINE</option>
                          <option value="URGENT">URGENT</option>
                          <option value="EMERGENCY">EMERGENCY</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Referral Clinical Justification</label>
                        <input className="form-input" value={referralReason} onChange={(e) => setReferralReason(e.target.value)} placeholder="Reason for specialist escalation..." />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Action Bar */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsConsulting(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingConsultation}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
                  >
                    {savingConsultation ? 'Recording Encounter...' : '✓ Complete & Save Consultation'}
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: Viewing Patient History Sub-Tabs */
              <div>
                {activeTab === 'timeline' && <MedicalTimelinePage patientId={selectedPatient.id} />}
                {activeTab === 'episodes' && <DiseaseEpisodesPage patientId={selectedPatient.id} />}
                {activeTab === 'trends' && <HealthTrendsPage patientId={selectedPatient.id} />}
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
                {activeTab === 'cds' && (
                  <ClinicalDecisionSupportView
                    patientId={selectedPatient.id}
                    mode="doctor"
                    onLaunchConsultation={() => setIsConsulting(true)}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <User size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 700 }}>No Patient Selected</div>
            <p style={{ fontSize: '0.85rem' }}>Select a patient from the search results on the left to review their file or start a consultation.</p>
          </div>
        )}
      </div>
    </div>
  );
};
