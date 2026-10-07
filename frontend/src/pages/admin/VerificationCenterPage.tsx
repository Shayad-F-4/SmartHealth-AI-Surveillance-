import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  User as UserIcon,
  Filter,
  Search,
  ShieldCheck,
  FileCheck,
  FileX,
  RefreshCw,
  ChevronRight,
  BadgeCheck,
  X,
  User,
  Stethoscope,
  Calendar,
  Award,
  ExternalLink,
  Info,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

interface VerificationRequest {
  id: string;
  requestType: string;
  aiDecision?: string;
  aiConfidence?: number;
  reviewDecision?: string;
  reviewReason?: string;
  reviewDate?: string;
  createdAt: string;
  verificationHistory?: string;
  document: {
    id: string;
    documentType: string;
    verificationStatus: string;
    uploadedAt: string;
    expiryDate?: string;
    documentNumber?: string;
    user: {
      id: string;
      name: string;
      role: string;
      email: string;
    };
  };
}

interface VerificationStats {
  pendingPatientVerifications: number;
  pendingDoctorVerifications: number;
  verified: number;
  rejected: number;
  reviewRequired: number;
}

export const VerificationCenterPage: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [filter, roleFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (roleFilter !== 'all') {
        params.append('requestType', roleFilter);
      }

      const [requestsRes, statsRes] = await Promise.all([
        api.get(`/verification/requests${params.toString() ? `?${params.toString()}` : ''}`),
        api.get('/verification/stats'),
      ]);
      setRequests(requestsRes.data);
      setStats(statsRes.data);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Failed to fetch verification data:', err);
      setError('Failed to load verification requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (decision: 'APPROVED' | 'REJECTED' | 'REQUEST_INFO') => {
    if (!selectedRequest) return;

    if (decision !== 'APPROVED' && !reviewReason.trim()) {
      setNotification({ type: 'error', text: 'Reason is required for this decision' });
      return;
    }

    setReviewing(true);
    try {
      await api.post(`/verification/requests/${selectedRequest.id}/review`, {
        decision,
        reason: reviewReason,
      });

      setNotification({ type: 'success', text: `Verification ${decision.toLowerCase()} successfully` });
      setSelectedRequest(null);
      setReviewReason('');
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.response?.data?.error || 'Failed to review request' });
    } finally {
      setReviewing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const token = localStorage.getItem('smarthealth_token');
      window.open(`http://localhost:5000/api/identity-documents/${documentId}/view?token=${token}`, '_blank');
    } catch (err) {
      setNotification({ type: 'error', text: 'Failed to view document' });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      UNVERIFIED: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock, label: 'Unverified' },
      DOCUMENTS_PENDING: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
      PROCESSING: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Loader2, label: 'Processing' },
      AI_REVIEW: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Search, label: 'AI Review' },
      ADMIN_REVIEW: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: UserIcon, label: 'Admin Review' },
      VERIFIED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Verified' },
      REVIEW_REQUIRED: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, label: 'Review Required' },
      REJECTED: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Rejected' },
      EXPIRED: { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: XCircle, label: 'Expired' },
    };

    const c = config[status] || config.UNVERIFIED;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.color}`}>
        <Icon size={12} />
        {c.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const config: any = {
      PATIENT: { color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: User, label: 'PATIENT' },
      DOCTOR: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Stethoscope, label: 'DOCTOR' },
      ADMIN: { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: BadgeCheck, label: 'ADMIN' },
    };

    const c = config[role] || config.PATIENT;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${c.color}`}>
        <Icon size={10} />
        {c.label}
      </span>
    );
  };

  const getDocumentIcon = (documentType: string) => {
    const type = documentType.toLowerCase();
    if (type.includes('medical') || type.includes('registration') || type.includes('certificate') || type.includes('degree')) {
      return <Award size={18} className="text-indigo-600" />;
    }
    return <FileText size={18} className="text-cyan-600" />;
  };

  const getDocumentCategory = (documentType: string) => {
    const type = documentType.toLowerCase();
    if (type.includes('medical') || type.includes('registration') || type.includes('certificate') || type.includes('degree')) {
      return 'Professional Credential';
    }
    return 'Government ID';
  };

  const filteredRequests = requests.filter((req) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.document.user.name.toLowerCase().includes(query) ||
        req.document.user.email.toLowerCase().includes(query) ||
        req.document.documentType.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const requiresAttention = filteredRequests.filter(
    (req) =>
      req.document.verificationStatus === 'REVIEW_REQUIRED' ||
      req.document.verificationStatus === 'ADMIN_REVIEW'
  );

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {/* Header Skeleton */}
          <div className="mb-8 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-64 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse mb-3" />
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Filter Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex items-center gap-4">
            <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="flex-1 h-9 bg-slate-200 rounded-lg animate-pulse" />
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-12 bg-slate-50 border-b border-slate-200" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 border-b border-slate-100 flex items-center px-4 gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to load verification requests</h3>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-right-2 duration-300 ${
            notification.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {notification.text}
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem 1.5rem 3rem 1.5rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Identity &amp; Credential Verification
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Verification Center &bull; Review identity documents and professional credentials securely
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Last updated: {lastUpdated}</span>
            )}
            <button
              onClick={fetchData}
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
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {/* Pending Patient */}
            <div
              onClick={() => {
                setFilter('all');
                setRoleFilter('PATIENT_IDENTITY');
              }}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '1.15rem 1.25rem',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <UserIcon size={18} color="#0284c7" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Patient</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.pendingPatientVerifications}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Awaiting review</div>
            </div>

            {/* Pending Doctor */}
            <div
              onClick={() => {
                setFilter('all');
                setRoleFilter('DOCTOR_CREDENTIAL');
              }}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '1.15rem 1.25rem',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <FileCheck size={18} color="#7c3aed" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Doctor</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.pendingDoctorVerifications}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Credentials review</div>
            </div>

            {/* Review Required */}
            <div
              onClick={() => setFilter('REVIEW_REQUIRED')}
              style={{
                background: '#ffffff',
                border: '1px solid #fde68a',
                borderRadius: 14,
                padding: '1.15rem 1.25rem',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <AlertTriangle size={18} color="#d97706" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Review Required</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>{stats.reviewRequired}</div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.2rem' }}>Needs attention</div>
            </div>

            {/* Verified */}
            <div
              onClick={() => setFilter('VERIFIED')}
              style={{
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: 14,
                padding: '1.15rem 1.25rem',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Verified</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>{stats.verified}</div>
              <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.2rem' }}>Successfully verified</div>
            </div>

            {/* Rejected */}
            <div
              onClick={() => setFilter('REJECTED')}
              style={{
                background: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: 14,
                padding: '1.15rem 1.25rem',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <FileX size={18} color="#dc2626" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rejected</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>{stats.rejected}</div>
              <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.2rem' }}>Requires correction</div>
            </div>
          </div>
        )}

        {/* Requires Attention Section */}
        {requiresAttention.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '1.25rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <AlertTriangle size={18} color="#d97706" />
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Requires Attention ({requiresAttention.length})
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {requiresAttention.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    background: '#ffffff',
                    border: '1px solid #fef3c7',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>
                      {req.document.user.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{req.document.user.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                        {getRoleBadge(req.document.user.role)}
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.document.documentType.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {getStatusBadge(req.document.verificationStatus)}
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="#64748b" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', color: '#0f172a' }}
            >
              <option value="all">All Status</option>
              <option value="ADMIN_REVIEW">Admin Review</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', color: '#0f172a' }}
            >
              <option value="all">All Roles</option>
              <option value="PATIENT_IDENTITY">Patient</option>
              <option value="DOCTOR_CREDENTIAL">Doctor</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 220 }}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Search by name, email, or document type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ padding: '0.35rem 0.65rem', borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Verification Requests Table */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>User</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Document</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Submitted</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Analysis</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                      <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>No verification requests found</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {filter !== 'all' || roleFilter !== 'all' || searchQuery
                          ? 'Try adjusting your filter or search terms'
                          : 'There are currently no pending verification requests'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, flexShrink: 0 }}>
                            {req.document.user.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{req.document.user.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                              {getRoleBadge(req.document.user.role)}
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{req.document.user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ padding: '0.35rem', borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center' }}>
                            {getDocumentIcon(req.document.documentType)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{req.document.documentType.replace(/_/g, ' ')}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{getDocumentCategory(req.document.documentType)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#475569' }}>
                        {new Date(req.document.uploadedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {req.aiDecision ? (
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{req.aiDecision}</div>
                            {req.aiConfidence && req.aiConfidence > 0 ? (
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{req.aiConfidence.toFixed(0)}% confidence</div>
                            ) : (
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Manual review required</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI Unavailable</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>{getStatusBadge(req.document.verificationStatus)}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button
                          onClick={() => setSelectedRequest(req)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: 6,
                            border: 'none',
                            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                          }}
                        >
                          <span>Review</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Drawer / Modal */}
      {selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Verification Review</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* User Information */}
              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={15} color="#0284c7" /> User Information
                </h4>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Name</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedRequest.document.user.name}</span>
                      {getRoleBadge(selectedRequest.document.user.role)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Email</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedRequest.document.user.email}</span>
                  </div>
                </div>
              </div>

              {/* Document Details */}
              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={15} color="#0284c7" /> Document Details
                </h4>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Document Type</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedRequest.document.documentType.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Category</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{getDocumentCategory(selectedRequest.document.documentType)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Uploaded Date</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{new Date(selectedRequest.document.uploadedAt).toLocaleString()}</span>
                  </div>
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => handleViewDocument(selectedRequest.document.id)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 6,
                        border: '1px solid #bae6fd',
                        background: '#f0f9ff',
                        color: '#0284c7',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>View Secure Document File</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Search size={15} color="#0284c7" /> AI Pre-check Analysis
                </h4>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>AI Recommendation</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedRequest.aiDecision || 'Manual Review Required'}</span>
                  </div>
                  {selectedRequest.aiConfidence && selectedRequest.aiConfidence > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Confidence Score</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedRequest.aiConfidence.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Status */}
              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0' }}>Current Verification Status</h4>
                <div>{getStatusBadge(selectedRequest.document.verificationStatus)}</div>
              </div>

              {/* Admin Actions */}
              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0' }}>Admin Decision</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Reason / Notes (Required if rejecting or requesting info)
                    </label>
                    <textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      placeholder="Enter review feedback or reason for decision..."
                      rows={3}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleReview('APPROVED')}
                      disabled={reviewing}
                      style={{
                        flex: 1,
                        padding: '0.6rem 1rem',
                        borderRadius: 8,
                        border: 'none',
                        background: '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: reviewing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {reviewing ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle2 size={15} />}
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleReview('REQUEST_INFO')}
                      disabled={reviewing}
                      style={{
                        flex: 1,
                        padding: '0.6rem 1rem',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: reviewing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {reviewing ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Info size={15} />}
                      <span>Request Info</span>
                    </button>

                    <button
                      onClick={() => handleReview('REJECTED')}
                      disabled={reviewing}
                      style={{
                        flex: 1,
                        padding: '0.6rem 1rem',
                        borderRadius: 8,
                        border: 'none',
                        background: '#dc2626',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: reviewing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {reviewing ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <XCircle size={15} />}
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
