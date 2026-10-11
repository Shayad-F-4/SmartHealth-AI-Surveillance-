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

  const handleSocialLogin = async (provider: 'google' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);
    try {
      let email = `${provider}.patient@smarthealth.net`;
      let name = `${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified User`;
      if (selectedRole === 'DOCTOR') {
        email = `dr.${provider}@smarthealth.gov`;
        name = `Dr. ${provider.charAt(0).toUpperCase() + provider.slice(1)} Specialist`;
      } else if (selectedRole === 'ADMIN') {
        email = `admin.${provider}@smarthealth.gov`;
        name = `Admin (${provider.toUpperCase()})`;
      }

      const res = await api.post('/auth/social-login', {
        provider,
        email,
        name,
        role: selectedRole,
      });

      login(res.data.token, res.data.user);
      if (res.data.user.role === 'ADMIN') onNavigate('admin-dashboard');
      else if (res.data.user.role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to sign in with ${provider}.`);
    } finally {
      setLoading(false);
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

        {/* Role Selector Tabs */}
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
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Social Login Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="btn btn-outline"
            style={{ width: '100%', borderRadius: '12px', justifyContent: 'center', padding: '0.65rem', fontSize: '0.84rem', fontWeight: 700 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              className="btn btn-outline"
              style={{ width: '100%', borderRadius: '12px', justifyContent: 'center', padding: '0.65rem', fontSize: '0.82rem', fontWeight: 700 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.4rem' }}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('twitter')}
              disabled={loading}
              className="btn btn-outline"
              style={{ width: '100%', borderRadius: '12px', justifyContent: 'center', padding: '0.65rem', fontSize: '0.82rem', fontWeight: 700 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.4rem' }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter (X)
            </button>
          </div>
        </div>

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
