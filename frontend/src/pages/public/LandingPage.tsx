import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HeartPulse,
  ShieldCheck,
  Brain,
  Layers,
  MapPin,
  Flame,
  ArrowRight,
  Search,
  UserCheck,
  Stethoscope,
  Activity,
} from 'lucide-react';
import api from '../../services/api';

export const LandingPage: React.FC<{
  onNavigate: (page: string) => void;
  onSelectHealthId?: (id: string) => void;
}> = ({ onNavigate, onSelectHealthId }) => {
  const { login } = useAuth();
  const [searchHealthId, setSearchHealthId] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleSearchEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchHealthId.trim()) return;
    if (onSelectHealthId) onSelectHealthId(searchHealthId.trim());
    onNavigate('emergency-view');
  };

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    setLoadingDemo(true);
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'ADMIN') onNavigate('admin-dashboard');
      else if (res.data.user.role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Demo login failed');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 3rem',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-light)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)',
          }}>
            <HeartPulse size={24} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              <span style={{ color: 'var(--primary-600)' }}>Smart</span>Health
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Clinical &amp; Surveillance
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => onNavigate('login')} className="btn btn-outline">
            Sign In
          </button>
          <button onClick={() => onNavigate('register')} className="btn btn-primary">
            Register Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4.5rem 2rem 3rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}
        >
          <Brain size={16} /> AI-Powered Clinical EHR & Population Surveillance Architecture
        </div>

        <h1
          style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--text-main)',
            maxWidth: '900px',
            margin: '0 auto 1.5rem auto',
            letterSpacing: '-0.03em',
          }}
        >
          Unified Medical History, <span style={{ color: 'var(--primary-500)' }}>Risk Prediction</span> & Spatial Outbreak Surveillance
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '780px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
          A secure healthcare platform connecting patients, authorized doctors, and public health authorities. Features unique Smart Health IDs, immutable visit timelines, DBSCAN disease hotspot detection, and automated community alerts.
        </p>

        {/* Rapid Demo Login Cards */}
        <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', maxWidth: '820px', margin: '0 auto 3rem auto', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            ⚡ 1-Click Instant Demo Authentication
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {/* Patient Demo */}
            <div
              onClick={() => handleQuickDemoLogin('rahul.verma@example.com', 'Patient@123')}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                <UserCheck size={18} /> PATIENT PORTAL
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Rahul Verma</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SHC-2026-000001</div>
              <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.5rem' }}>View Health Card, Timeline & Labs &rarr;</div>
            </div>

            {/* Doctor Demo */}
            <div
              onClick={() => handleQuickDemoLogin('dr.sharma@smarthealth.gov', 'Doctor@123')}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                <Stethoscope size={18} /> DOCTOR PORTAL
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Dr. Rajesh Sharma</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cardiology & Internal Med</div>
              <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.5rem' }}>Scan QR, Consult & Check Allergies &rarr;</div>
            </div>

            {/* Admin Demo */}
            <div
              onClick={() => handleQuickDemoLogin('admin@smarthealth.gov', 'Admin@123')}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9333ea', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                <Activity size={18} /> ADMIN SURVEILLANCE
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Dr. Anita Desai</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chief Surveillance Officer</div>
              <div style={{ fontSize: '0.75rem', color: '#7e22ce', marginTop: '0.5rem' }}>Explore Hotspots, Map & Camps &rarr;</div>
            </div>
          </div>
        </div>

        {/* First Responder Emergency Lookup Search */}
        <div style={{ maxWidth: '640px', margin: '0 auto', background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #fecaca', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: '#dc2626', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            <ShieldCheck size={20} /> First Responder Emergency QR Lookup
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Emergency personnel can look up vital first-responder indicators (blood group, critical allergies, emergency contact) using the Smart Health ID without requiring login.
          </p>
          <form onSubmit={handleSearchEmergency} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="form-input"
              value={searchHealthId}
              onChange={(e) => setSearchHealthId(e.target.value)}
              placeholder="Enter Smart Health ID e.g. SHC-2026-000001"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <button type="submit" className="btn btn-danger" style={{ whiteSpace: 'nowrap' }}>
              <Search size={16} /> Lookup Vitals
            </button>
          </form>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem 5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Engineered for Clinical Safety & Population Health
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>End-to-end integration between clinical care and municipal epidemiological intelligence.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <HeartPulse size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Smart Health ID & QR Card</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Generates unique sequential IDs (SHC-2026-XXXXXX) and encrypted QR codes. Full clinical records are protected behind RBAC while first-responder emergency data is readily accessible.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Flame size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>DBSCAN Hotspot Detection</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Automatically runs density-based spatial clustering over geographical case coordinates to pinpoint localized outbreak clusters, compute risk levels, and dispatch targeted alerts.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Brain size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Decision-Support Engine</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Random Forest patient risk prediction, Isolation Forest physiological anomaly detection, and Autoregressive time-series forecasting for upcoming disease trajectories.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Smart Disease Episodes</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Groups multi-visit disease encounters chronologically (Diagnosis &rarr; Follow-up &rarr; Improving &rarr; Resolved) to eliminate duplication while preserving immutable visit histories.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
