import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Video,
  Plus,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import api from '../../services/api';

interface PatientAppointmentsPageProps {
  onNavigate?: (tab: string) => void;
}

export const PatientAppointmentsPage: React.FC<PatientAppointmentsPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments'>('my-appointments');

  // Booking Flow State
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [consultType, setConsultType] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [reason, setReason] = useState<string>('');

  // Patient Appointments List State
  const [appointments, setAppointments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // UI States
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Search filter for doctors
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');

  // 1. Fetch Verified Doctors & Patient Appointments
  const loadDoctors = async () => {
    try {
      const res = await api.get('/appointments/doctors');
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  const loadMyAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/my-appointments');
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Failed to load patient appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
    loadMyAppointments();
  }, []);

  // 2. Fetch Slots when Doctor & Date change
  const fetchDoctorSlots = async (doctorId: string, dateStr: string) => {
    setSlotsLoading(true);
    try {
      const res = await api.get(`/appointments/doctors/${doctorId}/slots?date=${dateStr}`);
      setSlots(res.data.slots || []);
    } catch (err) {
      console.error('Failed to load doctor time slots:', err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchDoctorSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  // 3. Handle Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setNotification({ type: 'error', text: 'Please select a doctor, date, and available time slot.' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/appointments/book', {
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        type: consultType,
        reason: reason || 'General Consultation',
      });

      setNotification({ type: 'success', text: 'Appointment booking request submitted! Awaiting doctor approval.' });
      setIsBookingModalOpen(false);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      setReason('');
      setActiveTab('my-appointments');
      await loadMyAppointments();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.response?.data?.error || 'Failed to submit booking request. Please try another slot.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Handle Cancel Appointment
  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment request?')) return;

    try {
      await api.post(`/appointments/${id}/cancel`, { reason: 'Cancelled by patient' });
      setNotification({ type: 'success', text: 'Appointment cancelled successfully.' });
      await loadMyAppointments();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.response?.data?.error || 'Failed to cancel appointment.' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((app) => {
    if (statusFilter === 'ALL') return true;
    return app.status === statusFilter;
  });

  const filteredDoctors = doctors.filter((doc) => {
    const q = searchDoctorQuery.toLowerCase();
    return (
      doc.user?.name?.toLowerCase().includes(q) ||
      doc.specialty?.toLowerCase().includes(q) ||
      doc.hospital?.name?.toLowerCase().includes(q) ||
      doc.hospital?.district?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
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

      {/* Page Title & Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={24} color="#0284c7" /> Clinical Appointments &amp; Consultations
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.3rem 0 0 0' }}>
            Book available time slots with verified practitioners &amp; track approval statuses
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 12, padding: '4px' }}>
          <button
            onClick={() => setActiveTab('my-appointments')}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: 9,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'my-appointments' ? '#ffffff' : 'transparent',
              color: activeTab === 'my-appointments' ? '#0f172a' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'my-appointments' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
            }}
          >
            My Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('book')}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: 9,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'book' ? '#0284c7' : 'transparent',
              color: activeTab === 'book' ? '#ffffff' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'book' ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Plus size={15} /> Book New Slot
          </button>
        </div>
      </div>

      {/* ── TAB 1: MY APPOINTMENTS ────────────────────────────────────── */}
      {activeTab === 'my-appointments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Status Filter Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: `1px solid ${statusFilter === st ? '#0284c7' : '#cbd5e1'}`,
                  background: statusFilter === st ? '#e0f2fe' : '#ffffff',
                  color: statusFilter === st ? '#0369a1' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {st === 'ALL' ? 'All Appointments' : st}
              </button>
            ))}
          </div>

          {/* Appointments Grid */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
              <div>Loading your appointments...</div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '3rem 1.5rem',
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              }}
            >
              <Calendar size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                No appointments found
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                {statusFilter === 'ALL'
                  ? "You haven't scheduled any clinical appointments yet."
                  : `No appointments with status "${statusFilter}".`}
              </p>
              <button
                onClick={() => setActiveTab('book')}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Plus size={16} /> Book Your First Appointment
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {filteredAppointments.map((app) => {
                const dateStr = new Date(app.appointmentDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                const isPending = app.status === 'PENDING';
                const isApproved = app.status === 'APPROVED';
                const isRejected = app.status === 'REJECTED';
                const isCompleted = app.status === 'COMPLETED';

                const statusColor = isApproved ? '#059669' : isPending ? '#d97706' : isRejected ? '#dc2626' : '#0284c7';
                const statusBg = isApproved ? '#ecfdf5' : isPending ? '#fffbeb' : isRejected ? '#fef2f2' : '#f0f9ff';
                const statusBorder = isApproved ? '#a7f3d0' : isPending ? '#fde68a' : isRejected ? '#fecaca' : '#bae6fd';

                return (
                  <div
                    key={app.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 16,
                      padding: '1.25rem',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      {/* Doctor Info Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1rem',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {app.doctor?.user?.avatarUrl ? (
                              <img
                                src={app.doctor.user.avatarUrl.startsWith('http') ? app.doctor.user.avatarUrl : `http://localhost:5000${app.doctor.user.avatarUrl}`}
                                alt={app.doctor?.user?.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              app.doctor?.user?.name ? app.doctor.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'DR'
                            )}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                              {app.doctor?.user?.name || 'Dr. Practitioner'}
                            </h4>
                            <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                              {app.doctor?.specialty || 'General Medicine'}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 999,
                            background: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusBorder}`,
                          }}
                        >
                          {app.status}
                        </span>
                      </div>

                      {/* Details Box */}
                      <div style={{ background: '#f8fafc', borderRadius: 12, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155', fontWeight: 700 }}>
                          <Calendar size={14} color="#0284c7" /> {dateStr} at {app.startTime} ({app.type === 'VIRTUAL' ? 'Tele-Consult' : 'In-Person'})
                        </div>
                        {app.doctor?.hospital && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#64748b' }}>
                            <Building2 size={13} color="#64748b" /> {app.doctor.hospital.name} ({app.doctor.hospital.district})
                          </div>
                        )}
                        {app.reason && (
                          <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem', fontStyle: 'italic' }}>
                            &ldquo;{app.reason}&rdquo;
                          </div>
                        )}
                      </div>

                      {/* Doctor Notes or Virtual Meeting Link */}
                      {app.doctorNotes && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: isRejected ? '#be123c' : '#0369a1', background: isRejected ? '#fff1f2' : '#f0f9ff', padding: '0.6rem 0.75rem', borderRadius: 8, border: `1px solid ${isRejected ? '#fecdd3' : '#bae6fd'}` }}>
                          <strong>Doctor Feedback:</strong> {app.doctorNotes}
                        </div>
                      )}

                      {app.meetingLink && isApproved && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <a
                            href={app.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.85rem',
                              background: '#15803d',
                              color: 'white',
                              borderRadius: 8,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            <Video size={14} /> Join Video Consult
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <button
                        onClick={() => handleCancelAppointment(app.id)}
                        style={{
                          width: '100%',
                          padding: '0.45rem',
                          background: '#ffffff',
                          border: '1px solid #fecdd3',
                          color: '#be123c',
                          borderRadius: 8,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel Booking Request
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: BOOK NEW APPOINTMENT ───────────────────────────────── */}
      {activeTab === 'book' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Doctor Search & Filter */}
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '1rem 1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              value={searchDoctorQuery}
              onChange={(e) => setSearchDoctorQuery(e.target.value)}
              placeholder="Search verified doctors by name, medical specialty, hospital, or district..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.88rem', color: '#0f172a' }}
            />
          </div>

          {/* Verified Doctors Directory */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {filteredDoctors.map((doc) => {
              const isSelected = selectedDoctor?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  style={{
                    background: '#ffffff',
                    border: `2px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                    borderRadius: 16,
                    padding: '1.35rem',
                    boxShadow: isSelected ? '0 4px 16px rgba(2, 132, 199, 0.15)' : '0 2px 8px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {doc.user?.avatarUrl ? (
                        <img
                          src={doc.user.avatarUrl.startsWith('http') ? doc.user.avatarUrl : `http://localhost:5000${doc.user.avatarUrl}`}
                          alt={doc.user?.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        doc.user?.name ? doc.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'DR'
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {doc.user?.name || 'Dr. Practitioner'}
                      </h3>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                        {doc.specialty}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        {doc.qualification} &bull; {doc.experienceYears} yrs exp.
                      </div>
                      {doc.hospital && (
                        <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Building2 size={12} color="#64748b" /> {doc.hospital.name} ({doc.hospital.district})
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setIsBookingModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: isSelected ? '#0284c7' : 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    Select &amp; View Time Slots <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BOOKING MODAL & SLOT SELECTOR ─────────────────────────────── */}
      {isBookingModalOpen && selectedDoctor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              margin: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Book Appointment with {selectedDoctor.user?.name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#93c5fd', marginTop: '2px' }}>
                  {selectedDoctor.specialty} &bull; {selectedDoctor.hospital?.name || 'SmartHealth Clinic'}
                </div>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: 8, padding: '0.35rem', color: 'white', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Date Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Select Consultation Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Time Slots Picker Grid */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Available Time Slots ({selectedDate})
                </label>
                {slotsLoading ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.4rem auto' }} />
                    <div style={{ fontSize: '0.8rem' }}>Checking doctor availability...</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {slots.map((s) => {
                      const isChosen = selectedSlot === s.time;
                      return (
                        <button
                          key={s.time}
                          disabled={!s.isAvailable}
                          onClick={() => setSelectedSlot(s.time)}
                          style={{
                            padding: '0.5rem 0.25rem',
                            borderRadius: 8,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            border: `1px solid ${isChosen ? '#0284c7' : s.isAvailable ? '#cbd5e1' : '#f1f5f9'}`,
                            background: isChosen ? '#0284c7' : s.isAvailable ? '#ffffff' : '#f8fafc',
                            color: isChosen ? '#ffffff' : s.isAvailable ? '#0f172a' : '#cbd5e1',
                            cursor: s.isAvailable ? 'pointer' : 'not-allowed',
                            textAlign: 'center',
                          }}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Consultation Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Consultation Type
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setConsultType('IN_PERSON')}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: 10,
                      border: `1px solid ${consultType === 'IN_PERSON' ? '#0284c7' : '#cbd5e1'}`,
                      background: consultType === 'IN_PERSON' ? '#e0f2fe' : '#ffffff',
                      color: consultType === 'IN_PERSON' ? '#0369a1' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    🏥 In-Person Clinic Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultType('VIRTUAL')}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: 10,
                      border: `1px solid ${consultType === 'VIRTUAL' ? '#0284c7' : '#cbd5e1'}`,
                      background: consultType === 'VIRTUAL' ? '#e0f2fe' : '#ffffff',
                      color: consultType === 'VIRTUAL' ? '#0369a1' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    💻 Tele-Consult Video Call
                  </button>
                </div>
              </div>

              {/* Chief Complaint / Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Reason for Visit / Chief Complaint
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason for scheduling this consultation..."
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Submit Action */}
              <button
                disabled={!selectedSlot || submitting}
                onClick={handleConfirmBooking}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: selectedSlot ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: selectedSlot ? 'pointer' : 'not-allowed',
                  boxShadow: selectedSlot ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                }}
              >
                {submitting ? 'Submitting Request...' : `Confirm Booking (${selectedDate} at ${selectedSlot || 'Select Time'})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
