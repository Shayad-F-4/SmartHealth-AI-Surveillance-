import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  User,
  ShieldCheck,
  Printer,
  QrCode,
  MapPin,
  HeartPulse,
  Phone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SmartHealthCard } from '../../components/SmartHealthCard';
import api from '../../services/api';

export const AdminHealthCardsPage: React.FC = () => {
  const [query, setQuery] = useState('SHC-2026-000001');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [cardData, setCardData] = useState<any>(null);

  // Search patients
  const handleSearch = async (searchQuery = query) => {
    setLoading(true);
    try {
      const res = await api.get('/doctors/patients', { params: { q: searchQuery } });
      setPatients(res.data);
      if (res.data.length > 0) {
        loadPatientCard(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to search patients for health card:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientCard = (patient: any) => {
    setSelectedPatient(patient);
    setCardData({
      patientName: patient.user?.name || patient.name || 'Citizen Patient',
      healthId: patient.healthId || 'SHC-2026-000001',
      gender: patient.gender || 'Not specified',
      bloodGroup: patient.bloodGroup || 'O+',
      dob: patient.dob ? new Date(patient.dob).toLocaleDateString() : undefined,
      district: patient.district || 'Riverside District',
      emergencyContactName: patient.emergencyContactName || 'Primary Contact',
      emergencyContactPhone: patient.emergencyContactPhone || patient.user?.phone || '9999999999',
      allergies: patient.allergies || 'None reported',
      chronicConditions: patient.chronicConditions || 'None reported',
      qrValue: `${window.location.origin}/emergency/${patient.healthId}`,
    });
  };

  useEffect(() => {
    handleSearch('SHC-2026-000001');
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
              <CreditCard size={22} />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              National Health Cards Registry &amp; Printing
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem', marginBottom: 0 }}>
            Public Health Identity Registry: Lookup citizen records, preview verified QR credentials, and print full-color ID cards.
          </p>
        </div>
      </div>

      {/* ── Search & Fast Demo Chips ─────────────────────────────────────── */}
      <div className="card no-print" style={{ padding: '1.25rem', marginBottom: '1.75rem', border: '1px solid #e2e8f0', borderRadius: 16 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search citizen by Smart Health ID (e.g. SHC-2026-000001), name, or phone..."
              style={{ paddingLeft: '2.4rem', height: '44px', fontSize: '0.92rem', borderRadius: 10 }}
            />
            <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0 1.5rem', height: '44px', borderRadius: 10, fontWeight: 700 }}
          >
            {loading ? 'Searching...' : 'Lookup Card'}
          </button>
        </form>

        {/* Fast Citizen Quick Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={13} color="#0284c7" /> Fast Select:
          </span>
          <button
            type="button"
            onClick={() => {
              setQuery('SHC-2026-000001');
              handleSearch('SHC-2026-000001');
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: 999 }}
          >
            Rahul Verma (SHC-2026-000001)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('Shayad Fakir');
              handleSearch('Shayad Fakir');
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: 999 }}
          >
            Shayad Fakir (Patient)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('SHC-2026-000002');
              handleSearch('SHC-2026-000002');
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: 999 }}
          >
            Patient 2 (SHC-2026-000002)
          </button>
        </div>
      </div>

      {/* ── Search Results List if Multiple ──────────────────────────────── */}
      {patients.length > 1 && (
        <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {patients.map((p) => {
            const isSelected = selectedPatient?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => loadPatientCard(p)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: 12,
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  minWidth: '220px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{p.user?.name}</div>
                <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#0284c7' }}>{p.healthId}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Blood: <strong>{p.bloodGroup}</strong> &bull; {p.district}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Smart Health Card Render Stage ───────────────────────────────── */}
      {cardData ? (
        <SmartHealthCard cardData={cardData} />
      ) : (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
          <User size={44} style={{ opacity: 0.35, margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 0.35rem 0' }}>
            No Citizen Card Selected
          </h3>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            Enter a citizen Smart Health ID or name above to generate and print their official color ID card.
          </p>
        </div>
      )}
    </div>
  );
};
