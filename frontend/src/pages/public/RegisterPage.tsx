import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, MapPin, RefreshCw, Edit3 } from 'lucide-react';
import api from '../../services/api';
import { getCurrentPosition, reverseGeocode } from '../../services/locationService';
import type { LocationDetails } from '../../services/locationService';

export const RegisterPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Patient fields
  const [gender, setGender] = useState('MALE');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [dob, setDob] = useState('1992-05-10');
  const [district, setDistrict] = useState('Riverside District');
  const [address, setAddress] = useState('');
  const [allergies, setAllergies] = useState('None');
  const [chronicConditions, setChronicConditions] = useState('None');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Location details state
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualLocality, setManualLocality] = useState('');
  const [manualCity, setManualCity] = useState('');

  // Doctor fields
  const [specialty, setSpecialty] = useState('Internal Medicine');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('8');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const handleSocialRegister = async (provider: 'google' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);
    try {
      let socialEmail = `${provider}.patient@smarthealth.net`;
      let socialName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified User`;
      if (role === 'DOCTOR') {
        socialEmail = `dr.${provider}@smarthealth.gov`;
        socialName = `Dr. ${provider.charAt(0).toUpperCase() + provider.slice(1)} Specialist`;
      }

      const res = await api.post('/auth/social-login', {
        provider,
        email: socialEmail,
        name: socialName,
        role,
      });

      login(res.data.token, res.data.user);
      if (res.data.user.role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to sign up with ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setLocationError(null);
    try {
      const pos = await getCurrentPosition();
      const details = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setLocationDetails(details);
      if (details.district) setDistrict(details.district);
      if (details.city) setManualCity(details.city);
      if (details.locality) setManualLocality(details.locality);
      if (details.formattedAddress) setAddress(details.formattedAddress);
      setManualMode(false);
    } catch (err: any) {
      setLocationError(err.message || 'Location permission was denied or position is unavailable.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[A-Z]/.test(pwd)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(pwd)) errors.push('Password must contain at least one number');
    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordErrors([]);

    // Frontend validation
    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0) {
      setPasswordErrors(pwdErrors);
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!name || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    if (role === 'DOCTOR' && !licenseNumber?.trim()) {
      setError('Medical license number is required for doctor registration.');
      return;
    }

    setLoading(true);

    const payload: any = {
      role,
      name,
      email,
      password,
      phone,
    };

    if (role === 'PATIENT') {
      payload.gender = gender;
      payload.bloodGroup = bloodGroup;
      payload.dob = dob;
      payload.district = district;
      payload.address = address || (locationDetails?.formattedAddress) || (manualLocality ? `${manualLocality}, ${manualCity}` : 'Specified Address');
      payload.allergies = allergies;
      payload.chronicConditions = chronicConditions;
      payload.emergencyContactName = emergencyContactName || 'Primary Contact';
      payload.emergencyContactPhone = emergencyContactPhone || phone;

      if (locationDetails && !manualMode) {
        payload.lat = locationDetails.latitude;
        payload.lng = locationDetails.longitude;
        payload.locality = locationDetails.locality;
        payload.subLocality = locationDetails.subLocality;
        payload.city = locationDetails.city;
        payload.state = locationDetails.state;
        payload.postalCode = locationDetails.postalCode;
        payload.country = locationDetails.country;
        payload.formattedAddress = locationDetails.formattedAddress;
      } else if (manualMode && (manualLocality || manualCity)) {
        payload.locality = manualLocality || null;
        payload.city = manualCity || null;
        payload.district = manualCity || district;
        payload.formattedAddress = manualLocality ? `${manualLocality}, ${manualCity}` : manualCity;
      }
    } else {
      payload.specialty = specialty;
      payload.qualification = qualification;
      payload.licenseNumber = licenseNumber || `MCI-KA-${Date.now().toString().slice(-5)}`;
      payload.experienceYears = parseInt(experienceYears || '5');
    }

    try {
      const res = await api.post('/auth/register', payload);
      login(res.data.token, res.data.user);
      if (role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      // Map backend errors to user-friendly messages
      if (errorMsg.includes('email') || errorMsg.includes('Email')) {
        setError('An account with this email already exists. Please use a different email or sign in.');
      } else if (errorMsg.includes('license') || errorMsg.includes('License')) {
        setError('This medical license number is already registered.');
      } else if (errorMsg.includes('password') || errorMsg.includes('Password')) {
        setError('Password does not meet security requirements.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2.5rem 1rem' }}>
      <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '2.5rem', boxShadow: 'var(--shadow-xl)' }}>
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
            Join the integrated EHR and disease surveillance platform
          </p>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <button
            type="button"
            onClick={() => setRole('PATIENT')}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: role === 'PATIENT' ? '2px solid var(--primary-500)' : '1px solid var(--border-light)',
              background: role === 'PATIENT' ? '#f0f9ff' : 'white',
              color: role === 'PATIENT' ? 'var(--primary-700)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {role === 'PATIENT' && <CheckCircle2 size={16} color="#0284c7" />} Patient Portal
          </button>

          <button
            type="button"
            onClick={() => setRole('DOCTOR')}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: role === 'DOCTOR' ? '2px solid var(--primary-500)' : '1px solid var(--border-light)',
              background: role === 'DOCTOR' ? '#f0f9ff' : 'white',
              color: role === 'DOCTOR' ? 'var(--primary-700)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {role === 'DOCTOR' && <CheckCircle2 size={16} color="#0284c7" />} Doctor / Clinician
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>
          </div>
        )}

        {passwordErrors.length > 0 && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Password Requirements:</div>
            <ul style={{ fontSize: '0.8rem', marginTop: '0.5rem', paddingLeft: '1.25rem', margin: '0.5rem 0 0 0' }}>
              {passwordErrors.map((err, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input required className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" required className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: '2.4rem' }}
                />
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

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input required className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>

          {/* Patient Specific Form Fields */}
          {role === 'PATIENT' && (
            <>
              {/* 📍 Current Location Section */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <MapPin size={18} color="var(--primary-600)" />
                    <span>Current Location</span>
                  </div>
                  
                  {!manualMode && (
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      style={{
                        padding: '0.4rem 0.85rem',
                        background: 'var(--primary-600)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <RefreshCw size={14} className={detectingLocation ? 'spin' : ''} />
                      {detectingLocation ? 'Detecting...' : 'Detect My Location'}
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  SmartHealth uses your location to provide accurate nearby health signals and location-based healthcare information.
                </div>

                {/* Location Detection Status or Result */}
                {locationDetails && !manualMode && (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}>
                      <CheckCircle2 size={16} /> 📍 Live Location Detected
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#064e3b', marginTop: '0.25rem' }}>
                      {locationDetails.displayHeader}
                    </div>
                    {locationDetails.state && (
                      <div style={{ fontSize: '0.78rem', color: '#047857' }}>{locationDetails.state} {locationDetails.postalCode ? `(${locationDetails.postalCode})` : ''}</div>
                    )}
                  </div>
                )}

                {locationError && !manualMode && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                  }}>
                    <div style={{ fontSize: '0.82rem', color: '#b91c1c', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {locationError}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualMode(true)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: 'white',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Enter Location Manually
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Mode Input */}
                {manualMode && (
                  <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c2410c', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Edit3 size={14} /> 📌 Manually Entered Location
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input
                        className="form-input"
                        placeholder="Locality / Area Name"
                        value={manualLocality}
                        onChange={(e) => setManualLocality(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                      />
                      <input
                        className="form-input"
                        placeholder="City / Town"
                        value={manualCity}
                        onChange={(e) => setManualCity(e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualMode(false)}
                      style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#c2410c', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ← Switch back to Live GPS Detection
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" required className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Street Address</label>
                <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full street address or area details" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Known Drug/Food Allergies</label>
                  <input className="form-input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Peanuts (or None)" />
                </div>

                <div className="form-group">
                  <label className="form-label">Existing Chronic Conditions</label>
                  <input className="form-input" value={chronicConditions} onChange={(e) => setChronicConditions(e.target.value)} placeholder="e.g. Hypertension, Diabetes (or None)" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name</label>
                  <input className="form-input" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="e.g. Parent / Spouse Name" />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact Phone</label>
                  <input className="form-input" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} placeholder="e.g. +91 99000 12345" />
                </div>
              </div>
            </>
          )}

          {/* Doctor Specific Fields */}
          {role === 'DOCTOR' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Medical Specialty</label>
                  <select className="form-select" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Infectious Diseases & Epidemiology">Infectious Diseases & Epidemiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General Surgery">General Surgery</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Medical License Number</label>
                  <input className="form-input" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. MCI-KA-2026-99201" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Qualifications</label>
                  <input className="form-input" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. MBBS, MD (Medicine)" />
                </div>

                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <input type="number" min="1" max="50" className="form-input" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }}>
            {loading ? 'Creating Account & Health ID...' : `Register as ${role}`} <ArrowRight size={16} />
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>or sign up instantly with</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Social Sign Up Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => handleSocialRegister('google')}
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
            Sign up with Google
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => handleSocialRegister('github')}
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
              onClick={() => handleSocialRegister('twitter')}
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

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already registered?</span>{' '}
          <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontWeight: 700, cursor: 'pointer' }}>
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};
