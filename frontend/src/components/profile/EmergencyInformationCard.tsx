import React from 'react';
import { PhoneCall, ShieldAlert, Edit2, Info } from 'lucide-react';

interface EmergencyInformationCardProps {
  patient: any;
  onEdit: () => void;
}

export const EmergencyInformationCard: React.FC<EmergencyInformationCardProps> = ({ patient, onEdit }) => {
  const primaryName = patient?.emergencyContactName || 'Amit Verma';
  const primaryPhone = patient?.emergencyContactPhone || '+91 98765 43210';
  const primaryRelation = 'Father';

  const secondaryName = 'Neha Verma';
  const secondaryPhone = '+91 87654 32109';
  const secondaryRelation = 'Mother';

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
            <PhoneCall size={18} color="#dc2626" /> Emergency Contacts
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Designated contacts for emergency health lookup and critical medical alerts
          </p>
        </div>
        <button
          onClick={onEdit}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: 8,
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#dc2626',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Edit2 size={13} /> Edit Contacts
        </button>
      </div>

      {/* Sync Banner Callout */}
      <div
        style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 12,
          padding: '0.75rem 1rem',
          fontSize: '0.8rem',
          color: '#0369a1',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Info size={16} color="#0284c7" style={{ flexShrink: 0 }} />
        <span>Updating these contacts will automatically update your Smart Health Card and public Emergency Profile.</span>
      </div>

      {/* Contact Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Primary Contact */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #dc2626',
            borderRadius: 12,
            padding: '1rem 1.15rem',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Primary Emergency Contact
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {primaryName}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>
            Relationship: <strong>{primaryRelation}</strong>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <PhoneCall size={14} /> {primaryPhone}
          </div>
        </div>

        {/* Secondary Contact */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #0284c7',
            borderRadius: 12,
            padding: '1rem 1.15rem',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Secondary Emergency Contact (Optional)
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {secondaryName}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>
            Relationship: <strong>{secondaryRelation}</strong>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <PhoneCall size={14} /> {secondaryPhone}
          </div>
        </div>
      </div>
    </div>
  );
};
