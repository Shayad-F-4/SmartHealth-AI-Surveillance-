import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, CreditCard, Edit3, ShieldCheck, User, Clock, AlertCircle, X, XCircle, AlertTriangle, Crop } from 'lucide-react';
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

  const role = user?.role || 'PATIENT';
  const isPatient = role === 'PATIENT';
  const isDoctor = role === 'DOCTOR';
  const isAdmin = role === 'ADMIN';

  const name = user?.name || 'User Profile';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentAvatarUrl = user?.avatarUrl
    ? user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `http://localhost:5000${user.avatarUrl}`
    : null;

  const healthId = user?.patient?.healthId || user?.doctor?.licenseNumber || 'SHC-2026-000001';
  const age = user?.patient?.dob
    ? Math.floor((Date.now() - new Date(user.patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 20;

  const bloodGroup = user?.patient?.bloodGroup || 'B+';
  const gender = user?.patient?.gender || 'Male';

  // Verification status from backend
  const verificationStatus = user?.patient?.verificationStatus || user?.doctor?.verificationStatus || 'UNVERIFIED';
  const verifiedDocumentType = user?.patient?.verifiedDocumentType || user?.doctor?.verifiedDocumentType;
  const verifiedAt = user?.patient?.verifiedAt || user?.doctor?.verifiedAt;

  const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.bannerUrl) {
      const url = user.bannerUrl.startsWith('http')
        ? user.bannerUrl
        : `http://localhost:5000${user.bannerUrl}`;
      setLocalBannerUrl(url);
    }
  }, [user?.bannerUrl]);

  const effectiveBannerUrl = localBannerUrl || (user?.bannerUrl
    ? (user.bannerUrl.startsWith('http') ? user.bannerUrl : `http://localhost:5000${user.bannerUrl}`)
    : null);

  // Healthcare-themed background banners or custom uploaded banner
  const defaultBannerGradient = isPatient
    ? 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)'
    : isDoctor
    ? 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0284c7 100%)'
    : 'linear-gradient(135deg, #0f172a 0%, #4c1d95 50%, #1e1b4b 100%)';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'File size exceeds 15MB limit.' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setUploading(true);
    setNotification(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await refreshUser();
      setNotification({ type: 'success', text: 'Profile picture updated successfully!' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to upload profile picture.';
      setNotification({ type: 'error', text: errorMsg });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCroppedBanner = async (blob: Blob) => {
    setUploading(true);
    setNotification(null);
    try {
      const formData = new FormData();
      formData.append('banner', blob, `banner-${Date.now()}.jpg`);

      const res = await api.post('/auth/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const returnedBanner = res.data?.bannerUrl || res.data?.user?.bannerUrl;
      if (returnedBanner) {
        const fullUrl = returnedBanner.startsWith('http')
          ? returnedBanner
          : `http://localhost:5000${returnedBanner}`;
        setLocalBannerUrl(`${fullUrl}?t=${Date.now()}`);
      }

      await refreshUser();
      setNotification({ type: 'success', text: 'Profile header banner cropped and updated successfully!' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to upload banner image.';
      setNotification({ type: 'error', text: errorMsg });
      setTimeout(() => setNotification(null), 5000);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
        marginBottom: '1.5rem',
      }}
    >
      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 50,
            padding: '12px 18px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            border: `1px solid ${notification.type === 'success' ? '#047857' : '#be123c'}`,
            background: notification.type === 'success' ? '#064e3b' : '#881337',
            color: notification.type === 'success' ? '#ecfdf5' : '#fff1f2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: '6px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Healthcare Cover Banner */}
      <div
        style={{
          height: '160px',
          backgroundColor: '#0f172a',
          backgroundImage: effectiveBannerUrl ? `url("${effectiveBannerUrl}")` : defaultBannerGradient,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: effectiveBannerUrl ? 0.05 : 0.12,
            backgroundImage:
              'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',
            pointerEvents: 'none',
          }}
        />

        {/* Change Banner Trigger (Top-Left inside Banner) */}
        <button
          type="button"
          onClick={() => setIsBannerModalOpen(true)}
          title="Preprocess & crop profile cover banner"
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '9px',
            padding: '0.45rem 0.85rem',
            color: 'white',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            zIndex: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          <Crop size={14} /> Crop & Change Cover
        </button>

        {/* Top-Right Quick Card Link for Patients */}
        {isPatient && onViewCardClick && (
          <button
            onClick={onViewCardClick}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: 10,
              padding: '0.45rem 0.9rem',
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              zIndex: 4,
            }}
          >
            <CreditCard size={15} /> View Smart Health Card
          </button>
        )}
      </div>

      {/* Main Profile Info Row (Clean 3-Column Layout below Banner) */}
      <div
        style={{
          padding: '0 1.5rem 1.5rem 1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          position: 'relative',
          zIndex: 4,
        }}
      >
        {/* Left Column: Avatar & User Text Details */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          {/* Avatar Wrapper (Only Avatar overlaps the bottom edge of banner) */}
          <div style={{ position: 'relative', marginTop: '-50px', zIndex: 5, flexShrink: 0 }}>
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: '50%',
                border: '4px solid #ffffff',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                fontWeight: 800,
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                initials
              )}
              {uploading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  Uploading...
                </div>
              )}
            </div>

            {/* Photo Upload Camera Trigger */}
            <label
              title="Upload profile photo"
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#0284c7',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 6,
              }}
            >
              <Camera size={15} />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* User Text Details */}
          <div style={{ paddingTop: '0.75rem', flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {name}
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.65rem',
                  borderRadius: 999,
                  background: isPatient ? '#e0f2fe' : isDoctor ? '#faf5ff' : '#f3e8ff',
                  color: isPatient ? '#0369a1' : isDoctor ? '#6b21a8' : '#7e22ce',
                  border: `1px solid ${isPatient ? '#bae6fd' : isDoctor ? '#e9d5ff' : '#d8b4fe'}`,
                }}
              >
                {role}
              </span>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600, marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span>ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{healthId}</strong></span>

              {isPatient && (
                <>
                  <span>&bull; {age} years</span>
                  <span>&bull; {gender}</span>
                  <span>&bull; Blood: <strong style={{ color: '#dc2626' }}>{bloodGroup}</strong></span>
                  <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <CheckCircle2 size={14} /> Active Patient
                  </span>
                </>
              )}

              {isDoctor && (
                <>
                  <span>&bull; {user?.doctor?.specialty || 'General Medicine'}</span>
                  <span>&bull; {user?.doctor?.qualification || 'MBBS, MD'}</span>
                  {verificationStatus === 'VERIFIED' ? (
                    <span style={{ color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 800, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={13} /> ✓ Verified Doctor
                    </span>
                  ) : verificationStatus === 'REJECTED' ? (
                    <span style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 800, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <XCircle size={13} /> ✕ Verification Rejected
                    </span>
                  ) : verificationStatus === 'SUSPENDED' ? (
                    <span style={{ color: '#fbbf24', background: '#1e293b', border: '1px solid #475569', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 800, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={13} /> ⚠ Verification Suspended
                    </span>
                  ) : (
                    <span style={{ color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.15rem 0.55rem', borderRadius: 999, fontWeight: 800, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={13} /> ◷ Verification Pending
                    </span>
                  )}
                </>
              )}

              {isAdmin && (
                <>
                  <span>&bull; IT &amp; System Administration</span>
                  <span style={{ color: '#7c3aed', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <ShieldCheck size={14} /> Full Access
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Action */}
        <div style={{ paddingTop: '0.75rem' }}>
          <button
            onClick={onEditClick}
            style={{
              padding: '0.55rem 1.15rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Banner Preprocessing & Cropper Studio Modal */}
      <BannerCropperModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        onSaveBannerBlob={handleSaveCroppedBanner}
        currentBannerUrl={effectiveBannerUrl}
        userRole={role}
        userName={name}
      />
    </div>
  );
};
