import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

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
  const [address, setAddress] = useState('14th Cross, Riverside Road');
  const [allergies, setAllergies] = useState('None');
  const [chronicConditions, setChronicConditions] = useState('None');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Doctor fields
  const [specialty, setSpecialty] = useState('Internal Medicine');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('8');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      payload.address = address;
      payload.allergies = allergies;
      payload.chronicConditions = chronicConditions;
      payload.emergencyContactName = emergencyContactName || 'Primary Contact';
      payload.emergencyContactPhone = emergencyContactPhone || phone;
    } else {
      payload.specialty = specialty;
      payload.qualification = qualification;
      payload.licenseNumber = licenseNumber || `MCI-KA-${Date.now().toString().slice(-5)}`;
      payload.experienceYears = parseInt(experienceYears);
    }

    try {
      const res = await api.post('/auth/register', payload);
      login(res.data.token, res.data.user);
      if (role === 'DOCTOR') onNavigate('doctor-dashboard');
      else onNavigate('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
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
              <input type="password" required className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input required className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>

          {/* Patient Specific Form Fields */}
          {role === 'PATIENT' && (
            <>
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

                <div className="form-group">
                  <label className="form-label">Residential District</label>
                  <select className="form-select" value={district} onChange={(e) => setDistrict(e.target.value)}>
                    <option value="Riverside District">Riverside District</option>
                    <option value="Metro North">Metro North</option>
                    <option value="Green Valley">Green Valley</option>
                    <option value="Highland Park">Highland Park</option>
                    <option value="Downtown Central">Downtown Central</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full street address" />
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
