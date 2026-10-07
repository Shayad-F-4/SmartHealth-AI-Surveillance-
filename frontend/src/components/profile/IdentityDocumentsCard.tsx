import React, { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Trash2, CheckCircle2, Clock, XCircle, AlertCircle, Download, UploadCloud, ShieldCheck, AlertTriangle, X } from 'lucide-react';
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

export const IdentityDocumentsCard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('PASSPORT');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const documentTypes = [
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'PAN_CARD', label: 'PAN Card' },
    { value: 'DRIVING_LICENCE', label: 'Driving Licence' },
    { value: 'VOTER_ID', label: 'Voter ID' },
    { value: 'AADHAAR_CARD', label: 'Aadhaar Card' },
    { value: 'OTHER_IDENTITY', label: 'Other Identity Document' },
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
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);

      await api.post('/identity-documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNotification({ type: 'success', text: 'Document uploaded successfully! AI validation in progress...' });
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload document');
      setNotification({ type: 'error', text: 'Failed to upload document' });
    } finally {
      setUploading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleView = async (documentId: string) => {
    try {
      const token = localStorage.getItem('smarthealth_token');
      window.open(`http://localhost:5000/api/identity-documents/${documentId}/view?token=${token}`, '_blank');
    } catch (err) {
      setError('Failed to view document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.delete(`/identity-documents/${documentId}`);
      setNotification({ type: 'success', text: 'Document deleted successfully!' });
      await fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete document');
      setNotification({ type: 'error', text: 'Failed to delete document' });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      UNVERIFIED: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock, label: 'Not Uploaded' },
      DOCUMENTS_PENDING: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
      PROCESSING: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck, label: 'Processing' },
      AI_REVIEW: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: ShieldCheck, label: 'AI Review' },
      ADMIN_REVIEW: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'Admin Review' },
      VERIFIED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Verified' },
      REVIEW_REQUIRED: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, label: 'Review Required' },
      REJECTED: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Rejected' },
      EXPIRED: { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: XCircle, label: 'Expired' },
    };

    const config = statusConfig[status] || statusConfig.UNVERIFIED;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
        <div className="text-center text-slate-500 text-sm">Loading documents...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FileText size={18} color="#0284c7" /> Identity & Official Documents
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Upload and verify your identity documents for profile verification
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
          {notification.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {notification.text}
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload Section */}
      <div
        style={{
          marginBottom: '1.75rem',
          padding: '2rem 1.5rem',
          borderRadius: 16,
          border: `2px dashed ${dragActive ? '#0284c7' : '#cbd5e1'}`,
          background: dragActive ? '#f0f9ff' : '#f8fafc',
          transition: 'all 0.2s ease',
          textAlign: 'center',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) setSelectedFile(file);
        }}
      >
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <UploadCloud size={28} />
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
            Upload Identity Document
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
            Select document type and upload your identity document for AI validation &amp; verification
          </p>

          {/* Document Type Selector Chips */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textAlign: 'left' }}>
              Select Document Type:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {documentTypes.map((type) => {
                const isSelected = documentType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setDocumentType(type.value)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? '#0284c7' : '#cbd5e1'}`,
                      background: isSelected ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                    }}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Picker & Action Bar */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={15} color="#0284c7" />
                  <span>Choose File</span>
                  {/* HIDDEN INPUT WITH EXPLICIT inline display: none */}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleUpload}
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
                  gap: '0.5rem',
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
                    <Upload size={15} />
                    <span>Upload &amp; Verify</span>
                  </>
                )}
              </button>
            </div>

            {/* Selected File Card */}
            {selectedFile ? (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                  <FileText size={16} color="#0284c7" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#0284c7', whiteSpace: 'nowrap' }}>
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                  title="Remove selected file"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                No file selected. Supported: PDF, PNG, JPG/JPEG (Max 5MB)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents List Header */}
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
          Your Uploaded Documents
        </h4>

        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 }}>
            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748b', margin: '0 0 0.35rem 0' }}>
              No documents uploaded yet
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
              Upload your identity documents above to get verified
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 220 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: '#f1f5f9',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                      {doc.documentType.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      {doc.expiryDate && <span>&bull; Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {getStatusBadge(doc.verificationStatus)}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      onClick={() => handleView(doc.id)}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      title="View Secure Document"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
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
    </div>
  );
};
