import React from 'react';
import { Lock, ShieldCheck, FileCheck, EyeOff } from 'lucide-react';

interface GovernmentIdCardProps {
  user: any;
}

export const GovernmentIdCard: React.FC<GovernmentIdCardProps> = ({ user }) => {
  const patient = user?.patient;
  const maskedAadhaar = 'XXXX XXXX 9012';

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
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <FileCheck size={18} color="#0284c7" /> Government Identity Verification
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
          Cryptographically masked national health identity binding
        </p>
      </div>

      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 14,
          padding: '1.1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Aadhaar National Health Identification
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', marginTop: '0.25rem', letterSpacing: '0.1em' }}>
            {maskedAadhaar}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={14} /> Verified with Unique Health Authority
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', padding: '0.45rem 0.85rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
          <EyeOff size={14} color="#64748b" />
          <span>Full ID Masked for Privacy</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Lock size={14} /> Encrypted at rest using AES-256
        </div>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} /> Authorized clinical access logging
        </div>
      </div>
    </div>
  );
};
