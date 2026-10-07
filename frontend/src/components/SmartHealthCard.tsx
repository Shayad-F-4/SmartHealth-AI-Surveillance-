import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ShieldCheck, HeartPulse, Shield, MapPin, Phone, AlertTriangle } from 'lucide-react';

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

  const emergencyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/emergency/${cardData.healthId}`
    : `http://localhost:5173/emergency/${cardData.healthId}`;

  const qrContent = cardData.qrValue || emergencyUrl;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Print Specific CSS Override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .health-card-printable-area, .health-card-printable-area * {
            visibility: visible;
          }
          .health-card-printable-area {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100% !important;
            max-width: 580px !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Digital Smart Health Card
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.35rem 0 0 0' }}>
            Official Health ID card. Authorized first responders can scan the QR code for rapid emergency vitals.
          </p>
        </div>
        <button
          onClick={handlePrint}
          style={{
            padding: '0.6rem 1.15rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Printer size={16} /> Print Card
        </button>
      </div>

      {/* Main Centered Presentation Stage */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {/* Printable/Digital Health Card Container */}
        <div
          ref={cardRef}
          className="health-card-printable-area"
          style={{
            width: '100%',
            maxWidth: '620px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
            borderRadius: '20px',
            padding: '1.75rem 2rem',
            color: '#ffffff',
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Grid & Watermark Pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.08,
              backgroundImage:
                'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: -30,
              bottom: -30,
              opacity: 0.06,
              pointerEvents: 'none',
            }}
          >
            <HeartPulse size={240} color="#ffffff" />
          </div>

          {/* Card Header: Brand Logo & Verification Badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <HeartPulse size={24} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Smart Health Card
                </div>
                <div style={{ fontSize: '0.68rem', color: '#93c5fd', opacity: 0.9 }}>
                  Public Health Identification Authority
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid rgba(52, 211, 153, 0.5)',
                padding: '0.25rem 0.7rem',
                borderRadius: '9999px',
                color: '#34d399',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                letterSpacing: '0.04em',
              }}
            >
              <ShieldCheck size={13} /> ACTIVE VALID
            </span>
          </div>

          {/* Card Middle: Responsive Info Grid + QR Code */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1.5rem',
              alignItems: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Patient Information */}
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#93c5fd', letterSpacing: '0.05em', fontWeight: 700 }}>
                Patient Name
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.15rem 0 0.9rem 0', lineHeight: 1.2 }}>
                {cardData.patientName}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#93c5fd', fontWeight: 700 }}>
                    Health ID
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
                    {cardData.healthId}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#93c5fd', fontWeight: 700 }}>
                    Blood Group
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ef4444' }}>
                    {cardData.bloodGroup}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={13} color="#93c5fd" />
                <span>District: <strong>{cardData.district || 'Central District'}</strong></span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={13} color="#93c5fd" />
                <span>Emergency: <strong>{cardData.emergencyContactName || 'Emergency Contact'}</strong> ({cardData.emergencyContactPhone || 'Not set'})</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                background: '#ffffff',
                padding: '0.85rem',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                border: '2px solid #ffffff',
                flexShrink: 0,
              }}
            >
              <QRCodeSVG
                value={qrContent}
                size={115}
                level="M"
                includeMargin={false}
              />
              <span style={{ fontSize: '0.64rem', color: '#334155', fontWeight: 800, marginTop: '0.45rem', letterSpacing: '0.04em' }}>
                SCAN TO VERIFY
              </span>
            </div>
          </div>

          {/* Card Footer: Safety Indicators & Encryption Reference */}
          <div
            style={{
              marginTop: '1.35rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              position: 'relative',
              zIndex: 2,
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <span style={{ color: '#93c5fd', fontWeight: 600 }}>Critical Allergies: </span>
              <span style={{ fontWeight: 700, color: '#fca5a5' }}>
                {cardData.allergies || 'None reported'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', fontSize: '0.72rem' }}>
              <Shield size={13} color="#93c5fd" /> Encrypted Reference ID
            </div>
          </div>
        </div>

        {/* Security & Privacy Notice Banner */}
        <div
          style={{
            marginTop: '1.75rem',
            width: '100%',
            maxWidth: '620px',
            padding: '1.1rem 1.25rem',
            background: '#ffffff',
            border: '1px solid #bae6fd',
            borderRadius: '16px',
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          }}
        >
          <ShieldCheck size={22} color="#0284c7" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '0.82rem', color: '#0369a1', lineHeight: 1.5 }}>
            <strong style={{ color: '#0c4a6e', display: 'block', marginBottom: '0.2rem' }}>Privacy Guard Active</strong>
            The QR code exposes only minimum required emergency data for authorized responders. Private clinical consultation notes remain protected by role-based access control.
          </div>
        </div>
      </div>
    </div>
  );
};
