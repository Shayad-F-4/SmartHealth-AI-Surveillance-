import React from 'react';
import { Calendar, Clock, Users, Video, Edit3, ShieldCheck } from 'lucide-react';

interface DoctorAvailabilityCardProps {
  onEdit?: () => void;
  isEditable?: boolean;
}

export const DoctorAvailabilityCard: React.FC<DoctorAvailabilityCardProps> = ({
  onEdit,
  isEditable = true
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '1.35rem 1.5rem',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.6rem',
              borderRadius: 12,
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0' }}>
              Clinical Availability &amp; Schedule
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              Manage consultation days, hours, and mode settings
            </p>
          </div>
        </div>
        {isEditable && onEdit && (
          <button
            onClick={onEdit}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Edit3 size={14} /> Edit Availability
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div style={{ padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Calendar size={14} color="#0284c7" /> Working Days
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Monday &mdash; Saturday</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', margin: 0 }}>Sunday on-call emergency duty only</p>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Clock size={14} color="#0284c7" /> Consultation Hours
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>09:00 AM &mdash; 05:00 PM</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', margin: 0 }}>Lunch Break: 01:00 PM &mdash; 02:00 PM</p>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Users size={14} color="#0284c7" /> Max Daily Consultations
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>25 Patients / Day</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', margin: 0 }}>Automated queue booking cap</p>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Video size={14} color="#0284c7" /> Consultation Modes
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 999, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              In-Person Clinical
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
              Teleconsultation
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#0369a1', fontWeight: 600 }}>
        <ShieldCheck size={16} color="#0284c7" style={{ flexShrink: 0 }} />
        <span>Appointments booked via SmartHealth automatically align with these working hours.</span>
      </div>
    </div>
  );
};
