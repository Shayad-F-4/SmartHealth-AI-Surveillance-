import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, ExternalLink, HeartPulse, PhoneCall, ShieldCheck, Edit2 } from 'lucide-react';

interface SmartHealthCardPreviewProps {
  user: any;
  onViewFullCard: () => void;
  onEditEmergency?: () => void;
}

export const SmartHealthCardPreview: React.FC<SmartHealthCardPreviewProps> = ({
  user,
  onViewFullCard,
  onEditEmergency,
}) => {
  const patient = user?.patient;
  const name = user?.name || 'Rahul Verma';
  const healthId = patient?.healthId || 'SHC-2026-000001';
  const bloodGroup = patient?.bloodGroup || 'B+';
  const gender = patient?.gender || 'Male';
  const emergencyPhone = patient?.emergencyContactPhone || user?.phone || '+91 98765 43210';
  const emergencyName = patient?.emergencyContactName || 'Amit Verma';

  const qrValue = typeof window !== 'undefined'
    ? `${window.location.origin}/emergency/${healthId}`
    : `http://localhost:5173/emergency/${healthId}`;

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
            <CreditCard size={18} color="#0284c7" /> Smart Health Card Preview
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Live preview of your portable QR-enabled digital health identity card
          </p>
        </div>
        <button
          onClick={onViewFullCard}
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
          View Full Card <ExternalLink size={13} />
        </button>
      </div>

      {/* Live Physical Style Card Mockup */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
          borderRadius: 16,
          padding: '1.35rem 1.5rem',
          color: 'white',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1.5rem',
          alignItems: 'center',
        }}
      >
        {/* Subtle Watermark Overlay */}
        <div
          style={{
            position: 'absolute',
            right: -20,
            bottom: -20,
            opacity: 0.08,
            pointerEvents: 'none',
          }}
        >
          <HeartPulse size={180} color="#ffffff" />
        </div>

        {/* Card Content Left */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HeartPulse size={16} color="white" />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Smart<span style={{ color: '#38bdf8' }}>Health</span>
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 999, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#e0f2fe' }}>
              PATIENT IDENTITY
            </span>
          </div>

          <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>
            {name}
          </div>
          <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#93c5fd', fontWeight: 700, marginBottom: '0.85rem' }}>
            {healthId}
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '0.85rem' }}>
            <span>Gender: <strong>{gender}</strong></span>
            <span>Blood: <strong style={{ color: '#fca5a5' }}>{bloodGroup}</strong></span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '0.55rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ opacity: 0.8, display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Emergency Contact</span>
              <strong style={{ color: '#38bdf8' }}>{emergencyPhone}</strong> ({emergencyName})
            </div>
            {onEditEmergency && (
              <button
                onClick={onEditEmergency}
                title="Edit emergency contact"
                style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: '2px' }}
              >
                <Edit2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* QR Code Right */}
        <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', textAlign: 'center' }}>
          <QRCodeSVG value={qrValue} size={100} level="M" />
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginTop: '0.35rem' }}>
            Emergency Scan
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <ShieldCheck size={14} color="#16a34a" />
        <span>QR scan provides authorized emergency responders with critical life-saving data only (blood group, allergies, emergency contacts) without exposing private clinical consultation notes.</span>
      </div>
    </div>
  );
};
