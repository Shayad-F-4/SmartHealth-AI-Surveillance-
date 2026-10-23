import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  ShieldCheck,
  HeartPulse,
  Shield,
  MapPin,
  Phone,
  AlertTriangle,
  Sparkles,
  Layers,
  Palette,
  Check,
  CreditCard,
  QrCode,
  Info,
} from 'lucide-react';

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
    qrValue?: string;
  };
}

interface CardTheme {
  id: string;
  name: string;
  gradient: string;
  accent: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  textColor: string;
  subTextColor: string;
  border: string;
  previewColor: string;
}

const THEMES: CardTheme[] = [
  {
    id: 'ocean',
    name: 'Sapphire Ocean',
    gradient: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 50%, #0284c7 100%)',
    accent: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.22)',
    badgeBorder: 'rgba(56, 189, 248, 0.55)',
    badgeColor: '#38bdf8',
    textColor: '#ffffff',
    subTextColor: '#93c5fd',
    border: 'rgba(255, 255, 255, 0.22)',
    previewColor: '#0284c7',
  },
  {
    id: 'emerald',
    name: 'Emerald Health',
    gradient: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #10b981 100%)',
    accent: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.22)',
    badgeBorder: 'rgba(52, 211, 153, 0.55)',
    badgeColor: '#34d399',
    textColor: '#ffffff',
    subTextColor: '#a7f3d0',
    border: 'rgba(255, 255, 255, 0.22)',
    previewColor: '#059669',
  },
  {
    id: 'amethyst',
    name: 'Royal Orchid',
    gradient: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #9333ea 100%)',
    accent: '#e879f9',
    badgeBg: 'rgba(232, 121, 249, 0.22)',
    badgeBorder: 'rgba(232, 121, 249, 0.55)',
    badgeColor: '#e879f9',
    textColor: '#ffffff',
    subTextColor: '#f0abfc',
    border: 'rgba(255, 255, 255, 0.22)',
    previewColor: '#9333ea',
  },
  {
    id: 'ruby',
    name: 'Crimson Vitality',
    gradient: 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #e11d48 100%)',
    accent: '#fb7185',
    badgeBg: 'rgba(251, 113, 133, 0.22)',
    badgeBorder: 'rgba(251, 113, 133, 0.55)',
    badgeColor: '#fb7185',
    textColor: '#ffffff',
    subTextColor: '#fecdd3',
    border: 'rgba(255, 255, 255, 0.22)',
    previewColor: '#e11d48',
  },
  {
    id: 'obsidian',
    name: 'Cyber Gold',
    gradient: 'linear-gradient(135deg, #09090b 0%, #1c1917 50%, #b45309 100%)',
    accent: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.22)',
    badgeBorder: 'rgba(251, 191, 36, 0.55)',
    badgeColor: '#fbbf24',
    textColor: '#ffffff',
    subTextColor: '#fde68a',
    border: 'rgba(251, 191, 36, 0.35)',
    previewColor: '#b45309',
  },
];

