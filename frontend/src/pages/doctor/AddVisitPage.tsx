import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  AlertTriangle,
  Pill,
  FileText,
  ShieldAlert,
  Brain,
  CheckCircle2,
  Trash2,
  User,
  HeartPulse,
} from 'lucide-react';
import api from '../../services/api';

export const AddVisitPage: React.FC<{
  initialPatient?: any;
  onSuccess: () => void;
}> = ({ initialPatient, onSuccess }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatient?.id || '');
  const [selectedPatient, setSelectedPatient] = useState<any>(initialPatient || null);

  // Vitals
  const [systolicBp, setSystolicBp] = useState('130');
  const [diastolicBp, setDiastolicBp] = useState('84');
  const [glucose, setGlucose] = useState('110');
  const [bmi, setBmi] = useState('26.4');
  const [heartRate, setHeartRate] = useState('78');
  const [temperature, setTemperature] = useState('98.8');
  const [spo2, setSpo2] = useState('98');

  // Consultation
  const [symptoms, setSymptoms] = useState('Fever, chills, and body aches for 3 days');
  const [diagnosis, setDiagnosis] = useState('Acute Malaria (Plasmodium vivax suspected)');
  const [disease, setDisease] = useState('Malaria');
  const [severity, setSeverity] = useState('MODERATE');
  const [clinicalNotes, setClinicalNotes] = useState('Prescribing ACT regimen. Patient instructed to hydrate and report if fever spikes.');
  const [visitClassification, setVisitClassification] = useState('NEW_CONDITION');

  // Prescriptions list
  const [prescriptions, setPrescriptions] = useState<any[]>([
    { medicineName: 'Artemether + Lumefantrine', dosage: '80mg/480mg', frequency: 'Twice daily with milk', durationDays: '3' },
  ]);

  // Lab reports list
  const [labReports, setLabReports] = useState<any[]>([
    { testName: 'Peripheral Smear for Malaria', testCategory: 'Hematology', measuredValue: '1', unit: 'index', normalRangeMin: '0', normalRangeMax: '0' },
  ]);

  // Referral
  const [createReferral, setCreateReferral] = useState(false);
  const [referralSpecialty, setReferralSpecialty] = useState('Infectious Diseases');
  const [referralReason, setReferralReason] = useState('Severe thrombocytopenia review');
  const [referralPriority, setReferralPriority] = useState('ROUTINE');

  // Safety & AI Flags
  const [allergyConflicts, setAllergyConflicts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load patients list if not preselected
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await api.get('/doctors/patients?q=');
        setPatients(res.data);
        if (!selectedPatientId && res.data.length > 0) {
          setSelectedPatientId(res.data[0].id);
          setSelectedPatient(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
    };

    if (!initialPatient) {
      loadPatients();
    }
  }, [initialPatient]);

  // Update selected patient when dropdown changes
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    const p = patients.find((pt) => pt.id === id);
    setSelectedPatient(p || null);
  };

  // Real-time Allergy Cross-Check
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

    prescriptions.forEach((rx) => {
      const medLower = (rx.medicineName || '').toLowerCase().trim();
      if (!medLower) return;

      for (const allergy of patientAllergies) {
        if (allergy === 'none') continue;
        if (medLower.includes(allergy) || allergy.includes(medLower)) {
          conflicts.push(`CRITICAL ALLERGY CONFLICT: Patient is allergic to "${allergy}". Prescribed medication "${rx.medicineName}" contains matching allergen.`);
        }
        // Class check for penicillin
        if ((allergy.includes('penicillin') || allergy.includes('amoxicillin')) &&
            (medLower.includes('amox') || medLower.includes('penicillin') || medLower.includes('ampicillin') || medLower.includes('augmentin'))) {
          conflicts.push(`ALLERGY CLASS CONFLICT: Patient is allergic to Penicillin class. "${rx.medicineName}" poses potential anaphylaxis risk.`);
        }
      }
    });

    setAllergyConflicts(conflicts);
  }, [selectedPatient, prescriptions]);

  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { medicineName: '', dosage: '500mg', frequency: 'Twice daily', durationDays: '5' }]);
  };

  const removePrescriptionRow = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const updatePrescriptionRow = (idx: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[idx][field] = value;
    setPrescriptions(updated);
  };

  const addLabRow = () => {
    setLabReports([...labReports, { testName: 'Complete Blood Count', testCategory: 'Hematology', measuredValue: '140', unit: '10^3/uL', normalRangeMin: '150', normalRangeMax: '450' }]);
  };

  const removeLabRow = (idx: number) => {
    setLabReports(labReports.filter((_, i) => i !== idx));
  };

  const updateLabRow = (idx: number, field: string, value: string) => {
    const updated = [...labReports];
    updated[idx][field] = value;
    setLabReports(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }

    if (allergyConflicts.length > 0) {
      const confirmed = window.confirm(
        '⚠️ ALLERGY CONFLICT DETECTED!\n\n' +
        allergyConflicts.join('\n') +
        '\n\nDo you explicitly confirm clinical override for this prescription?'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    setSuccessMessage(null);

    try {
      const payload: any = {
        patientId: selectedPatientId,
        symptoms,
        diagnosis,
        disease,
        severity,
        systolicBp: parseFloat(systolicBp),
        diastolicBp: parseFloat(diastolicBp),
        glucose: parseFloat(glucose),
        bmi: parseFloat(bmi),
        heartRate: parseFloat(heartRate),
        temperature: parseFloat(temperature),
        spo2: parseFloat(spo2),
        clinicalNotes,
        visitClassification,
        prescriptions: prescriptions.filter((p) => p.medicineName.trim()),
        labReports: labReports.filter((l) => l.testName.trim()),
        locationDistrict: selectedPatient?.district,
        lat: selectedPatient?.lat,
        lng: selectedPatient?.lng,
      };

      const res = await api.post('/visits', payload);

      // If referral requested
      if (createReferral && referralSpecialty && referralReason) {
        await api.post('/referrals', {
          patientId: selectedPatientId,
          targetSpecialty: referralSpecialty,
          reason: referralReason,
          priority: referralPriority,
        });
      }

      setSuccessMessage(`Encounter successfully recorded! Episode code: ${res.data.episode.episodeCode}. Case automatically integrated into public surveillance pipeline.`);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record consultation visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <PlusCircle size={24} color="var(--primary-600)" /> Record Clinical Encounter
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Creates an immutable medical record, updates longitudinal disease episodes, cross-checks medication allergies, and streams case telemetry into the surveillance pipeline.
        </p>
      </div>

      {successMessage && (
        <div className="alert-banner alert-banner-info" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={20} color="#0284c7" />
          <div style={{ fontWeight: 700 }}>{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Patient Selection & Safety Banner */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <User size={18} color="var(--primary-600)" />
              1. Patient Identification & Clinical Profile
            </h3>
            {selectedPatient && (
              <span className="badge badge-danger">Blood Group: {selectedPatient.bloodGroup}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Patient *</label>
              <select
                className="form-select"
                value={selectedPatientId}
                onChange={(e) => handleSelectPatient(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user?.name} &bull; {p.healthId} ({p.district})
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div>
                  <strong>Known Allergies: </strong>
                  <span style={{ color: selectedPatient.allergies ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                    {selectedPatient.allergies || 'None reported'}
                  </span>
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Chronic Conditions: </strong>
                  <span>{selectedPatient.chronicConditions || 'None reported'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Vitals & Biometrics */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <HeartPulse size={18} color="#ef4444" />
              2. Objective Physiological Vitals
            </h3>
            <span className="badge badge-info">Real-time Anomaly Check</span>
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
              <label className="form-label">Calculated BMI</label>
              <input type="number" step="0.1" required className="form-input" value={bmi} onChange={(e) => setBmi(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 3: Clinical Diagnosis & Disease Episode Classifier */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Brain size={18} color="var(--primary-600)" />
              3. Symptoms, Diagnosis & Smart Episode Classification
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Presenting Symptoms *</label>
            <textarea
              required
              rows={2}
              className="form-textarea"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. High fever, cyclical chills, headache for 48 hours"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Disease Category *</label>
              <select className="form-select" value={disease} onChange={(e) => setDisease(e.target.value)}>
                <option value="Malaria">Malaria (Surveillance Tracked)</option>
                <option value="Dengue">Dengue (Surveillance Tracked)</option>
                <option value="Typhoid">Typhoid (Surveillance Tracked)</option>
                <option value="COVID-19">COVID-19 (Surveillance Tracked)</option>
                <option value="Cholera">Cholera (Surveillance Tracked)</option>
                <option value="Hypertension">Hypertension (Chronic)</option>
                <option value="Type 2 Diabetes">Type 2 Diabetes (Chronic)</option>
                <option value="Acute Bronchitis">Acute Bronchitis</option>
                <option value="Other">Other Medical Condition</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Severity *</label>
              <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Smart Episode Stage *</label>
              <select className="form-select" value={visitClassification} onChange={(e) => setVisitClassification(e.target.value)}>
                <option value="NEW_CONDITION">New Condition (Initialize Episode)</option>
                <option value="FOLLOW_UP">Follow-up Encounter</option>
                <option value="IMPROVING">Improving Progression</option>
                <option value="WORSENING">Worsening Progression</option>
                <option value="RESOLVED">Resolved (Close Episode)</option>
                <option value="RELATED_CONDITION">Related Secondary Condition</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Diagnosis *</label>
            <input
              required
              className="form-input"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute uncomplicated Malaria (P. vivax)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Notes & Impression</label>
            <textarea
              rows={2}
              className="form-textarea"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Treatment plan, counseling notes, follow-up advice..."
            />
          </div>
        </div>

        {/* Section 4: Prescriptions & ALLERGY SAFETY GUARD */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Pill size={18} color="var(--primary-600)" />
              4. Prescriptions (with Automated Allergy Conflict Detection)
            </h3>
            <button type="button" onClick={addPrescriptionRow} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              + Add Medication
            </button>
          </div>

          {/* Critical Allergy Warning Banner */}
          {allergyConflicts.length > 0 && (
            <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                  ⚠️ CRITICAL ALLERGY CONFLICT FLAGGED
                </div>
                {allergyConflicts.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', marginBottom: '0.2rem' }}>{c}</div>
                ))}
                <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.35rem' }}>
                  Please change the prescribed drug or confirm clinician override.
                </div>
              </div>
            </div>
          )}

          {prescriptions.map((p, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <input
                className="form-input"
                placeholder="Medicine Name e.g. Artemether, Telmisartan"
                value={p.medicineName}
                onChange={(e) => updatePrescriptionRow(idx, 'medicineName', e.target.value)}
              />
              <input
                className="form-input"
                placeholder="Dosage e.g. 500mg"
                value={p.dosage}
                onChange={(e) => updatePrescriptionRow(idx, 'dosage', e.target.value)}
              />
              <input
                className="form-input"
                placeholder="Frequency e.g. Twice daily"
                value={p.frequency}
                onChange={(e) => updatePrescriptionRow(idx, 'frequency', e.target.value)}
              />
              <input
                className="form-input"
                type="number"
                placeholder="Days"
                value={p.durationDays}
                onChange={(e) => updatePrescriptionRow(idx, 'durationDays', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removePrescriptionRow(idx)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Section 5: Lab Diagnostic Orders */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={18} color="#047857" />
              5. Laboratory Findings / Diagnostic Entry
            </h3>
            <button type="button" onClick={addLabRow} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              + Add Test Result
            </button>
          </div>

          {labReports.map((l, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <input
                className="form-input"
                placeholder="Test Name e.g. Platelet Count"
                value={l.testName}
                onChange={(e) => updateLabRow(idx, 'testName', e.target.value)}
              />
              <input
                className="form-input"
                type="number"
                step="0.01"
                placeholder="Value"
                value={l.measuredValue}
                onChange={(e) => updateLabRow(idx, 'measuredValue', e.target.value)}
              />
              <input
                className="form-input"
                placeholder="Unit"
                value={l.unit}
                onChange={(e) => updateLabRow(idx, 'unit', e.target.value)}
              />
              <input
                className="form-input"
                type="number"
                placeholder="Min Normal"
                value={l.normalRangeMin}
                onChange={(e) => updateLabRow(idx, 'normalRangeMin', e.target.value)}
              />
              <input
                className="form-input"
                type="number"
                placeholder="Max Normal"
                value={l.normalRangeMax}
                onChange={(e) => updateLabRow(idx, 'normalRangeMax', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeLabRow(idx)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Section 6: Optional Referral */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: createReferral ? '1rem' : '0' }}>
            <input
              type="checkbox"
              id="referralCheck"
              checked={createReferral}
              onChange={(e) => setCreateReferral(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="referralCheck" style={{ fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}>
              Generate Specialist / Hospital Referral for this Patient
            </label>
          </div>

          {createReferral && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
              <div className="form-group">
                <label className="form-label">Target Specialty</label>
                <select className="form-select" value={referralSpecialty} onChange={(e) => setReferralSpecialty(e.target.value)}>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Infectious Diseases">Infectious Diseases</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Nephrology">Nephrology</option>
                  <option value="Pulmonology">Pulmonology</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={referralPriority} onChange={(e) => setReferralPriority(e.target.value)}>
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Reason for Referral</label>
                <input className="form-input" value={referralReason} onChange={(e) => setReferralReason(e.target.value)} placeholder="e.g. Specialized cardiac catheterization evaluation" />
              </div>
            </div>
          )}
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={onSuccess} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}
          >
            {loading ? 'Saving Consultation...' : 'Commit Immutable Consultation & Feed Surveillance'}
          </button>
        </div>
      </form>
    </div>
  );
};
