import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HeartPulse,
  ShieldCheck,
  Brain,
  Search,
  UserCheck,
  Stethoscope,
  Activity,
  ArrowRight,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import api from '../../services/api';

export const LandingPage: React.FC<{
  onNavigate: (page: string) => void;
  onSelectHealthId?: (id: string) => void;
}> = ({ onNavigate, onSelectHealthId }) => {
  const { user, login } = useAuth();
  const [searchHealthId, setSearchHealthId] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  // If already authenticated, redirect directly to portal based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') onNavigate('admin-dashboard');
      else if (user.role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    }
  }, [user, onNavigate]);

  const handleSearchEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchHealthId.trim()) return;
    if (onSelectHealthId) onSelectHealthId(searchHealthId.trim());
    onNavigate('emergency-view');
  };

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    setLoadingDemo(true);
    setDemoError(null);
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'ADMIN') onNavigate('admin-dashboard');
      else if (res.data.user.role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    } catch (err: any) {
      setDemoError(err.response?.data?.error || 'Unable to authenticate with demo account. Please check backend server status.');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff' }}>
      {/* Top Navigation */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <HeartPulse size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 1.1 }}>
              Smart<span style={{ color: '#38bdf8' }}>Health</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clinical &amp; Surveillance Platform
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate('login')}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('register')}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '1000px', margin: '0 auto', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        {/* Feature Badges */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.4rem 1rem',
            borderRadius: 999,
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38bdf8',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: '1.5rem',
          }}
        >
          EHR &bull; HEALTH INSIGHTS &bull; DISEASE SURVEILLANCE
        </div>

        <h1
          style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: '820px',
            margin: '0 0 1.25rem 0',
          }}
        >
          Securely manage health records, clinical insights, and disease surveillance.
        </h1>

        <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '680px', margin: '0 0 2.25rem 0', lineHeight: 1.6, fontWeight: 500 }}>
          An integrated healthcare platform unifying patient Smart Health IDs, clinical decision support, longitudinal biometric tracking, and municipal outbreak intelligence.
        </p>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <button
            onClick={() => onNavigate('login')}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 18px rgba(2, 132, 199, 0.35)',
            }}
          >
            Sign In to SmartHealth <ArrowRight size={16} />
          </button>

          <button
            onClick={() => onNavigate('register')}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Create Account
          </button>
        </div>

        {/* 1-Click Quick Demo Authentication */}
        <div style={{ width: '100%', maxWidth: '780px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '2rem', backdropFilter: 'blur(10px)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            ⚡ 1-Click Quick Demo Access
          </div>

          {demoError && (
            <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(225, 29, 72, 0.2)', border: '1px solid #f43f5e', borderRadius: 8, color: '#fecdd3', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.85rem' }}>
              {demoError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
            <button
              onClick={() => handleQuickDemoLogin('rahul.verma@example.com', 'Patient@123')}
              disabled={loadingDemo}
              style={{
                padding: '0.85rem',
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserCheck size={14} /> Patient Demo
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>Rahul Verma</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>SHC-2026-000001</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('dr.sharma@smarthealth.gov', 'Doctor@123')}
              disabled={loadingDemo}
              style={{
                padding: '0.85rem',
                borderRadius: 12,
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Stethoscope size={14} /> Doctor Demo
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>Dr. Rajesh Sharma</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>Cardiology &amp; Medicine</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('admin@smarthealth.gov', 'Admin@123')}
              disabled={loadingDemo}
              style={{
                padding: '0.85rem',
                borderRadius: 12,
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Activity size={14} /> Admin Demo
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>Dr. Anita Desai</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>Chief Surveillance Officer</div>
            </button>
          </div>
        </div>

        {/* Optional Small Emergency Lookup Entry */}
        <div style={{ width: '100%', maxWidth: '520px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: 14, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <ShieldAlert size={16} color="#fb7185" /> Emergency Lookup Entry
          </div>
          <form onSubmit={handleSearchEmergency} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="text"
              value={searchHealthId}
              onChange={(e) => setSearchHealthId(e.target.value)}
              placeholder="Enter Smart Health ID e.g. SHC-2026-000001"
              style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(15, 23, 42, 0.8)', color: 'white', fontSize: '0.82rem', fontFamily: 'monospace', outline: 'none' }}
            />
            <button
              type="submit"
              style={{ padding: '0.5rem 0.9rem', background: '#e11d48', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Search size={14} /> Lookup
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.25rem 2rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 500 }}>
        &copy; 2026 SmartHealth Platform &bull; Clinical EHR &amp; Disease Surveillance &bull; All Rights Reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
