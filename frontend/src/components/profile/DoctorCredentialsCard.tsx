import React, { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Trash2, CheckCircle2, Clock, XCircle, AlertCircle, Award } from 'lucide-react';
import api from '../../services/api';

interface Document {
  id: string;
  documentType: string;
  documentNumber?: string;
  verificationStatus: string;
  uploadedAt: string;
  expiryDate?: string;
  fileName: string;
}

export const DoctorCredentialsCard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('MEDICAL_REGISTRATION_CERTIFICATE');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const documentTypes = [
    { value: 'MEDICAL_REGISTRATION_CERTIFICATE', label: 'Medical Registration Certificate' },
    { value: 'MEDICAL_DEGREE', label: 'Medical Degree' },
    { value: 'SPECIALIZATION_CERTIFICATE', label: 'Specialization Certificate' },
    { value: 'HOSPITAL_AFFILIATION_PROOF', label: 'Hospital/Clinic Affiliation Proof' },
    { value: 'OTHER_PROFESSIONAL', label: 'Other Professional Credential' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/identity-documents');
      setDocuments(res.data);
    } catch (err: any) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);

      await api.post('/identity-documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNotification({ type: 'success', text: 'Credential uploaded successfully!' });
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload credential');
      setNotification({ type: 'error', text: 'Failed to upload credential' });
    } finally {
      setUploading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleView = async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      window.open(`http://localhost:5000/api/identity-documents/${documentId}/view?token=${token}`, '_blank');
    } catch (err) {
      setError('Failed to view document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      await api.delete(`/identity-documents/${documentId}`);
      setNotification({ type: 'success', text: 'Credential deleted successfully!' });
      await fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete credential');
      setNotification({ type: 'error', text: 'Failed to delete credential' });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      UNVERIFIED: { color: 'bg-slate-100 text-slate-700', icon: Clock, label: 'Not Uploaded' },
      DOCUMENTS_PENDING: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
      PROCESSING: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Processing' },
      AI_REVIEW: { color: 'bg-purple-100 text-purple-700', icon: Clock, label: 'AI Review' },
      ADMIN_REVIEW: { color: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Admin Review' },
      VERIFIED: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Verified' },
      REVIEW_REQUIRED: { color: 'bg-amber-100 text-amber-700', icon: AlertCircle, label: 'Review Required' },
      REJECTED: { color: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'Rejected' },
      EXPIRED: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Expired' },
    };

    const config = statusConfig[status] || statusConfig.UNVERIFIED;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
        <div className="text-center text-slate-500 text-sm">Loading credentials...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Award size={18} color="#0284c7" /> Identity & Professional Credentials
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Upload professional credentials for verification (requires admin approval)
          </p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Upload Form */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Credential Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  background: '#ffffff',
                  color: '#0f172a',
                }}
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Document File
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  color: selectedFile ? '#0f172a' : '#94a3b8',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                <Upload size={16} color="#0284c7" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {selectedFile ? selectedFile.name : 'Choose credential document (PDF, PNG, JPG)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  required
                />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 8,
                border: 'none',
                background: uploading || !selectedFile ? '#cbd5e1' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: uploading || !selectedFile ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              {uploading ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Upload Credential</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <Award size={48} className="mx-auto mb-3 text-slate-300" />
          <p>No credentials uploaded yet</p>
          <p className="text-xs mt-1">Upload your professional credentials to get verified as a practitioner</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100">
                  <FileText size={20} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{doc.documentType.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(doc.verificationStatus)}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleView(doc.id)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    title="View Document"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
