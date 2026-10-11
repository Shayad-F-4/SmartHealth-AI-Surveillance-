import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  UserCheck,
  PlusCircle,
  Search,
  Clock,
  Building2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';

export const DoctorDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/doctors/dashboard');
        setDashboardData(res.data);
      } catch (err) {
        console.error('Failed to load doctor dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const status = dashboardData?.doctor?.verificationStatus || (user?.doctor as any)?.verificationStatus || 'PENDING_DOCUMENTS';
  const isVerified = status === 'VERIFIED';
  const isUnderReview = status === 'UNDER_REVIEW' || status === 'ADMIN_REVIEW';
  const isRejected = status === 'REJECTED';
  const isSuspended = status === 'SUSPENDED';

  return (
    <div>
      {/* Verification Status Alert Banner */}
      {!isVerified && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: isRejected ? '#fef2f2' : isSuspended ? '#0f172a' : isUnderReview ? '#fffbeb' : '#eff6ff',
            border: `1px solid ${isRejected ? '#fecaca' : isSuspended ? '#334155' : isUnderReview ? '#fde68a' : '#bfdbfe'}`,
            color: isRejected ? '#991b1b' : isSuspended ? '#f8fafc' : isUnderReview ? '#92400e' : '#1e40af',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {isRejected ? (
              <AlertTriangle size={20} color="#dc2626" />
            ) : isSuspended ? (
              <AlertTriangle size={20} color="#fbbf24" />
            ) : (
              <Clock size={20} color={isUnderReview ? '#d97706' : '#2563eb'} />
            )}
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                {isRejected
                  ? 'Verification Rejected — New Appointments Blocked'
                  : isSuspended
                  ? 'Account Suspended — New Appointments Blocked'
                  : isUnderReview
                  ? 'Verification Pending Admin Approval'
                  : 'Action Required: Submit Doctor Credentials'}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '2px' }}>
                {isRejected
                  ? `Reason: "${dashboardData?.doctor?.rejectionReason || 'Please review your uploaded documentation'}". Upload corrected documents to resubmit.`
                  : isSuspended
                  ? 'Your profile is temporarily suspended from receiving new appointments. Contact Admin.'
                  : isUnderReview
                  ? 'Your submitted credentials are under review by Admin. You will become eligible for appointments once approved.'
                  : 'To receive patient appointments, upload your Medical Registration Certificate & Degree.'}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('profile')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: 8,
              border: 'none',
              background: isRejected ? '#dc2626' : isSuspended ? '#334155' : isUnderReview ? '#d97706' : '#2563eb',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isRejected ? 'Upload Corrected Documents' : isUnderReview ? 'View Documents' : 'Upload Credentials'}
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Doctor Clinical Portal &bull; {user?.name}
            </h1>
            {isVerified ? (
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.2rem 0.65rem', borderRadius: 999 }}>
                ✓ Verified Doctor
              </span>
            ) : isRejected ? (
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.2rem 0.65rem', borderRadius: 999 }}>
                ✕ Verification Rejected
              </span>
            ) : isSuspended ? (
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fbbf24', background: '#1e293b', border: '1px solid #475569', padding: '0.2rem 0.65rem', borderRadius: 999 }}>
                ⚠ Verification Suspended
              </span>
            ) : (
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.2rem 0.65rem', borderRadius: 999 }}>
                ◷ Verification Pending
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
            Specialty: <strong>{user?.doctor?.specialty || 'General Medicine'}</strong> &bull; License: <strong style={{ fontFamily: 'var(--font-mono)' }}>{user?.doctor?.licenseNumber}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onNavigate('patient-search')} className="btn btn-outline">
            <Search size={16} /> Scan / Search Patient ID
          </button>
          <button onClick={() => onNavigate('add-visit')} className="btn btn-primary">
            <PlusCircle size={16} /> New Consultation
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div>
            <div className="metric-label">Today's Visits</div>
            <div className="metric-val">{dashboardData?.metrics?.todayVisitsCount || 0}</div>
            <span className="badge badge-success" style={{ marginTop: '0.35rem' }}>Active Shift</span>
          </div>
          <div className="metric-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <Activity size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Total Patient Consultations</div>
            <div className="metric-val">{dashboardData?.metrics?.totalConsultations || 0}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical records logged</span>
          </div>
          <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <UserCheck size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Pending Specialist Referrals</div>
            <div className="metric-val" style={{ color: dashboardData?.metrics?.pendingReferrals > 0 ? '#f59e0b' : 'var(--text-main)' }}>
              {dashboardData?.metrics?.pendingReferrals || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting review</span>
          </div>
          <div className="metric-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Recent Consultations Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} color="var(--primary-600)" />
            Recent Patient Consultations
          </h3>
          <button onClick={() => onNavigate('add-visit')} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
            <PlusCircle size={15} /> Record Encounter
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading consultation telemetry...</div>
        ) : dashboardData?.recentVisits?.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No consultations logged yet today.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Disease</th>
                  <th>Severity</th>
                  <th>Classification</th>
                  <th>Date & Time</th>
                  <th>Clinical Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.recentVisits?.map((v: any) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.patient?.user?.name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {v.patient?.healthId}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{v.disease}</span>
                    </td>
                    <td>
                      <span className={`badge ${v.severity === 'SEVERE' ? 'badge-danger' : 'badge-info'}`}>
                        {v.severity}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-purple">{v.visitClassification}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(v.visitDate).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{v.diagnosis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
