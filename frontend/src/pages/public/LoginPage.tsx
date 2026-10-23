import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HeartPulse,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Stethoscope,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

export const LoginPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/login', {
        email: cleanEmail,
        password,
      });

      login(res.data.token, res.data.user);

      // Seamless role-based landing
      if (res.data.user.role === 'ADMIN') {
        onNavigate('admin-dashboard');
      } else if (res.data.user.role === 'DOCTOR') {
        onNavigate('doctor-dashboard');
      } else {
        onNavigate('dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Authentication failed. Please verify credentials.';
      if (errorMsg.includes('locked') || errorMsg.includes('429')) {
        setError('Account temporarily locked due to too many failed attempts. Please try again in a few minutes or reset your password.');
      } else if (errorMsg.includes('Invalid') || errorMsg.includes('credentials')) {
        setError('Incorrect email or password. Please double-check or use "Forgot Password?" below.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
    setSuccessMsg(`Loaded credentials for ${fillEmail}`);
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);
    try {
      const socialEmail = `${provider}.patient@smarthealth.net`;
      const socialName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified User`;

      const res = await api.post('/auth/social-login', {
        provider,
        email: socialEmail,
        name: socialName,
        role: 'PATIENT',
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

  // ── Forgot Password Request (Step 1) ──────────────────────────────────
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotError('Please enter a valid registered email.');
      setForgotLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/password-reset/request', { email: cleanEmail });
      if (res.data.otpCode) {
        setReceivedOtp(res.data.otpCode);
        setForgotOtpCode(res.data.otpCode); // Pre-fill for ultra-smooth user experience
      }
      setForgotStep(2);
      setForgotSuccess('Verification code generated! Enter your new password below.');
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to request password reset. Please check the email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Forgot Password Confirm (Step 2) ──────────────────────────────────
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotOtpCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await api.post('/auth/password-reset/reset', {
        email: forgotEmail.trim().toLowerCase(),
        otpCode: forgotOtpCode.trim(),
        newPassword,
      });

      setForgotSuccess(res.data.message || 'Password reset successful! You can now log in.');

      // Auto-fill into main login form
      setEmail(forgotEmail.trim());
      setPassword(newPassword);

      setTimeout(() => {
        setShowForgotModal(false);
        setSuccessMsg('✓ Password successfully updated! Click Login to enter.');
        setForgotStep(1);
        setForgotOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setReceivedOtp(null);
      }, 1500);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to reset password. Please check your verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem 1rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.25rem 1.75rem', boxShadow: 'var(--shadow-xl)', borderRadius: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        {/* Top Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem auto',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
            }}
          >
            <HeartPulse size={28} color="#ffffff" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: '0 0 0.2rem 0' }}>
            Smart<span style={{ color: '#0284c7' }}>Health</span>
          </h2>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0.2rem 0 0 0' }}>
            Clinical &amp; Surveillance Portal
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Sign in with your registered email or demo account
          </p>
        </div>

        {/* ── 1-Click Quick Fill Selector for Fast Testing & Presentation ── */}
        <div style={{ marginBottom: '1.25rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={13} color="#0284c7" /> Fast Demo Accounts:
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('shayadfakir2006@gmail.com', 'Doctor@123')}
              className="btn btn-outline"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                background: email === 'shayadfakir2006@gmail.com' ? '#eff6ff' : '#ffffff',
                borderColor: email === 'shayadfakir2006@gmail.com' ? '#3b82f6' : '#cbd5e1',
                justifyContent: 'flex-start',
                gap: '0.35rem',
              }}
            >
              <Stethoscope size={13} color="#2563eb" />
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <strong style={{ display: 'block', fontSize: '0.73rem' }}>Dr. Shayad</strong>
                <span style={{ fontSize: '0.67rem', color: '#64748b' }}>Doctor Portal</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('shayadfakir8@gmail.com', 'Patient@123')}
              className="btn btn-outline"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                background: email === 'shayadfakir8@gmail.com' ? '#eff6ff' : '#ffffff',
                borderColor: email === 'shayadfakir8@gmail.com' ? '#3b82f6' : '#cbd5e1',
                justifyContent: 'flex-start',
                gap: '0.35rem',
              }}
            >
              <User size={13} color="#0284c7" />
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <strong style={{ display: 'block', fontSize: '0.73rem' }}>Patient Shayad</strong>
                <span style={{ fontSize: '0.67rem', color: '#64748b' }}>Patient Portal</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('admin@smarthealth.gov', 'Admin@123')}
              className="btn btn-outline"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                background: email === 'admin@smarthealth.gov' ? '#eff6ff' : '#ffffff',
                borderColor: email === 'admin@smarthealth.gov' ? '#3b82f6' : '#cbd5e1',
                justifyContent: 'flex-start',
                gap: '0.35rem',
              }}
            >
              <Shield size={13} color="#7c3aed" />
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <strong style={{ display: 'block', fontSize: '0.73rem' }}>Admin Desai</strong>
                <span style={{ fontSize: '0.67rem', color: '#64748b' }}>Surveillance Admin</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('rahul.verma@example.com', 'Patient@123')}
              className="btn btn-outline"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                background: email === 'rahul.verma@example.com' ? '#eff6ff' : '#ffffff',
                borderColor: email === 'rahul.verma@example.com' ? '#3b82f6' : '#cbd5e1',
                justifyContent: 'flex-start',
                gap: '0.35rem',
              }}
            >
              <User size={13} color="#059669" />
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <strong style={{ display: 'block', fontSize: '0.73rem' }}>Rahul Verma</strong>
                <span style={{ fontSize: '0.67rem', color: '#64748b' }}>Full Health Record</span>
              </div>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="alert-banner alert-banner-success" style={{ marginBottom: '1.25rem', padding: '0.65rem 0.85rem' }}>
            <CheckCircle2 size={16} />
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{successMsg}</div>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.25rem', padding: '0.65rem 0.85rem' }}>
            <AlertCircle size={16} />
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{error}</div>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem', fontSize: '0.9rem', height: '42px', borderRadius: '10px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
              />
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotStep(1);
                  setForgotError(null);
                  setForgotSuccess(null);
                  setShowForgotModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem', fontSize: '0.9rem', height: '42px', borderRadius: '10px' }}
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

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '12px',
              fontSize: '0.94rem',
              fontWeight: 800,
              marginTop: '0.75rem',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            }}
          >
            {loading ? 'Verifying Credentials...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '1.25rem 0 1rem 0', fontSize: '0.84rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 800, cursor: 'pointer', padding: 0 }}
          >
            Create Free Account
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>OR SOCIAL SIGN IN</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Social Login Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="btn btn-outline"
            style={{ width: '100%', borderRadius: '10px', justifyContent: 'center', padding: '0.6rem', fontSize: '0.84rem', fontWeight: 700 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign in with Google
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              className="btn btn-outline"
              style={{ width: '100%', borderRadius: '10px', justifyContent: 'center', padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              GitHub
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('twitter')}
              disabled={loading}
              className="btn btn-outline"
              style={{ width: '100%', borderRadius: '10px', justifyContent: 'center', padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Twitter (X)
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            onClick={() => onNavigate('landing')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            &larr; Back to Home
          </button>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ────────────────────────────────────────── */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '1.75rem',
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.3)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <KeyRound size={20} color="#0284c7" /> Reset Password
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  {forgotStep === 1
                    ? 'Enter your registered email to receive a verification reset code.'
                    : 'Verify your code and enter your new password.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '0.4rem', cursor: 'pointer' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            {forgotError && (
              <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem' }}>
                <AlertCircle size={15} />
                <div style={{ fontSize: '0.8rem' }}>{forgotError}</div>
              </div>
            )}

            {forgotSuccess && (
              <div className="alert-banner alert-banner-success" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem' }}>
                <CheckCircle2 size={15} />
                <div style={{ fontSize: '0.8rem' }}>{forgotSuccess}</div>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 ? (
              <form onSubmit={handleRequestPasswordReset}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    Registered Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      className="form-input"
                      style={{ paddingLeft: '2.4rem', fontSize: '0.9rem', height: '42px', borderRadius: '10px' }}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. shayadfakir8@gmail.com"
                    />
                    <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.84rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn btn-primary"
                    style={{ fontSize: '0.86rem', padding: '0.55rem 1.25rem' }}
                  >
                    {forgotLoading ? 'Verifying Account...' : 'Generate Reset Code →'}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: Enter OTP Code and New Password */
              <form onSubmit={handleConfirmPasswordReset}>
                {receivedOtp && (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 10,
                      padding: '0.75rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
                        Your Reset Code:
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1d4ed8', letterSpacing: '0.1em' }}>
                        {receivedOtp}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#2563eb', background: '#dbeafe', padding: '0.2rem 0.5rem', borderRadius: 6, fontWeight: 700 }}>
                      Auto-Applied
                    </span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    6-Digit Verification Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ fontSize: '0.9rem', height: '42px', borderRadius: '10px', letterSpacing: '0.1em', fontWeight: 700 }}
                    value={forgotOtpCode}
                    onChange={(e) => setForgotOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      className="form-input"
                      style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem', fontSize: '0.9rem', height: '42px', borderRadius: '10px' }}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
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
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    Confirm New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      className="form-input"
                      style={{ paddingLeft: '2.4rem', fontSize: '0.9rem', height: '42px', borderRadius: '10px' }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.84rem' }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn btn-primary"
                    style={{ fontSize: '0.86rem', padding: '0.55rem 1.25rem' }}
                  >
                    {forgotLoading ? 'Updating Password...' : '✓ Confirm & Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