export const SmartHealthCard: React.FC<SmartHealthCardProps> = ({ cardData }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(THEMES[0]);
  const [cardSide, setCardSide] = useState<'front' | 'back' | 'both'>('both');

  const emergencyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/emergency/${cardData.healthId}`
    : `http://localhost:5173/emergency/${cardData.healthId}`;

  const qrContent = cardData.qrValue || emergencyUrl;

  // Ultra-reliable High-DPI Color Printing Handler via dedicated hidden print frame
  const handlePrint = () => {
    const printArea = cardRef.current;
    if (!printArea) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SmartHealth Card - ${cardData.patientName} (${cardData.healthId})</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700;800&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            body {
              background: #ffffff;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justifyContent: center;
              padding: 20px;
              color: #0f172a;
            }

            .print-header {
              text-align: center;
              margin-bottom: 16px;
            }

            .print-header h1 {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .print-header p {
              font-size: 11px;
              color: #64748b;
              margin-top: 3px;
            }

            .cards-wrapper {
              display: flex;
              flex-direction: column;
              gap: 20px;
              width: 100%;
              max-width: 620px;
            }

            .cut-guide {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              margin-top: 15px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
            }

            @page {
              size: A4 portrait;
              margin: 15mm 10mm;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>National Smart Health Identity Card</h1>
            <p>Official Digital Health Credential &bull; Cut along perimeter &bull; Fold to fit standard wallet pocket (85.6mm &times; 53.98mm)</p>
          </div>

          <div class="cards-wrapper">
            ${printArea.innerHTML}
          </div>

          <div class="cut-guide">
            ✂ CUT ALONG THE BORDER &bull; SCAN QR CODE WITH ANY SMARTPHONE CAMERA FOR INSTANT EMERGENCY ACCESS
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ── Top Control Bar (Hidden on print) ─────────────────────────── */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={26} color={selectedTheme.previewColor} /> Digital Smart Health Card
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Portable QR-enabled health identity pass with critical triage metrics and emergency vitals.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Side Switcher: Front | Back | Both */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setCardSide('front')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: cardSide === 'front' ? '#ffffff' : 'transparent',
                color: cardSide === 'front' ? '#0f172a' : '#64748b',
                boxShadow: cardSide === 'front' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Front
            </button>
            <button
              onClick={() => setCardSide('back')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: cardSide === 'back' ? '#ffffff' : 'transparent',
                color: cardSide === 'back' ? '#0f172a' : '#64748b',
                boxShadow: cardSide === 'back' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Back
            </button>
            <button
              onClick={() => setCardSide('both')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: cardSide === 'both' ? '#ffffff' : 'transparent',
                color: cardSide === 'both' ? '#0f172a' : '#64748b',
                boxShadow: cardSide === 'both' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Both Sides (Wallet)
            </button>
          </div>

          {/* Primary Print Button */}
          <button
            onClick={handlePrint}
            style={{
              padding: '0.6rem 1.35rem',
              background: `linear-gradient(135deg, ${selectedTheme.previewColor} 0%, #0f172a 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <Printer size={17} /> Print Card (Full Color)
          </button>
        </div>
      </div>

      {/* ── Colorful Theme Palette Selector (Requested by User) ───────── */}
      <div
        className="no-print"
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '0.85rem 1.25rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
          <Palette size={16} color={selectedTheme.previewColor} /> Select Color Theme:
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {THEMES.map((theme) => {
            const isSelected = selectedTheme.id === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 999,
                  border: isSelected ? `2px solid ${theme.previewColor}` : '1px solid #cbd5e1',
                  background: isSelected ? '#f8fafc' : '#ffffff',
                  color: isSelected ? '#0f172a' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: theme.gradient,
                    display: 'inline-block',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
                {theme.name}
                {isSelected && <Check size={12} color={theme.previewColor} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Printable Card Area ────────────────────────────────────────── */}
      <div
        ref={cardRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.75rem',
          width: '100%',
        }}
      >
        {/* =================================================================
            FRONT SIDE OF THE SMART HEALTH CARD
            ================================================================= */}
        {(cardSide === 'front' || cardSide === 'both') && (
          <div
            className="health-card-front"
            style={{
              width: '100%',
              maxWidth: '620px',
              minHeight: '350px',
              background: selectedTheme.gradient,
              borderRadius: '22px',
              padding: '1.75rem 2rem',
              color: selectedTheme.textColor,
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.25)',
              border: `1.5px solid ${selectedTheme.border}`,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Background Grid Pattern */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.08,
                backgroundImage:
                  'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
                backgroundSize: '18px 18px',
                backgroundPosition: '0 0, 9px 9px',
                pointerEvents: 'none',
              }}
            />
            {/* Watermark Heart Pulse */}
            <div
              style={{
                position: 'absolute',
                right: -30,
                bottom: -30,
                opacity: 0.06,
                pointerEvents: 'none',
              }}
            >
              <HeartPulse size={260} color="#ffffff" />
            </div>

            {/* Front Header: Brand Emblem & Holographic Smart Chip */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.18)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <HeartPulse size={24} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Smart Health Card
                  </div>
                  <div style={{ fontSize: '0.68rem', color: selectedTheme.subTextColor, opacity: 0.95, letterSpacing: '0.03em' }}>
                    NATIONAL DIGITAL HEALTH SURVEILLANCE AUTHORITY
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: selectedTheme.badgeBg,
                  border: `1px solid ${selectedTheme.badgeBorder}`,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 999,
                  color: selectedTheme.badgeColor,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  letterSpacing: '0.04em',
                }}
              >
                <ShieldCheck size={13} /> VERIFIED ACTIVE
              </span>
            </div>

            {/* Front Body: Smart Chip + Patient Details + QR Code */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1.5rem',
                alignItems: 'center',
                margin: '1.25rem 0',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Left Column: Smart Chip & Patient Identity */}
              <div>
                {/* Holographic EMV Smart Chip Graphic */}
                <div
                  style={{
                    width: '44px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    marginBottom: '0.75rem',
                    position: 'relative',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: '4px',
                      border: '1px solid rgba(161, 98, 7, 0.5)',
                      borderRadius: '3px',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      background: 'rgba(161, 98, 7, 0.4)',
                    }}
                  />
                </div>

                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: selectedTheme.subTextColor, letterSpacing: '0.06em', fontWeight: 800 }}>
                  Patient Full Name
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0.1rem 0 0.75rem 0', lineHeight: 1.15, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {cardData.patientName}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.65rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: selectedTheme.subTextColor, fontWeight: 700 }}>
                      Health ID (ABHA)
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', letterSpacing: '0.04em' }}>
                      {cardData.healthId}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: selectedTheme.subTextColor, fontWeight: 700 }}>
                      Blood Group
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      {cardData.bloodGroup}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={13} color={selectedTheme.accent} />
                  <span>District: <strong>{cardData.district || 'Central District'}</strong></span>
                </div>
              </div>

              {/* Right Column: High-DPI QR Code */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '0.85rem',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  border: '2px solid #ffffff',
                  flexShrink: 0,
                }}
              >
                <QRCodeSVG
                  value={qrContent}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
                <span style={{ fontSize: '0.62rem', color: '#0f172a', fontWeight: 900, marginTop: '0.45rem', letterSpacing: '0.06em' }}>
                  SCAN FOR EMERGENCY
                </span>
              </div>
            </div>

            {/* Front Footer: Emergency Contact & Micro-strip */}
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.18)',
                paddingTop: '0.65rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.74rem',
                position: 'relative',
                zIndex: 2,
                flexWrap: 'wrap',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={13} color={selectedTheme.accent} />
                <span>ICE: <strong>{cardData.emergencyContactName}</strong> ({cardData.emergencyContactPhone})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: selectedTheme.subTextColor, fontSize: '0.7rem' }}>
                <Shield size={12} color={selectedTheme.accent} /> Cryptographically Signed Card &bull; ISO/IEC 18013
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            BACK SIDE OF THE SMART HEALTH CARD (Clinical & First-Responder Info)
            ================================================================= */}
        {(cardSide === 'back' || cardSide === 'both') && (
          <div
            className="health-card-back"
            style={{
              width: '100%',
              maxWidth: '620px',
              minHeight: '350px',
              background: selectedTheme.gradient,
              borderRadius: '22px',
              padding: '1.75rem 2rem',
              color: selectedTheme.textColor,
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.25)',
              border: `1.5px solid ${selectedTheme.border}`,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Magnetic Stripe Graphic for authenticity */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: 0,
                right: 0,
                height: '38px',
                background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />

            {/* Back Header */}
            <div style={{ marginTop: '38px', paddingTop: '0.75rem', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: selectedTheme.accent }}>
                  First-Responder Emergency Care Protocol
                </div>
                <span style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.5rem', borderRadius: 4, fontFamily: 'monospace' }}>
                  ID: #{cardData.healthId.slice(-6)}
                </span>
              </div>

              {/* Critical Triage Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                {/* Allergies Highlight Box */}
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(248, 113, 113, 0.45)',
                    borderRadius: 12,
                    padding: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                    <AlertTriangle size={12} color="#f87171" /> Known Drug Allergies
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                    {cardData.allergies || 'None Reported'}
                  </div>
                </div>

                {/* Chronic Conditions Box */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: 12,
                    padding: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: selectedTheme.subTextColor, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                    <Info size={12} color={selectedTheme.accent} /> Chronic Medical Conditions
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                    {cardData.chronicConditions || 'None Reported'}
                  </div>
                </div>
              </div>

              {/* Instructions for First Responders */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.72rem',
                  lineHeight: 1.45,
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                In case of accident or emergency, authorized paramedical personnel should scan the front QR code for real-time epidemiological context, recent prescriptions, and blood reports.
              </div>
            </div>

            {/* Back Footer: Emergency Helplines & Barcode Simulation */}
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.18)',
                paddingTop: '0.65rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.72rem',
                position: 'relative',
                zIndex: 2,
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ color: selectedTheme.subTextColor, fontWeight: 600 }}>Emergency Hotline: </span>
                <strong style={{ color: '#ffffff' }}>108 / 112</strong> &bull;{' '}
                <span style={{ color: selectedTheme.subTextColor }}>SmartHealth Desk: </span>
                <strong style={{ color: '#ffffff' }}>1800-SMART-HEALTH</strong>
              </div>

              {/* Barcode Graphic */}
              <div
                style={{
                  height: '24px',
                  width: '120px',
                  background: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 4px, #ffffff 4px, #ffffff 5px, transparent 5px, transparent 7px, #ffffff 7px, #ffffff 10px, transparent 10px, transparent 12px)',
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Privacy & Usage Notice ───────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          marginTop: '1.75rem',
          maxWidth: '620px',
          margin: '1.75rem auto 0 auto',
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
        <ShieldCheck size={22} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', color: '#0369a1', lineHeight: 1.5 }}>
          <strong style={{ color: '#0c4a6e', display: 'block', marginBottom: '0.2rem' }}>
            High-Resolution Full-Color Print Enabled
          </strong>
          Click <strong>"Print Card (Full Color)"</strong> above to print or save a PDF. Both front identity card and back clinical triage card will print in vivid color with exact wallet dimensions.
        </div>
      </div>
    </div>
  );
};
