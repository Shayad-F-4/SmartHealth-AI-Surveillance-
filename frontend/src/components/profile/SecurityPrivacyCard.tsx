import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Key, Eye, History, Smartphone, Check, AlertCircle, Plus, X, LogOut } from 'lucide-react';
import api from '../../services/api';

interface SecurityPrivacyCardProps {
  user: any;
}

export const SecurityPrivacyCard: React.FC<SecurityPrivacyCardProps> = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCode: string } | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableMfaPassword, setDisableMfaPassword] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchSecuritySettings();
    fetchSessions();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const res = await api.get('/security/settings');
      setMfaEnabled(res.data.mfaEnabled);
      setLoginHistory(res.data.recentLogins || []);
    } catch (err) {
      console.error('Error fetching security settings:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get('/security/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.post(`/security/sessions/${sessionId}/revoke`);
      setStatusMsg({ text: 'Session revoked successfully.', success: true });
      await fetchSessions();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.error || 'Failed to revoke session.', success: false });
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.post('/security/sessions/revoke-all');
      setStatusMsg({ text: 'All other sessions revoked successfully.', success: true });
      await fetchSessions();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.error || 'Failed to revoke sessions.', success: false });
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!currentPassword || !newPassword) {
      setStatusMsg({ text: 'Please fill in current and new password.', success: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ text: 'New passwords do not match.', success: false });
      return;
    }
    if (newPassword.length < 8) {
      setStatusMsg({ text: 'Password must be at least 8 characters long.', success: false });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setStatusMsg({ text: 'Password must contain at least one uppercase letter.', success: false });
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setStatusMsg({ text: 'Password must contain at least one lowercase letter.', success: false });
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setStatusMsg({ text: 'Password must contain at least one number.', success: false });
      return;
    }

    setIsLoading(true);
    try {
      await api.put('/auth/me', {
        currentPassword,
        newPassword,
      });
      setStatusMsg({ text: 'Password successfully updated.', success: true });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.error || 'Failed to update password.', success: false });
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASetup = async () => {
    try {
      const res = await api.post('/mfa/setup');
      setMfaSetup(res.data);
      setStatusMsg({ text: 'Scan the QR code with your authenticator app.', success: true });
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.error || 'Failed to setup MFA.', success: false });
    }
  };

  const handleMFAVerify = async () => {
    if (!mfaToken) {
      setStatusMsg({ text: 'Please enter the verification code.', success: false });
      return;
    }

    try {
      const res = await api.post('/mfa/verify', { token: mfaToken });
      setBackupCodes(res.data.backupCodes);
      setShowBackupCodes(true);
      setMfaSetup(null);
      setMfaToken('');
      setMfaEnabled(true);
      setStatusMsg({ text: 'MFA enabled successfully. Save your backup codes!', success: true });
      fetchSecuritySettings();
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.error || 'Invalid verification code.', success: false });
    }
  };

  const handleMFADisable = async () => {
    if (!disableMfaPassword) {
      setStatusMsg({ text: 'Please enter your current password.', success: false });
      return;
    }

    try {
      await api.post('/mfa/disable', { password: disableMfaPassword });
      setMfaEnabled(false);
      setDisableMfaPassword('');
      setStatusMsg({ text: 'MFA disabled successfully.', success: true });
      fetchSecuritySettings();
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.error || 'Failed to disable MFA.', success: false });
    }
  };

  const accessLogs = loginHistory.map((log: any) => ({
    id: log.id,
    actor: user?.name || 'User',
    action: log.success ? 'Successful Login' : `Failed Login: ${log.failureReason || 'Invalid credentials'}`,
    timestamp: new Date(log.loginTime).toLocaleString(),
    ip: log.ipAddress,
  }));

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '1.35rem 1.5rem',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Lock size={18} color="#0284c7" /> Security &amp; Access Controls
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
          Manage authentication parameters, active sessions, and clinical access audit history
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Password Update Form */}
        <form onSubmit={handlePasswordChange} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.15rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Key size={16} color="#0284c7" /> Update Password
          </div>

          {statusMsg && (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '0.85rem',
                background: statusMsg.success ? '#f0fdf4' : '#fef2f2',
                color: statusMsg.success ? '#166534' : '#991b1b',
                border: `1px solid ${statusMsg.success ? '#bbf7d0' : '#fecaca'}`,
              }}
            >
              {statusMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '0.35rem',
                padding: '0.55rem 1rem',
                background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>

        {/* Active Session & Access Audit Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* MFA Status Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.15rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color={mfaEnabled ? '#16a34a' : '#ca8a04'} />
              Two-Factor Authentication
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
              {mfaEnabled ? (
                <>
                  <Check size={14} color="#16a34a" />
                  <span style={{ color: '#16a34a' }}>Enabled</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} color="#ca8a04" />
                  <span style={{ color: '#ca8a04' }}>Not Enabled</span>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>
              {mfaEnabled ? 'Your account is protected with MFA' : 'Add an extra layer of security to your account'}
            </div>
            {!mfaEnabled && (
              <button
                onClick={handleMFASetup}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Enable MFA
              </button>
            )}
            {mfaEnabled && (
              <button
                onClick={() => setDisableMfaPassword('')}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Disable MFA
              </button>
            )}
          </div>

          {/* MFA Setup Modal */}
          {mfaSetup && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.15rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Smartphone size={16} color="#0284c7" /> Setup MFA
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                {mfaSetup.qrCode && <img src={mfaSetup.qrCode} alt="QR Code" style={{ maxWidth: '200px', margin: '0 auto' }} />}
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                  Scan with Google Authenticator, Authy, or similar app
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
                <button
                  onClick={handleMFAVerify}
                  style={{
                    padding: '0.55rem 1rem',
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Verify
                </button>
                <button
                  onClick={() => setMfaSetup(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    background: '#94a3b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Backup Codes Display */}
          {showBackupCodes && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 14, padding: '1.15rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Key size={16} color="#92400e" /> Backup Codes
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.5rem' }}>
                Save these codes securely. You will not see them again.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {backupCodes.map((code, idx) => (
                  <div key={idx} style={{ background: '#fffbeb', padding: '0.4rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600, color: '#92400e' }}>
                    {code}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowBackupCodes(false)}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.8rem',
                  background: '#d97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                I've Saved These Codes
              </button>
            </div>
          )}

          {/* Disable MFA Form */}
          {disableMfaPassword !== '' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '1.15rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertCircle size={16} color="#991b1b" /> Disable MFA
              </div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                Enter your current password to disable MFA
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="password"
                  value={disableMfaPassword}
                  onChange={(e) => setDisableMfaPassword(e.target.value)}
                  placeholder="Current password"
                  style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #fecaca', fontSize: '0.85rem' }}
                />
                <button
                  onClick={handleMFADisable}
                  style={{
                    padding: '0.55rem 1rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Disable
                </button>
                <button
                  onClick={() => setDisableMfaPassword('')}
                  style={{
                    padding: '0.55rem 1rem',
                    background: '#94a3b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Active Sessions */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.15rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Smartphone size={16} color="#0284c7" /> Active Sessions
            </div>
            {sessions.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#64748b', padding: '1rem' }}>
                No active sessions
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sessions.map((session) => (
                  <div key={session.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {session.isCurrent && <Check size={12} color="#16a34a" />}
                          {session.userAgent || 'Unknown Device'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>
                          IP: {session.ipAddress || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Last active: {new Date(session.lastActivity).toLocaleString()}
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <LogOut size={12} /> Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {sessions.length > 1 && (
                  <button
                    onClick={handleRevokeAllSessions}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f97316',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '0.25rem',
                    }}
                  >
                    Log Out All Other Sessions
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Login History */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.15rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <History size={16} color="#7c3aed" /> Login History
            </div>

            {accessLogs.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#64748b', padding: '1rem' }}>
                No login history available
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {accessLogs.map((log) => (
                  <div key={log.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                      <span>{log.actor}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{log.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.05rem' }}>
                      IP: {log.ip}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
