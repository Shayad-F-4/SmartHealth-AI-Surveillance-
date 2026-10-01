import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'ADMIN') onNavigate('admin-dashboard');
      else if (res.data.user.role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 8px 20px rgba(29, 78, 216, 0.35)',
          }}>
            <HeartPulse size={28} color="#ffffff" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Smart<span style={{ color: 'var(--primary-600)' }}>Health</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Access clinical records, risk analytics, and disease surveillance
          </p>
        </div>

        {error && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Quick Demo Switchers */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' }}>
            Quick Demo Accounts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setDemoCredentials('rahul.verma@example.com', 'Patient@123')}
              className="btn btn-outline"
              style={{ justifyContent: 'space-between', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
            >
              <span>👤 <strong>Patient:</strong> Rahul Verma</span>
              <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Fill</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('dr.sharma@smarthealth.gov', 'Doctor@123')}
              className="btn btn-outline"
              style={{ justifyContent: 'space-between', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
            >
              <span>🩺 <strong>Doctor:</strong> Dr. Rajesh Sharma</span>
              <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Fill</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('admin@smarthealth.gov', 'Admin@123')}
              className="btn btn-outline"
              style={{ justifyContent: 'space-between', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
            >
              <span>🛡️ <strong>Admin:</strong> Dr. Anita Desai</span>
              <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Fill</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account?</span>
          <button onClick={() => onNavigate('register')} style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontWeight: 700, cursor: 'pointer' }}>
            Register here
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => onNavigate('landing')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            &larr; Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};
