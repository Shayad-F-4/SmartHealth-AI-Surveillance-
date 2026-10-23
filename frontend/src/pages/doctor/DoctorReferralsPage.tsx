import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  X,
  XCircle,
  AlertTriangle,
  Stethoscope,
  Search,
  Filter,
  FileText,
  User,
} from 'lucide-react';
import api from '../../services/api';

const SPECIALTIES = [
  'Cardiology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Nephrology',
  'Gastroenterology',
  'Dermatology',
  'Pediatrics',
  'Psychiatry',
  'General Surgery',
  'Pulmonology',
  'ENT',
  'Ophthalmology',
];

interface DoctorReferralsPageProps {
  selectedPatientId?: string;
}

export const DoctorReferralsPage: React.FC<DoctorReferralsPageProps> = ({ selectedPatientId }) => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [matchedPatients, setMatchedPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [targetSpecialty, setTargetSpecialty] = useState('Cardiology');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('URGENT');
  const [reason, setReason] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Resolution Notes Modal State
  const [resolutionModalReferral, setResolutionModalReferral] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const url = selectedPatientId ? `/referrals/patient/${selectedPatientId}` : '/referrals';
      const res = await api.get(url);
      setReferrals(res.data);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [selectedPatientId]);

  // Search patients for referral creation
  const handleSearchPatient = async (query: string) => {
    setPatientSearch(query);
    if (query.trim().length < 2) {
      setMatchedPatients([]);
      return;
    }
    try {
      const res = await api.get(`/patients/search?q=${encodeURIComponent(query)}`);
      setMatchedPatients(res.data);
    } catch {
      // ignore
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient && !selectedPatientId) {
      alert('Please select a patient to refer.');
      return;
    }
    if (!reason.trim()) {
      alert('Please provide a clinical reason for the referral.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/referrals', {
        patientId: selectedPatient ? selectedPatient.id : selectedPatientId,
        targetSpecialty,
        priority,
        reason,
        clinicalNotes,
      });

      setShowCreateModal(false);
      setReason('');
      setClinicalNotes('');
      setSelectedPatient(null);
      setPatientSearch('');
      fetchReferrals();
    } catch (err: any) {
      alert('Failed to create referral: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await api.put(`/referrals/${id}/status`, {
        status,
        resolutionNotes: notes,
      });
      fetchReferrals();
    } catch (err: any) {
      alert('Failed to update status: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCompleteWithResolution = async () => {
    if (!resolutionModalReferral) return;
    setCompleting(true);
    try {
      await handleUpdateStatus(resolutionModalReferral.id, 'COMPLETED', resolutionNotes);
      setResolutionModalReferral(null);
      setResolutionNotes('');
    } finally {
      setCompleting(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    if (filterPriority !== 'ALL' && r.priority !== filterPriority) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      {/* ── Header Row ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <ShieldCheck size={24} color="var(--primary-600)" /> Clinical Specialist Referrals
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Manage cross-specialty clinical referrals, triage urgency, and record resolution notes for seamless patient handovers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> New Specialist Referral
        </button>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
          <Filter size={14} /> Priority:
        </div>
        {['ALL', 'EMERGENCY', 'URGENT', 'ROUTINE'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: 999,
              border: filterPriority === p ? '1px solid var(--primary-600)' : '1px solid #e2e8f0',
              background: filterPriority === p ? 'var(--primary-50)' : '#ffffff',
              color: filterPriority === p ? 'var(--primary-700)' : '#64748b',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {p === 'ALL' ? 'All Priorities' : p}
          </button>
        ))}

        <div style={{ height: 16, width: 1, background: '#cbd5e1', margin: '0 0.5rem' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
          Status:
        </div>
        {['ALL', 'GENERATED', 'ACCEPTED', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: 999,
              border: filterStatus === s ? '1px solid var(--primary-600)' : '1px solid #e2e8f0',
              background: filterStatus === s ? 'var(--primary-50)' : '#ffffff',
              color: filterStatus === s ? 'var(--primary-700)' : '#64748b',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {s === 'ALL' ? 'All Status' : s}
          </button>
        ))}
      </div>

      {/* ── Table Card ────────────────────────────────────────────── */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading clinical referrals...
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 14 }}>
          <Stethoscope size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#334155', margin: '0 0 0.25rem 0' }}>
            No Referrals Found
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
            {referrals.length === 0
              ? 'No specialist referrals have been recorded yet. Click "New Specialist Referral" to refer a patient to a super-specialist.'
              : 'No referrals match your selected filters.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)', borderRadius: 14 }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0, width: '100%' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Patient</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Target Specialty</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Priority (Triage)</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Clinical Reason &amp; Notes</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Referring Doctor</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((r) => {
                  const isEmergency = r.priority === 'EMERGENCY';
                  const isUrgent = r.priority === 'URGENT';

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {r.patient?.user?.name || 'Patient Record'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {r.patient?.healthId || r.patient?.user?.phone || ''}
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.74rem', fontWeight: 800 }}>
                          {r.targetSpecialty}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 999,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: isEmergency ? '#fee2e2' : isUrgent ? '#fef3c7' : '#ecfdf5',
                            color: isEmergency ? '#dc2626' : isUrgent ? '#d97706' : '#059669',
                            border: `1px solid ${isEmergency ? '#fca5a5' : isUrgent ? '#fde68a' : '#a7f3d0'}`,
                          }}
                        >
                          {isEmergency ? '🔴 Emergency' : isUrgent ? '🟠 Urgent' : '🟢 Routine'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', maxWidth: 300 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                          {r.reason}
                        </div>
                        {r.clinicalNotes && (
                          (() => {
                            const hasResolution = r.clinicalNotes.includes('Resolution:');
                            if (hasResolution) {
                              const parts = r.clinicalNotes.split(/\|\s*Resolution:\s*|Resolution:\s*/);
                              const referringNotes = parts[0]?.trim();
                              const resNotes = parts[1]?.trim() || (r.clinicalNotes.startsWith('Resolution:') ? r.clinicalNotes.replace(/^Resolution:\s*/, '') : '');
                              return (
                                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', lineHeight: 1.35 }}>
                                  {referringNotes && <div style={{ color: '#64748b' }}>{referringNotes}</div>}
                                  {resNotes && (
                                    <div style={{ color: '#047857', fontWeight: 600, background: '#ecfdf5', padding: '0.2rem 0.4rem', borderRadius: 4, marginTop: '0.2rem', display: 'inline-block' }}>
                                      ✓ Resolution: {resNotes}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.35 }}>
                                {r.clinicalNotes}
                              </div>
                            );
                          })()
                        )}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>
                          {r.referringDoctor?.user?.name || 'Practitioner'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 999,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: r.status === 'COMPLETED' ? '#ecfdf5' : r.status === 'ACCEPTED' ? '#eff6ff' : '#fffbeb',
                            color: r.status === 'COMPLETED' ? '#047857' : r.status === 'ACCEPTED' ? '#1d4ed8' : '#b45309',
                            border: `1px solid ${r.status === 'COMPLETED' ? '#a7f3d0' : r.status === 'ACCEPTED' ? '#bfdbfe' : '#fde68a'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {r.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                          {r.status === 'ACCEPTED' && <Clock size={12} />}
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {r.status === 'GENERATED' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'ACCEPTED')}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem', fontWeight: 700 }}
                            >
                              Accept
                            </button>
                          )}
                          {r.status === 'ACCEPTED' && (
                            <button
                              onClick={() => {
                                setResolutionModalReferral(r);
                                setResolutionNotes('');
                              }}
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem', fontWeight: 700 }}
                            >
                              Complete &amp; Notes
                            </button>
                          )}
                          {r.status === 'GENERATED' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.74rem', color: '#dc2626', borderColor: '#fca5a5' }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal 1: Create New Specialist Referral ─────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '1.75rem',
              width: '100%',
              maxWidth: 540,
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                  Create Clinical Specialist Referral
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Refer patient for super-specialty assessment with urgency triage.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '0.4rem', cursor: 'pointer' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Patient Selection */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Patient (Search by Name or Health ID) *
                </label>
                {selectedPatient ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.85rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8 }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#0369a1' }}>{selectedPatient.user?.name}</strong>{' '}
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>({selectedPatient.healthId})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      className="form-input"
                      value={patientSearch}
                      onChange={(e) => handleSearchPatient(e.target.value)}
                      placeholder="Type patient name or ID (e.g. Rahul Verma or SHC-2026-000001)..."
                      style={{ fontSize: '0.85rem' }}
                    />
                    {matchedPatients.length > 0 && (
                      <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: '0.3rem', background: '#ffffff' }}>
                        {matchedPatients.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(p);
                              setMatchedPatients([]);
                            }}
                            style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.82rem' }}
                          >
                            <strong>{p.user?.name}</strong> <span style={{ color: '#64748b' }}>({p.healthId} &bull; {p.district})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Target Specialty & Urgency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Target Specialty *
                  </label>
                  <select
                    className="form-input"
                    value={targetSpecialty}
                    onChange={(e) => setTargetSpecialty(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Triage Urgency *
                  </label>
                  <select
                    className="form-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="ROUTINE">🟢 Routine (Elective Consult)</option>
                    <option value="URGENT">🟠 Urgent (Within 24–48 Hours)</option>
                    <option value="EMERGENCY">🔴 Emergency (Immediate Triage)</option>
                  </select>
                </div>
              </div>

              {/* Clinical Reason */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Clinical Reason for Referral *
                </label>
                <input
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Uncontrolled hypertension with LVH; refractory palpitations; ECG clearance"
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Clinical Notes */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Initial Assessment &amp; Clinical Notes (Optional)
                </label>
                <textarea
                  className="form-input"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Provide pertinent lab summaries, current medication, and questions for the specialist..."
                  rows={3}
                  style={{ fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1.25rem' }}
                >
                  {creating ? 'Generating Referral...' : '✓ Generate Specialist Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Record Resolution Notes ────────────────────────── */}
      {resolutionModalReferral && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setResolutionModalReferral(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '1.75rem',
              width: '100%',
              maxWidth: 520,
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                  Record Specialist Resolution &amp; Complete Case
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Patient: {resolutionModalReferral.patient?.user?.name} &bull; {resolutionModalReferral.targetSpecialty}
                </p>
              </div>
              <button
                onClick={() => setResolutionModalReferral(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '0.4rem', cursor: 'pointer' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem' }}>
              <strong>Referral Reason: </strong> {resolutionModalReferral.reason}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                Specialist Resolution &amp; Treatment Outcome Notes *
              </label>
              <textarea
                className="form-input"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter specialist findings, diagnostic results (e.g. 2D Echo EF 55%), medications prescribed, and follow-up advice..."
                rows={4}
                required
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setResolutionModalReferral(null)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={completing || !resolutionNotes.trim()}
                onClick={handleCompleteWithResolution}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.55rem 1.25rem' }}
              >
                {completing ? 'Saving...' : '✓ Complete Referral & Share Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
