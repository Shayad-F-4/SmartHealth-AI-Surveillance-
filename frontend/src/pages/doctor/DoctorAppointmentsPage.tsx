import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, 
  User, Check, X, Video, RefreshCw, Filter, MessageSquare
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  timeSlot: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  meetingLink?: string;
  patient?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    gender?: string;
    age?: number;
    bloodGroup?: string;
    avatarUrl?: string;
  };
}

export const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'COMPLETE' | null>(null);
  
  // Action form state
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = localStorage.getItem('token');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/appointments/doctor/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err: any) {
      console.error('Failed to fetch doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleOpenActionModal = (app: Appointment, type: 'APPROVE' | 'REJECT' | 'COMPLETE') => {
    setSelectedAppointment(app);
    setActionType(type);
    setNotes(app.notes || '');
    setMeetingLink(app.meetingLink || 'https://meet.google.com/' + Math.random().toString(36).substring(7));
    setErrorMsg('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedAppointment || !actionType) return;
    
    let targetStatus: string = 'APPROVED';
    if (actionType === 'REJECT') targetStatus = 'REJECTED';
    if (actionType === 'COMPLETE') targetStatus = 'COMPLETED';

    setSubmitting(true);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/appointments/${selectedAppointment.id}/status`,
        {
          status: targetStatus,
          notes,
          meetingLink: actionType === 'APPROVE' ? meetingLink : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSelectedAppointment(null);
        setActionType(null);
        fetchAppointments();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter(app => {
    if (statusFilter === 'ALL') return true;
    return app.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning"><Clock size={13} /> Pending</span>;
      case 'APPROVED':
        return <span className="badge badge-success"><CheckCircle size={13} /> Approved</span>;
      case 'REJECTED':
        return <span className="badge badge-danger"><XCircle size={13} /> Rejected</span>;
      case 'CANCELLED':
        return <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}><AlertCircle size={13} /> Cancelled</span>;
      case 'COMPLETED':
        return <span className="badge badge-info"><Check size={13} /> Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', padding: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon style={{ color: 'var(--primary-600)' }} size={26} />
            Patient Appointment Requests
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage clinical consultations, review patient requests, set video meeting links, and update consultation statuses.
          </p>
        </div>
        <button onClick={fetchAppointments} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh Requests
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((st) => {
          const count = st === 'ALL' ? appointments.length : appointments.filter(a => a.status === st).length;
          const isActive = statusFilter === st;
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500
              }}
            >
              {st.charAt(0) + st.slice(1).toLowerCase()}
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--border-subtle)',
                color: isActive ? '#ffffff' : 'var(--text-muted)'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto', color: 'var(--primary-600)' }} />
          <p>Loading patient appointment requests...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <CalendarIcon size={44} style={{ margin: '0 auto 1rem auto', color: 'var(--text-light)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Appointment Requests Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
            There are currently no patient requests matching the active status filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredAppointments.map((app) => (
            <div key={app.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.35rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {app.patient?.avatarUrl ? (
                      <img src={app.patient.avatarUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                    ) : (
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        {app.patient?.fullName?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>{app.patient?.fullName || 'Patient'}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.patient?.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {/* Appointment timing box */}
                <div style={{ background: 'var(--bg-page)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CalendarIcon size={14} style={{ color: 'var(--primary-600)' }} /> Date</span>
                    <strong style={{ color: 'var(--text-main)' }}>{app.appointmentDate}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} style={{ color: 'var(--primary-600)' }} /> Slot</span>
                    <strong style={{ color: 'var(--text-main)' }}>{app.timeSlot}</strong>
                  </div>
                </div>

                {/* Patient reason */}
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reason / Symptoms</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem', background: '#ffffff', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    {app.reason || 'General Health Checkup & Consultation'}
                  </p>
                </div>

                {app.notes && (
                  <div style={{ fontSize: '0.8rem', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', color: '#92400e', padding: '0.6rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem' }}>
                    <strong>Doctor Note:</strong> {app.notes}
                  </div>
                )}

                {app.meetingLink && app.status === 'APPROVED' && (
                  <a
                    href={app.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center', color: 'var(--primary-700)', borderColor: 'var(--primary-300)', background: 'var(--primary-50)', marginBottom: '0.85rem', fontSize: '0.82rem' }}
                  >
                    <Video size={15} /> Join Virtual Video Consultation
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
                {app.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleOpenActionModal(app, 'REJECT')}
                      className="btn"
                      style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleOpenActionModal(app, 'APPROVE')}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                    >
                      <Check size={14} /> Approve
                    </button>
                  </>
                )}

                {app.status === 'APPROVED' && (
                  <button
                    onClick={() => handleOpenActionModal(app, 'COMPLETE')}
                    className="btn"
                    style={{ background: 'var(--color-success-bg)', color: '#047857', border: '1px solid var(--color-success-border)', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  >
                    <CheckCircle size={14} /> Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedAppointment && actionType && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', background: '#ffffff', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              {actionType === 'APPROVE' && 'Approve Appointment Request'}
              {actionType === 'REJECT' && 'Reject Appointment Request'}
              {actionType === 'COMPLETE' && 'Complete Appointment'}
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Patient: <strong style={{ color: 'var(--text-main)' }}>{selectedAppointment.patient?.fullName}</strong> &bull; Slot: <strong style={{ color: 'var(--text-main)' }}>{selectedAppointment.appointmentDate} ({selectedAppointment.timeSlot})</strong>
            </p>

            {errorMsg && (
              <div style={{ padding: '0.65rem 0.85rem', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            {actionType === 'APPROVE' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Virtual Consultation Video Link
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-xyz-123"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Clinical Instructions / Notes for Patient (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter instructions, prep guidance, or reason..."
                style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => { setSelectedAppointment(null); setActionType(null); }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={submitting}
                className={`btn ${actionType === 'REJECT' ? 'btn-danger' : 'btn-primary'}`}
                style={{ background: actionType === 'REJECT' ? 'var(--color-danger)' : undefined }}
              >
                {submitting && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                Confirm {actionType.charAt(0) + actionType.slice(1).toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
