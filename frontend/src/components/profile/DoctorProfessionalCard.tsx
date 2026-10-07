import React from 'react';
import { Stethoscope, Award, Building2, ShieldCheck, Edit2 } from 'lucide-react';

interface DoctorProfessionalCardProps {
  doctor: any;
  onEdit: () => void;
}

export const DoctorProfessionalCard: React.FC<DoctorProfessionalCardProps> = ({ doctor, onEdit }) => {
  const qualification = doctor?.qualification || 'MBBS, MD';
  const specialty = doctor?.specialty || 'Internal Medicine';
  const hospital = doctor?.hospital?.name || 'Metro Central Multi-Specialty Hospital';
  const department = 'General Medicine';
  const experienceYears = doctor?.experienceYears || 15;
  const licenseNumber = doctor?.licenseNumber || 'MCI-2010-45231';
  const consultationType = 'In-Person & Teleconsultation';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '1.35rem 1.5rem',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Stethoscope size={18} color="#0284c7" /> Professional Clinical Credentials
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Medical registration, specialty qualification, and healthcare facility affiliation
          </p>
        </div>
        <button
          onClick={onEdit}
          style={{
            padding: '0.45rem 0.9rem',
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
          <Edit2 size={13} /> Edit Credentials
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Qualification
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
            {qualification}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Specialization
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
            {specialty}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hospital Affiliation
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {hospital}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Department
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {department}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Clinical Experience
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {experienceYears} years active practice
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Medical Registration No.
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', marginTop: '0.2rem' }}>
            {licenseNumber}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Consultation Type
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            {consultationType}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Verification Status
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={16} /> Verified Practitioner
          </div>
        </div>
      </div>
    </div>
  );
};
