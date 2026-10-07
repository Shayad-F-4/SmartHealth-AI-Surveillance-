import React, { useState } from 'react';
import { Camera, CheckCircle2, CreditCard, Edit3, ShieldCheck, User, Clock, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface ProfileHeaderProps {
  user: any;
  onEditClick: () => void;
  onViewCardClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, onEditClick, onViewCardClick }) => {
  const { refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
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

  // Healthcare-themed background banners
  const bannerGradient = isPatient
    ? 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)'
    : isDoctor
    ? 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0284c7 100%)'
    : 'linear-gradient(135deg, #0f172a 0%, #4c1d95 50%, #1e1b4b 100%)';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'File size exceeds 5MB limit.' });
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
      setNotification({ type: 'error', text: err.response?.data?.error || 'Failed to upload profile picture.' });
      setTimeout(() => setNotification(null), 5000);
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
          height: '120px',
          background: bannerGradient,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '1rem 2rem',
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage:
              'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',
          }}
        />

        {/* Top-Right Quick Card Link for Patients */}
        {isPatient && onViewCardClick && (
          <button
            onClick={onViewCardClick}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
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
            }}
          >
            <CreditCard size={15} /> View Smart Health Card
          </button>
        )}
      </div>

      {/* Main Profile Info Row (Overlapping Banner) */}
      <div
        style={{
          padding: '0 2rem 1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '-48px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Avatar with optional photo upload & fallback initials */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                border: '4px solid #ffffff',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                fontWeight: 800,
                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.15)',
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
                    background: 'rgba(15, 23, 42, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'white',
                  }}
                >
                  Uploading...
                </div>
              )}
            </div>

            {/* Photo Upload Trigger */}
            <label
              title="Upload profile photo"
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#0284c7',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <Camera size={14} />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* User Text Details */}
          <div style={{ marginBottom: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {name}
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 999,
                  background: isPatient ? '#e0f2fe' : isDoctor ? '#faf5ff' : '#f3e8ff',
                  color: isPatient ? '#0369a1' : isDoctor ? '#6b21a8' : '#7e22ce',
                  border: `1px solid ${isPatient ? '#bae6fd' : isDoctor ? '#e9d5ff' : '#d8b4fe'}`,
                }}
              >
                {role}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span>ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{healthId}</strong></span>

              {isPatient && (
                <>
                  <span>&bull; {age} years</span>
                  <span>&bull; {gender}</span>
                  <span>&bull; Blood: <strong style={{ color: '#dc2626' }}>{bloodGroup}</strong></span>
                  <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <CheckCircle2 size={13} /> Active Patient
                  </span>
                </>
              )}

              {isDoctor && (
                <>
                  <span>&bull; {user?.doctor?.specialty || 'General Medicine'}</span>
                  <span>&bull; {user?.doctor?.qualification || 'MBBS, MD'}</span>
                  {verificationStatus === 'VERIFIED' ? (
                    <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ShieldCheck size={13} /> Verified Practitioner
                    </span>
                  ) : verificationStatus === 'ADMIN_REVIEW' || verificationStatus === 'AI_REVIEW' ? (
                    <span style={{ color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={13} /> Verification Pending
                    </span>
                  ) : (
                    <span style={{ color: '#64748b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={13} /> Unverified
                    </span>
                  )}
                </>
              )}

              {isAdmin && (
                <>
                  <span>&bull; IT &amp; System Administration</span>
                  <span style={{ color: '#7c3aed', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <ShieldCheck size={13} /> Full Access
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Trigger */}
        <button
          onClick={onEditClick}
          style={{
            padding: '0.55rem 1.1rem',
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
          }}
        >
          <Edit3 size={15} /> Edit Profile
        </button>
      </div>
    </div>
  );
};
