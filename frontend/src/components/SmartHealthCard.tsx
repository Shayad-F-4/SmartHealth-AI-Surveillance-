import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Shield, HeartPulse, AlertCircle } from 'lucide-react';

interface SmartHealthCardProps {
  cardData: {
    patientName: string;
    healthId: string;
    gender: string;
    bloodGroup: string;
    dob?: string;
    district: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    allergies: string;
    chronicConditions: string;
    qrValue: string;
  };
}

export const SmartHealthCard: React.FC<SmartHealthCardProps> = ({ cardData }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const emergencyUrl = `${window.location.origin}/emergency/${cardData.healthId}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Digital Smart Health Card
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Official Health ID card. Authorized first responders can scan the QR code for rapid emergency vitals.
          </p>
        </div>
        <button onClick={handlePrint} className="btn btn-primary no-print">
          <Printer size={16} /> Print Card
        </button>
      </div>

      {/* Printable/Digital Card Body */}
      <div ref={cardRef} className="health-card-container">
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HeartPulse size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Smart Health Card
              </div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>
                Public Health Identification Authority
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              color: '#6ee7b7',
            }}
          >
            ACTIVE VALID
          </span>
        </div>

        {/* Card Middle: Info + QR Code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.75, letterSpacing: '0.05em' }}>
              Patient Name
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.85rem', lineHeight: 1.2 }}>
              {cardData.patientName}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.75 }}>Health ID</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {cardData.healthId}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.75 }}>Blood Group</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f87171' }}>
                  {cardData.bloodGroup}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', opacity: 0.85, marginBottom: '0.4rem' }}>
              <strong>District:</strong> {cardData.district}
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
              <strong>Emergency:</strong> {cardData.emergencyContactName} ({cardData.emergencyContactPhone})
            </div>
          </div>

          {/* QR Code Container */}
          <div
            style={{
              background: 'white',
              padding: '0.75rem',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            }}
          >
            <QRCodeSVG
              value={cardData.qrValue || emergencyUrl}
              size={110}
              level="M"
              includeMargin={false}
            />
            <span style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700, marginTop: '0.35rem' }}>
              SCAN TO VERIFY
            </span>
          </div>
        </div>

        {/* Card Footer: Critical Safety Indicators */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
          }}
        >
          <div>
            <span style={{ opacity: 0.75 }}>Critical Allergies: </span>
            <span style={{ fontWeight: 700, color: '#fca5a5' }}>
              {cardData.allergies || 'None reported'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: 0.8 }}>
            <Shield size={13} /> Encrypted Reference ID
          </div>
        </div>
      </div>

      {/* Security note */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}
      >
        <AlertCircle size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem', color: '#0369a1', lineHeight: 1.5 }}>
          <strong>Privacy Guard Active:</strong> In compliance with healthcare standards, the QR code contains only an encrypted identifier reference linking to verified emergency contact details. Full clinical consultation notes, prescriptions, and diagnosis history remain strictly locked behind role-based clinician authentication.
        </div>
      </div>
    </div>
  );
};
