import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

export const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (!password || password.length < 1) {
      setError('Please enter your password.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'ADMIN') onNavigate('admin-dashboard');
      else if (res.data.user.role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Authentication failed. Please verify credentials.';
      // Map to user-friendly messages
      if (errorMsg.includes('locked') || errorMsg.includes('429')) {
        setError('Account temporarily locked due to too many failed attempts. Please try again later.');
      } else if (errorMsg.includes('Invalid') || errorMsg.includes('credentials')) {
        setError('Invalid email or password.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'DOCTOR' | 'ADMIN'>('PATIENT');

  const handleRoleSelect = (role: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    setSelectedRole(role);
    if (role === 'PATIENT') {
      setEmail('rahul.verma@example.com');
      setPassword('Patient@123');
    } else if (role === 'DOCTOR') {
      setEmail('dr.sharma@smarthealth.gov');
      setPassword('Doctor@123');
    } else {
      setEmail('admin@smarthealth.gov');
      setPassword('Admin@123');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem 1rem' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '2.25rem 1.75rem', boxShadow: 'var(--shadow-xl)', borderRadius: '24px' }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.85rem auto',
            boxShadow: '0 8px 20px rgba(29, 78, 216, 0.35)',
          }}>
            <HeartPulse size={26} color="#ffffff" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
            Smart<span style={{ color: 'var(--primary-600)' }}>Health</span>
          </h2>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>Welcome Back</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sign in to continue</p>
        </div>

        {/* Role Selector Tabs (Reference Screen 2) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', background: '#f1f5f9', padding: '4px', borderRadius: '14px', marginBottom: '1.5rem' }}>
          {(['PATIENT', 'DOCTOR', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSelect(r)}
              style={{
                padding: '0.5rem 0',
                borderRadius: '10px',
                border: 'none',
                background: selectedRole === r ? '#2563eb' : 'transparent',
                color: selectedRole === r ? '#ffffff' : '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.25rem', padding: '0.65rem 0.85rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
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
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset request link sent to registered email.'); }} style={{ fontSize: '0.78rem', color: 'var(--primary-600)', fontWeight: 600 }}>
              Forgot Password?
            </a>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: '14px', fontSize: '0.92rem', fontWeight: 700 }}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '1.25rem 0 1rem 0', fontSize: '0.82rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <button onClick={() => onNavigate('register')} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>
            Register
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>or login with</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Google Login Option (Target Reference Screen 2) */}
        <button
          type="button"
          onClick={() => handleRoleSelect(selectedRole)}
          className="btn btn-outline"
          style={{ width: '100%', borderRadius: '14px', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
        >
          <span style={{ fontSize: '1.1rem', marginRight: '0.4rem' }}>G</span> Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            onClick={() => onNavigate('landing')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            &larr; Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
