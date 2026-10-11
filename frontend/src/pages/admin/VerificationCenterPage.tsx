import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  User,
  Shield,
  FileCheck,
  FileX,
  ExternalLink,
  Ban,
  UserCheck,
  Stethoscope,
  Building2,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

interface DoctorVerificationRecord {
  id: string;
  licenseNumber: string;
  specialty: string;
  qualification: string;
  experienceYears: number;
  verificationStatus: string;
  isActive: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: string;
  };
  hospital?: {
    id: string;
    name: string;
    district: string;
  };
  doctorDocuments: Array<{
    id: string;
    documentType: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    status: string;
    isRequired: boolean;
    uploadedAt: string;
    rejectionReason?: string;
  }>;
}

export const VerificationCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'documents'>('doctors');

  // Doctor Verifications State
  const [doctors, setDoctors] = useState<DoctorVerificationRecord[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorVerificationRecord | null>(null);
  const [doctorFilter, setDoctorFilter] = useState<string>('ALL');
  const [doctorSearch, setDoctorSearch] = useState<string>('');

  // Modals & Action State
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');

  // Common UI State
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchDoctorVerifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/doctors/verifications');
      setDoctors(res.data.doctors || []);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Failed to fetch doctor verifications:', err);
      setNotification({ type: 'error', text: 'Failed to load doctor verification queue.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorVerifications();
  }, []);

  // Action: Approve Doctor
  const handleApproveDoctor = async (doctorId: string) => {
    if (!window.confirm('Are you sure you want to approve this doctor? They will immediately become eligible to receive patient appointments.')) return;

    setActionLoading(true);
    try {
      await api.post(`/admin/doctors/${doctorId}/verify`);
      setNotification({ type: 'success', text: 'Doctor approved & verified successfully! Eligible for patient bookings.' });
      if (selectedDoctor?.id === doctorId) setSelectedDoctor(null);
      await fetchDoctorVerifications();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.response?.data?.error || 'Failed to verify doctor.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Action: Reject Doctor
  const handleConfirmReject = async () => {
    if (!selectedDoctor) return;
    if (!rejectionReasonInput.trim()) {
      alert('Please provide a specific rejection reason for the doctor.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/doctors/${selectedDoctor.id}/reject`, {
        rejectionReason: rejectionReasonInput.trim(),
      });
      setNotification({ type: 'success', text: `Doctor verification rejected. Reason logged and notification sent.` });
      setRejectModalOpen(false);
      setRejectionReasonInput('');
      setSelectedDoctor(null);
      await fetchDoctorVerifications();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.response?.data?.error || 'Failed to reject verification.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Action: Suspend Doctor
  const handleConfirmSuspend = async () => {
    if (!selectedDoctor) return;

    setActionLoading(true);
    try {
      await api.post(`/admin/doctors/${selectedDoctor.id}/suspend`, {
        reason: suspensionReasonInput.trim() || 'Suspended by system administrator',
      });
      setNotification({ type: 'success', text: 'Doctor account suspended from receiving new appointments.' });
      setSuspendModalOpen(false);
      setSuspensionReasonInput('');
      setSelectedDoctor(null);
      await fetchDoctorVerifications();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.response?.data?.error || 'Failed to suspend doctor.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Action: Reactivate Doctor
  const handleReactivateDoctor = async (doctorId: string) => {
    if (!window.confirm('Reactivate this doctor account? They will be eligible for new appointments.')) return;

    setActionLoading(true);
    try {
      await api.post(`/admin/doctors/${doctorId}/reactivate`);
      setNotification({ type: 'success', text: 'Doctor account reactivated successfully.' });
      if (selectedDoctor?.id === doctorId) setSelectedDoctor(null);
      await fetchDoctorVerifications();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.response?.data?.error || 'Failed to reactivate doctor.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // View Document in new window with auth token
  const handleViewDoc = (docId: string) => {
    const token = localStorage.getItem('smarthealth_token') || localStorage.getItem('token');
    window.open(`http://localhost:5000/api/doctors/verification/documents/${docId}/view?token=${token}`, '_blank');
  };

  // Filtered Doctors
  const filteredDoctors = doctors.filter((doc) => {
    const status = (doc.verificationStatus || 'PENDING_DOCUMENTS').toUpperCase();
    if (doctorFilter !== 'ALL' && status !== doctorFilter) return false;

    if (doctorSearch.trim()) {
      const q = doctorSearch.toLowerCase();
      const nameMatch = doc.user?.name?.toLowerCase().includes(q);
      const licenseMatch = doc.licenseNumber?.toLowerCase().includes(q);
      const specMatch = doc.specialty?.toLowerCase().includes(q);
      const hospMatch = doc.hospital?.name?.toLowerCase().includes(q);
      return nameMatch || licenseMatch || specMatch || hospMatch;
    }

    return true;
  });

  // Calculate stats
  const underReviewCount = doctors.filter((d) => d.verificationStatus === 'UNDER_REVIEW').length;
  const verifiedCount = doctors.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const rejectedCount = doctors.filter((d) => d.verificationStatus === 'REJECTED').length;
  const suspendedCount = doctors.filter((d) => d.verificationStatus === 'SUSPENDED').length;
  const pendingDocsCount = doctors.filter((d) => d.verificationStatus === 'PENDING_DOCUMENTS' || d.verificationStatus === 'UNVERIFIED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: 999, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={13} /> ✓ Verified Doctor
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: 999, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={13} /> ◷ Verification Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: 999, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <XCircle size={13} /> ✕ Verification Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: 999, background: '#1e293b', color: '#fbbf24', border: '1px solid #475569', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertTriangle size={13} /> ⚠ Verification Suspended
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: 999, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={13} /> ◷ Documents Required
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 100,
            padding: '12px 18px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            border: `1px solid ${notification.type === 'success' ? '#047857' : '#be123c'}`,
            background: notification.type === 'success' ? '#064e3b' : '#881337',
            color: notification.type === 'success' ? '#ecfdf5' : '#fff1f2',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Doctor Credential Verification Center
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Admin Verification Queue &bull; Enforce mandatory practitioner registration &amp; appointment eligibility
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Last checked: {lastUpdated}</span>
          )}
          <button
            onClick={fetchDoctorVerifications}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          onClick={() => setDoctorFilter('UNDER_REVIEW')}
          style={{
            background: '#ffffff',
            border: `2px solid ${doctorFilter === 'UNDER_REVIEW' ? '#d97706' : '#fde68a'}`,
            borderRadius: 14,
            padding: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Under Review</span>
            <Clock size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>{underReviewCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#b45309' }}>Awaiting Admin approval</div>
        </div>

        <div
          onClick={() => setDoctorFilter('VERIFIED')}
          style={{
            background: '#ffffff',
            border: `2px solid ${doctorFilter === 'VERIFIED' ? '#16a34a' : '#bbf7d0'}`,
            borderRadius: 14,
            padding: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>Verified &amp; Active</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>{verifiedCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#15803d' }}>Bookable by patients</div>
        </div>

        <div
          onClick={() => setDoctorFilter('REJECTED')}
          style={{
            background: '#ffffff',
            border: `2px solid ${doctorFilter === 'REJECTED' ? '#dc2626' : '#fecaca'}`,
            borderRadius: 14,
            padding: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>Rejected</span>
            <XCircle size={16} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>{rejectedCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#b91c1c' }}>Corrections requested</div>
        </div>

        <div
          onClick={() => setDoctorFilter('SUSPENDED')}
          style={{
            background: '#ffffff',
            border: `2px solid ${doctorFilter === 'SUSPENDED' ? '#475569' : '#cbd5e1'}`,
            borderRadius: 14,
            padding: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Suspended</span>
            <AlertTriangle size={16} color="#475569" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#475569' }}>{suspendedCount}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Disabled from bookings</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'PENDING_DOCUMENTS'].map((st) => (
            <button
              key={st}
              onClick={() => setDoctorFilter(st)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                border: `1px solid ${doctorFilter === st ? '#0284c7' : '#cbd5e1'}`,
                background: doctorFilter === st ? '#e0f2fe' : '#ffffff',
                color: doctorFilter === st ? '#0369a1' : '#475569',
                cursor: 'pointer',
              }}
            >
              {st === 'ALL'
                ? `All Doctors (${doctors.length})`
                : st === 'UNDER_REVIEW'
                ? `Under Review (${underReviewCount})`
                : st === 'VERIFIED'
                ? `Verified (${verifiedCount})`
                : st === 'REJECTED'
                ? `Rejected (${rejectedCount})`
                : st === 'SUSPENDED'
                ? `Suspended (${suspendedCount})`
                : `Pending Docs (${pendingDocsCount})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.45rem 0.85rem', borderRadius: 10, border: '1px solid #cbd5e1', width: 280 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search doctor or license..."
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.84rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Doctors Table / Cards */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: 16 }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
          <div>Loading doctors list...</div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '3rem 1.5rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <ShieldCheck size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
            No doctor records match the filter
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
            {doctorFilter !== 'ALL' ? `No doctors with status "${doctorFilter}".` : 'No doctors found in the database.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredDoctors.map((doc) => {
            const docStatus = doc.verificationStatus || 'PENDING_DOCUMENTS';
            const hasRegCert = doc.doctorDocuments.some((d) => d.documentType === 'MEDICAL_REGISTRATION_CERTIFICATE');
            const hasDegree = doc.doctorDocuments.some((d) => d.documentType === 'MEDICAL_DEGREE');
            const canApprove = hasRegCert && hasDegree;

            return (
              <div
                key={doc.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '1.35rem 1.5rem',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                {/* Doctor Identity Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 280 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {doc.user?.avatarUrl ? (
                      <img src={doc.user.avatarUrl} alt={doc.user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      doc.user?.name ? doc.user.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'DR'
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {doc.user?.name}
                      </h3>
                      {getStatusBadge(docStatus)}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                      {doc.specialty} &bull; {doc.qualification}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      License: <strong style={{ fontFamily: 'monospace' }}>{doc.licenseNumber}</strong>
                      {doc.hospital && ` &bull; ${doc.hospital.name}`}
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents Indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 220 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                    Uploaded Credentials ({doc.doctorDocuments.length})
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 6,
                        background: hasRegCert ? '#ecfdf5' : '#fff1f2',
                        color: hasRegCert ? '#047857' : '#be123c',
                        border: `1px solid ${hasRegCert ? '#a7f3d0' : '#fecdd3'}`,
                      }}
                    >
                      {hasRegCert ? '✓ Registration Cert' : '✕ No Reg Cert'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 6,
                        background: hasDegree ? '#ecfdf5' : '#fff1f2',
                        color: hasDegree ? '#047857' : '#be123c',
                        border: `1px solid ${hasDegree ? '#a7f3d0' : '#fecdd3'}`,
                      }}
                    >
                      {hasDegree ? '✓ Medical Degree' : '✕ No Degree'}
                    </span>
                  </div>
                  {doc.rejectionReason && (
                    <div style={{ fontSize: '0.74rem', color: '#dc2626', marginTop: '2px' }}>
                      Reason: &ldquo;{doc.rejectionReason}&rdquo;
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Detailed Review Button */}
                  <button
                    onClick={() => setSelectedDoctor(doc)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Eye size={14} color="#0284c7" /> Review Documents
                  </button>

                  {/* Quick Approve (if under review or rejected) */}
                  {docStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleApproveDoctor(doc.id)}
                      disabled={!canApprove || actionLoading}
                      title={!canApprove ? 'Cannot approve: Mandatory Registration Cert and Medical Degree required.' : 'Approve doctor'}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 8,
                        border: 'none',
                        background: !canApprove ? '#cbd5e1' : '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: !canApprove || actionLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Check size={14} /> Approve Doctor
                    </button>
                  )}

                  {/* Reject (if under review or verified) */}
                  {docStatus !== 'REJECTED' && docStatus !== 'SUSPENDED' && (
                    <button
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setRejectModalOpen(true);
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 8,
                        border: '1px solid #fecdd3',
                        background: '#ffffff',
                        color: '#be123c',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                  )}

                  {/* Suspend (if verified) */}
                  {docStatus === 'VERIFIED' && (
                    <button
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setSuspendModalOpen(true);
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 8,
                        border: '1px solid #475569',
                        background: '#1e293b',
                        color: '#fbbf24',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Ban size={14} /> Suspend
                    </button>
                  )}

                  {/* Reactivate (if suspended) */}
                  {docStatus === 'SUSPENDED' && (
                    <button
                      onClick={() => handleReactivateDoctor(doc.id)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 8,
                        border: 'none',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <UserCheck size={14} /> Reactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCTOR CREDENTIAL REVIEW DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedDoctor && !rejectModalOpen && !suspendModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} color="#0284c7" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Doctor Verification &bull; {selectedDoctor.user?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Doctor Bio Details */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Specialty</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{selectedDoctor.specialty}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Qualification</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{selectedDoctor.qualification}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>License Number</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{selectedDoctor.licenseNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Current Status</div>
                  <div>{getStatusBadge(selectedDoctor.verificationStatus)}</div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  Submitted Credentials ({selectedDoctor.doctorDocuments.length})
                </h4>

                {selectedDoctor.doctorDocuments.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: 10, color: '#64748b', fontSize: '0.82rem' }}>
                    No credential documents uploaded by this doctor yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {selectedDoctor.doctorDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                            {doc.documentType.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                            File: {doc.fileName} &bull; {(doc.fileSize / 1024).toFixed(1)} KB &bull; Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewDoc(doc.id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            color: '#0284c7',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <ExternalLink size={13} /> View File
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Decision Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  style={{ padding: '0.6rem 1.1rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Close
                </button>

                <button
                  onClick={() => setRejectModalOpen(true)}
                  style={{ padding: '0.6rem 1.1rem', borderRadius: 8, border: '1px solid #fecdd3', background: '#fff1f2', color: '#be123c', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reject Verification
                </button>

                <button
                  onClick={() => handleApproveDoctor(selectedDoctor.id)}
                  disabled={!selectedDoctor.doctorDocuments.some((d) => d.documentType === 'MEDICAL_REGISTRATION_CERTIFICATE') || !selectedDoctor.doctorDocuments.some((d) => d.documentType === 'MEDICAL_DEGREE')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Check size={16} /> Approve &amp; Verify Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTION REASON PROMPT MODAL */}
      {/* ========================================================================= */}
      {rejectModalOpen && selectedDoctor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 480, padding: '1.5rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <XCircle size={18} /> Reject Doctor Verification
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Specify the explicit reason for rejection. This reason will be displayed directly to Dr. {selectedDoctor.user?.name} so they can correct their documents.
            </p>

            <textarea
              rows={4}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Registration certificate is unclear or expired. Please upload a clear official copy."
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '1.25rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReasonInput('');
                }}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectionReasonInput.trim()}
                style={{ padding: '0.5rem 1.15rem', borderRadius: 8, border: 'none', background: '#dc2626', color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUSPENSION PROMPT MODAL */}
      {/* ========================================================================= */}
      {suspendModalOpen && selectedDoctor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 480, padding: '1.5rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={18} color="#d97706" /> Suspend Doctor Account
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Suspending Dr. {selectedDoctor.user?.name} will prevent patients from booking new appointments. Existing appointments remain intact.
            </p>

            <textarea
              rows={3}
              value={suspensionReasonInput}
              onChange={(e) => setSuspensionReasonInput(e.target.value)}
              placeholder="e.g. Practitioner license verification audit pending."
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '1.25rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                onClick={() => {
                  setSuspendModalOpen(false);
                  setSuspensionReasonInput('');
                }}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={actionLoading}
                style={{ padding: '0.5rem 1.15rem', borderRadius: 8, border: 'none', background: '#1e293b', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
