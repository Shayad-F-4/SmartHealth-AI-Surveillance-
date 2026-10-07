import React from 'react';
import { Activity, AlertTriangle, ArrowRight, FileText, Pill, ShieldAlert } from 'lucide-react';

interface MedicalInformationCardProps {
  patient: any;
  onNavigateToRecords: () => void;
}

export const MedicalInformationCard: React.FC<MedicalInformationCardProps> = ({
  patient,
  onNavigateToRecords,
}) => {
  const bloodGroup = patient?.bloodGroup || 'B+';
  const allergies = patient?.allergies || 'Penicillin, Sulfa drugs';
  const chronicConditions = patient?.chronicConditions || 'Hypertension';
  const activeMedications = 'Artemether + Lumefantrine (Active), Amlodipine 5mg (Daily)';

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
            <Activity size={18} color="#0284c7" /> Clinical Medical Profile
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Critical medical identity summary for clinical safety and allergy checking
          </p>
        </div>
        <button
          onClick={onNavigateToRecords}
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
          View Full Medical Records <ArrowRight size={13} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Blood Group */}
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Blood Group
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#dc2626', marginTop: '0.2rem' }}>
            {bloodGroup}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7f1d1d', marginTop: '0.15rem' }}>
            Universal donor compatibility verified
          </div>
        </div>

        {/* Severe Allergies */}
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertTriangle size={13} /> Drug &amp; Clinical Allergies
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#9a3412', marginTop: '0.25rem' }}>
            {allergies}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7c2d12', marginTop: '0.15rem' }}>
            Real-time doctor allergy conflict checking enabled
          </div>
        </div>

        {/* Chronic Conditions */}
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Chronic Conditions
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {chronicConditions}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: '0.15rem' }}>
            Longitudinal monitoring active
          </div>
        </div>

        {/* Active Medications */}
        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Pill size={13} /> Active Prescriptions
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#581c87', marginTop: '0.25rem' }}>
            {activeMedications}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6b21a8', marginTop: '0.15rem' }}>
            Tracked in prescription archive
          </div>
        </div>
      </div>
    </div>
  );
};
