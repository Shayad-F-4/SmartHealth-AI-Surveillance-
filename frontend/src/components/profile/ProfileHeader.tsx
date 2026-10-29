import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, CheckCircle2, CreditCard, Edit3, ShieldCheck,
  Clock, AlertCircle, X, XCircle, AlertTriangle, Crop,
  Trash2, Upload, User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BannerCropperModal } from './BannerCropperModal';

interface ProfileHeaderProps {
  user: any;
  onEditClick: () => void;
  onViewCardClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, onEditClick, onViewCardClick }) => {
  const { refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(null);

  // Close avatar menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    if (avatarMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [avatarMenuOpen]);

  const role = user?.role || 'PATIENT';
  const isPatient = role === 'PATIENT';
  const isDoctor = role === 'DOCTOR';
  const isAdmin = role === 'ADMIN';

  const name = user?.name || 'User Profile';
  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const currentAvatarUrl = user?.avatarUrl
    ? user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`
    : null;

  const healthId = user?.patient?.healthId || user?.doctor?.licenseNumber || 'SHC-2026-000001';
  const age = user?.patient?.dob
    ? Math.floor((Date.now() - new Date(user.patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 20;
  const bloodGroup = user?.patient?.bloodGroup || 'B+';
  const gender = user?.patient?.gender || 'Male';
  const verificationStatus = user?.patient?.verificationStatus || user?.doctor?.verificationStatus || 'UNVERIFIED';

  // Sync banner from user prop
  useEffect(() => {
    if (user?.bannerUrl) {
      const url = user.bannerUrl.startsWith('http') ? user.bannerUrl : `http://localhost:5000${user.bannerUrl}`;
      setLocalBannerUrl(url);
    } else {
      setLocalBannerUrl(null);
    }
  }, [user?.bannerUrl]);

  const defaultBannerGradient = isPatient
    ? 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)'
    : isDoctor
    ? 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0284c7 100%)'
    : 'linear-gradient(135deg, #0f172a 0%, #4c1d95 50%, #1e1b4b 100%)';

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4500);
  };

  // ── Upload new profile photo ──
  const handlePhotoUpload = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      showNotification('error', 'File exceeds 15MB limit.');
      return;
    }
    setUploading(true);
    setAvatarMenuOpen(false);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      showNotification('success', 'Profile photo updated!');
    } catch (err: any) {
      showNotification('error', err.response?.data?.error || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // ── Remove profile photo ──
  const handleRemovePhoto = async () => {
    setUploading(true);
    setAvatarMenuOpen(false);
    try {
      await api.patch('/auth/profile', { avatarUrl: null });
      await refreshUser();
      showNotification('success', 'Profile photo removed.');
    } catch (err: any) {
      showNotification('error', err.response?.data?.error || err.message || 'Remove failed.');
    } finally {
      setUploading(false);
    }
  };

  // ── Save cropped banner ──
  const handleSaveCroppedBanner = async (blob: Blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('banner', blob, `banner-${Date.now()}.jpg`);
      const res = await api.post('/auth/banner', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const returnedBanner = res.data?.bannerUrl || res.data?.user?.bannerUrl;
      if (returnedBanner) {
        const fullUrl = returnedBanner.startsWith('http') ? returnedBanner : `http://localhost:5000${returnedBanner}`;
        // Immediately update local state with cache-busting query string
        setLocalBannerUrl(`${fullUrl}?t=${Date.now()}`);
      }
      await refreshUser();
      showNotification('success', 'Banner updated successfully!');
    } catch (err: any) {
      showNotification('error', err.response?.data?.error || err.message || 'Banner upload failed.');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const menuRowBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.875rem',
    fontWeight: 600, width: '100%', textAlign: 'left',
    background: 'transparent', border: 'none', transition: 'background 0.12s ease',
  };

  return (
    <div style={{
      position: 'relative', borderRadius: 20, overflow: 'visible',
      background: '#ffffff', border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(15,23,42,0.06)', marginBottom: '1.5rem',
    }}>

      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '12px 18px', borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          border: `1px solid ${notification.type === 'success' ? '#047857' : '#be123c'}`,
          background: notification.type === 'success' ? '#064e3b' : '#881337',
          color: notification.type === 'success' ? '#ecfdf5' : '#fff1f2',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '0.8rem', fontWeight: 700,
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: '6px' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Banner ── */}
      <div style={{
        height: '160px', backgroundColor: '#0f172a',
        backgroundImage: localBannerUrl ? `url("${localBannerUrl}")` : defaultBannerGradient,
        backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat',
        position: 'relative', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', padding: '1rem 1.5rem',
        borderRadius: '20px 20px 0 0', overflow: 'hidden', zIndex: 1,
      }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: localBannerUrl ? 0.04 : 0.12,
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px',
          pointerEvents: 'none',
        }} />

        {/* Change Cover button */}
        <button
          type="button"
          onClick={() => setIsBannerModalOpen(true)}
          style={{
            background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.35)', borderRadius: '9px',
            padding: '0.45rem 0.85rem', color: 'white', fontSize: '0.78rem',
            fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
            alignItems: 'center', gap: '0.45rem', zIndex: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          <Crop size={14} /> Change Cover
        </button>

        {isPatient && onViewCardClick && (
          <button
            onClick={onViewCardClick}
            style={{
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10,
              padding: '0.45rem 0.9rem', color: 'white', fontSize: '0.8rem',
              fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
              alignItems: 'center', gap: '0.4rem', zIndex: 4,
            }}
          >
            <CreditCard size={15} /> View Smart Health Card
          </button>
        )}
      </div>

      {/* ── Info Row ── */}
      <div style={{
        padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>

          {/* ── Avatar + Popover ── */}
          <div ref={avatarMenuRef} style={{ position: 'relative', marginTop: '-50px', zIndex: 200, flexShrink: 0 }}>

            {/* Avatar circle */}
            <div
              onClick={() => !uploading && setAvatarMenuOpen(v => !v)}
              title="Change profile photo"
              style={{
                width: 104, height: 104, borderRadius: '50%',
                border: '4px solid #ffffff',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800,
                boxShadow: '0 6px 18px rgba(15,23,42,0.12)',
                overflow: 'hidden', position: 'relative', cursor: 'pointer',
              }}
            >
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl} alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : initials}
              {uploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 700 }}>Saving...</span>
                </div>
              )}
            </div>

            {/* Camera badge */}
            <button
              type="button"
              onClick={() => !uploading && setAvatarMenuOpen(v => !v)}
              style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 32, height: 32, borderRadius: '50%',
                background: '#0284c7', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2.5px solid #ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.22)', zIndex: 6,
              }}
            >
              <Camera size={15} />
            </button>

            {/* ── Popover dropdown (LinkedIn-style) ── */}
            {avatarMenuOpen && (
              <div style={{
                position: 'absolute', top: '112px', left: 0, zIndex: 9999,
                background: '#ffffff', border: '1px solid #e2e8f0',
                borderRadius: '14px', boxShadow: '0 16px 40px rgba(15,23,42,0.18)',
                minWidth: '215px', overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    Profile Photo
                  </p>
                </div>

                {/* Upload option */}
                <label
                  style={{ ...menuRowBase, color: '#0f172a' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Upload size={16} color="#0284c7" />
                  Upload New Photo
                  <input
                    ref={avatarFileInputRef}
                    type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>

                {/* View Current (only if photo exists) */}
                {currentAvatarUrl && (
                  <a
                    href={currentAvatarUrl} target="_blank" rel="noopener noreferrer"
                    style={{ ...menuRowBase, color: '#0f172a', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User size={16} color="#64748b" />
                    View Current Photo
                  </a>
                )}

                {/* Remove Photo (only if photo exists) */}
                {currentAvatarUrl && (
                  <>
                    <div style={{ height: '1px', background: '#f1f5f9' }} />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{ ...menuRowBase, color: '#dc2626' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Trash2 size={16} />
                      Remove Photo
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── User text details ── */}
          <div style={{ paddingTop: '0.75rem', flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {name}
              </h1>
              <span style={{
                fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem',
                borderRadius: 999,
                background: isPatient ? '#e0f2fe' : isDoctor ? '#faf5ff' : '#f3e8ff',
                color: isPatient ? '#0369a1' : isDoctor ? '#6b21a8' : '#7e22ce',
                border: `1px solid ${isPatient ? '#bae6fd' : isDoctor ? '#e9d5ff' : '#d8b4fe'}`,
              }}>
                {role}
              </span>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600, marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span>ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{healthId}</strong></span>

              {isPatient && (<>
                <span>&bull; {age} years</span>
                <span>&bull; {gender}</span>
                <span>&bull; Blood: <strong style={{ color: '#dc2626' }}>{bloodGroup}</strong></span>
                <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <CheckCircle2 size={14} /> Active Patient
                </span>
              </>)}

              {isDoctor && (<>
                <span>&bull; {user?.doctor?.specialty || 'General Medicine'}</span>
                <span>&bull; {user?.doctor?.qualification || 'MBBS, MD'}</span>
                {verificationStatus === 'VERIFIED' ? (
                  <span style={{ color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 800, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={13} /> Verified Doctor
                  </span>
                ) : verificationStatus === 'REJECTED' ? (
                  <span style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 800, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <XCircle size={13} /> Verification Rejected
                  </span>
                ) : verificationStatus === 'SUSPENDED' ? (
                  <span style={{ color: '#fbbf24', background: '#1e293b', border: '1px solid #475569', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 800, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertTriangle size={13} /> Suspended
                  </span>
                ) : (
                  <span style={{ color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 800, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={13} /> Verification Pending
                  </span>
                )}
              </>)}

              {isAdmin && (<>
                <span>&bull; IT &amp; System Administration</span>
                <span style={{ color: '#7c3aed', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <ShieldCheck size={14} /> Full Access
                </span>
              </>)}
            </div>
          </div>
        </div>

        {/* Edit Profile button */}
        <div style={{ paddingTop: '0.75rem' }}>
          <button
            onClick={onEditClick}
            style={{
              padding: '0.55rem 1.15rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2,132,199,0.25)', whiteSpace: 'nowrap',
            }}
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Banner Modal */}
      <BannerCropperModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        onSaveBannerBlob={handleSaveCroppedBanner}
        currentBannerUrl={localBannerUrl}
        userRole={role}
        userName={name}
      />
    </div>
  );
};
