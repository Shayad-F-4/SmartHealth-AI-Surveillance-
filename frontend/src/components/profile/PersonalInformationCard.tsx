import React from 'react';
import { Edit2, User, Mail, Phone, MapPin, Globe, Calendar, Droplet } from 'lucide-react';

interface PersonalInformationCardProps {
  user: any;
  onEdit: () => void;
}

export const PersonalInformationCard: React.FC<PersonalInformationCardProps> = ({ user, onEdit }) => {
  const patient = user?.patient;
  const doctor = user?.doctor;

  const fullName = user?.name || 'Rahul Verma';
  const email = user?.email || 'rahul.verma2006@gmail.com';
  const phone = user?.phone || patient?.emergencyContactPhone || '+91 98765 43210';
  const address = patient?.address || doctor?.hospital?.address || 'Riverside District, Pune, Maharashtra';
  const gender = patient?.gender || 'Male';
  const bloodGroup = patient?.bloodGroup || 'B+';
  const dob = patient?.dob ? new Date(patient.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Jan 2006';

  const age = patient?.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 20;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <User size={18} color="#0284c7" /> Personal Information
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Your basic contact details and identity information
          </p>
        </div>
        <button
          onClick={onEdit}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#0284c7',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Edit2 size={13} /> Edit
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Full Name
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {fullName}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Date of Birth
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {dob} ({age} years)
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Gender
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {gender}
          </div>
        </div>

        {user?.role === 'PATIENT' && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Blood Group
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#dc2626', marginTop: '0.2rem' }}>
              {bloodGroup}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Phone Number
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {phone}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Email Address
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {email}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Address / District
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {address}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Preferred Language
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            English (India)
          </div>
        </div>
      </div>
    </div>
  );
};
