import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Award,
  ShieldCheck,
  ShieldAlert,
  Send,
  RefreshCw,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface DocumentItem {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  isRequired?: boolean;
}

interface VerificationStatusData {
  doctor: {
    id: string;
    name: string;
    email: string;
    licenseNumber: string;
    specialty: string;
    qualification: string;
    verificationStatus: string;
    isActive: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    reviewedAt?: string;
  };
  requirements: {
    mandatory: Array<{
      key: string;
      title: string;
      required: boolean;
      uploaded: boolean;
      status: string;
    }>;
    supporting: Array<{
      key: string;
      title: string;
      required: boolean;
      uploaded: boolean;
      status: string;
    }>;
    canSubmit: boolean;
    isUnderReview: boolean;
    isVerified: boolean;
    isRejected: boolean;
    isSuspended: boolean;
  };
  documents: DocumentItem[];
}

export const DoctorCredentialsCard: React.FC = () => {
  const { refreshUser } = useAuth();
  const [data, setData] = useState<VerificationStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/doctors/verification/status');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load verification status:', err);
      setError('Unable to load verification status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileUpload = async (categoryKey: string, file: File) => {
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please choose a smaller document.');
      return;
    }

    // Check file type
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setError('Invalid file type. Only PDF, PNG, and JPG/JPEG files are allowed.');
      return;
    }

    setUploadingCategory(categoryKey);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', categoryKey);

      await api.post('/doctors/verification/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNotification({ type: 'success', text: 'Document uploaded successfully!' });
      await fetchStatus();
      await refreshUser();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to upload document.';
      setError(errMsg);
      setNotification({ type: 'error', text: errMsg });
    } finally {
      setUploadingCategory(null);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSubmitForReview = async () => {
    if (!data?.requirements?.canSubmit) {
      setError('Please upload both mandatory documents before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/doctors/verification/submit');
      setNotification({
        type: 'success',
        text: 'Credentials submitted for SmartHealth Admin review! Status updated to Under Review.',
      });
      await fetchStatus();
      await refreshUser();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to submit verification request.';
      setError(errMsg);
      setNotification({ type: 'error', text: errMsg });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleViewDocument = (documentId: string) => {
    const token = localStorage.getItem('smarthealth_token') || localStorage.getItem('token');
    window.open(`http://localhost:5000/api/doctors/verification/documents/${documentId}/view?token=${token}`, '_blank');
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to remove this uploaded document?')) return;

    try {
      await api.delete(`/doctors/verification/documents/${documentId}`);
      setNotification({ type: 'success', text: 'Document removed successfully.' });
      await fetchStatus();
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete document.');
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
        <div>Loading verification credentials...</div>
      </div>
    );
  }

  const doctor = data?.doctor;
  const status = (doctor?.verificationStatus || 'PENDING_DOCUMENTS').toUpperCase();
  const isVerified = status === 'VERIFIED';
  const isUnderReview = status === 'UNDER_REVIEW' || status === 'ADMIN_REVIEW';
  const isRejected = status === 'REJECTED';
  const isSuspended = status === 'SUSPENDED';

  const allCategories = [
    ...(data?.requirements?.mandatory || []),
    ...(data?.requirements?.supporting || []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

      {/* Main Status Header Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.75rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Award size={22} color="#0284c7" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Doctor Credential Verification &amp; Eligibility
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
              Only Admin-verified and active doctors can receive patient appointments on SmartHealth.
            </p>
          </div>

          {/* Verification Status Badge */}
          <div>
            {isVerified && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                }}
              >
                <CheckCircle2 size={18} /> ✓ Verified Doctor
              </span>
            )}

            {isUnderReview && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                }}
              >
                <Clock size={18} /> ◷ Verification Pending
              </span>
            )}

            {isRejected && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                }}
              >
                <XCircle size={18} /> ✕ Verification Rejected
              </span>
            )}

            {isSuspended && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: '#1e293b',
                  color: '#fbbf24',
                  border: '1px solid #475569',
                }}
              >
                <AlertTriangle size={18} /> ⚠ Verification Suspended
              </span>
            )}

            {!isVerified && !isUnderReview && !isRejected && !isSuspended && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                }}
              >
                <Clock size={18} /> ◷ Documents Required
              </span>
            )}
          </div>
        </div>

        {/* Detailed Status Explanation Box */}
        {isVerified && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '1rem 1.25rem' }}>
            <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              ✓ Your doctor profile is verified and active!
            </div>
            <div style={{ fontSize: '0.82rem', color: '#15803d', lineHeight: 1.5 }}>
              You are officially eligible to receive patient consultations. Verified by{' '}
              <strong>{doctor?.verifiedBy || 'Admin'}</strong>
              {doctor?.verifiedAt && ` on ${new Date(doctor.verifiedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}.
            </div>
          </div>
        )}

        {isUnderReview && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '1rem 1.25rem' }}>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              ◷ Verification In Progress
            </div>
            <div style={{ fontSize: '0.82rem', color: '#b45309', lineHeight: 1.5 }}>
              Your submitted documents are currently being reviewed by the SmartHealth Admin. You will receive an official notification once your review is finalized.
            </div>
          </div>
        )}

        {isRejected && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1.15rem' }}>
            <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <XCircle size={18} /> Verification Rejected
            </div>
            <div style={{ fontSize: '0.84rem', color: '#b91c1c', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              <strong>Admin Reason:</strong> {doctor?.rejectionReason || 'Uploaded documentation was unclear or incomplete.'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
              Please review the feedback above, upload corrected documents for the flagged categories below, and click <strong>&ldquo;Resubmit for Verification&rdquo;</strong>.
            </div>
          </div>
        )}

        {isSuspended && (
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '1.15rem', color: '#f8fafc' }}>
            <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <AlertTriangle size={18} /> Account Suspended
            </div>
            <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              Your account is currently not eligible to receive new appointments.{' '}
              {doctor?.rejectionReason && `Reason: "${doctor.rejectionReason}". `}
              Contact Admin for more information. Existing previously confirmed appointments remain logged.
            </div>
          </div>
        )}

        {!isVerified && !isUnderReview && !isRejected && !isSuspended && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1rem 1.25rem' }}>
            <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              Action Required: Submit Mandatory Documents
            </div>
            <div style={{ fontSize: '0.82rem', color: '#1d4ed8', lineHeight: 1.5 }}>
              To receive new patient appointments, you must upload: <strong>1) Medical / Practitioner Registration Certificate</strong> and <strong>2) Qualifying Medical Degree</strong>. Once uploaded, submit your credentials for Admin review.
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, color: '#be123c', fontSize: '0.82rem', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      {/* Category Upload Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileCheck size={18} color="#0284c7" /> Required &amp; Supporting Credentials
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
          {allCategories.map((cat) => {
            const uploadedDoc = data?.documents?.find((d) => d.documentType === cat.key);
            const isUploaded = !!uploadedDoc;
            const isMandatory = cat.required;
            const isCategoryUploading = uploadingCategory === cat.key;

            return (
              <div
                key={cat.key}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${isUploaded ? '#cbd5e1' : isMandatory ? '#fbcfe8' : '#e2e8f0'}`,
                  borderRadius: 14,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div>
                  {/* Category Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {cat.title}
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 6,
                        background: isMandatory ? '#fdf2f8' : '#f8fafc',
                        color: isMandatory ? '#be185d' : '#64748b',
                        border: `1px solid ${isMandatory ? '#fbcfe8' : '#e2e8f0'}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isMandatory ? 'MANDATORY' : 'SUPPORTING'}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div style={{ marginTop: '0.4rem' }}>
                    {isUploaded ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>
                        <CheckCircle2 size={14} color="#047857" />
                        <span>Uploaded: {uploadedDoc.fileName}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <Clock size={14} />
                        <span>Not uploaded yet</span>
                      </div>
                    )}
                  </div>

                  {uploadedDoc?.rejectionReason && (
                    <div style={{ marginTop: '0.5rem', padding: '0.45rem 0.65rem', background: '#fff1f2', borderRadius: 8, fontSize: '0.75rem', color: '#be123c', border: '1px solid #fecdd3' }}>
                      <strong>Rejection note:</strong> {uploadedDoc.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  {/* File Upload Input */}
                  <label
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 8,
                      background: isUploaded ? '#f8fafc' : '#0284c7',
                      color: isUploaded ? '#0f172a' : '#ffffff',
                      border: `1px solid ${isUploaded ? '#cbd5e1' : '#0284c7'}`,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isCategoryUploading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Upload size={14} />
                    <span>{isCategoryUploading ? 'Uploading...' : isUploaded ? 'Replace Document' : 'Upload Document'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={isCategoryUploading}
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(cat.key, file);
                      }}
                    />
                  </label>

                  {/* View Document */}
                  {isUploaded && (
                    <button
                      type="button"
                      onClick={() => handleViewDocument(uploadedDoc.id)}
                      title="View uploaded document"
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        color: '#0284c7',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      <Eye size={14} /> View
                    </button>
                  )}

                  {/* Delete Document (if not verified) */}
                  {isUploaded && !isVerified && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(uploadedDoc.id)}
                      title="Remove document"
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#ffffff',
                        border: '1px solid #fecdd3',
                        borderRadius: 8,
                        color: '#be123c',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission CTA Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
            Ready for Admin Verification Review?
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
            {data?.requirements?.canSubmit
              ? 'Both mandatory credentials are uploaded. Submit for official Admin verification.'
              : 'Please upload both Medical Registration Certificate and Qualifying Medical Degree to enable submission.'}
          </div>
        </div>

        <button
          onClick={handleSubmitForReview}
          disabled={!data?.requirements?.canSubmit || submitting || isVerified}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: 10,
            border: 'none',
            background:
              !data?.requirements?.canSubmit || isVerified
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: !data?.requirements?.canSubmit || submitting || isVerified ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow:
              !data?.requirements?.canSubmit || isVerified ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Send size={15} />
          <span>
            {submitting
              ? 'Submitting Request...'
              : isVerified
              ? 'Profile Already Verified'
              : isUnderReview
              ? 'Resubmit Verification Request'
              : 'Submit for Admin Verification'}
          </span>
        </button>
      </div>
    </div>
  );
};
