import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Check, ShieldAlert } from 'lucide-react';

interface NotificationPreferencesCardProps {
  userRole: string;
}

export const NotificationPreferencesCard: React.FC<NotificationPreferencesCardProps> = ({ userRole }) => {
  const [preferences, setPreferences] = useState({
    areaAlerts: true,
    surveillanceAlerts: true,
    appointments: true,
    labResults: true,
    prescriptions: true,
    channelInApp: true,
    channelEmail: true,
    channelSMS: false,
  });

  const [saved, setSaved] = useState(false);

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
        gap: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Bell size={18} color="#0284c7" /> Notification &amp; Surveillance Alert Preferences
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Manage delivery channels and triggers for clinical advisories and health updates
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: saved ? '#16a34a' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s ease',
          }}
        >
          {saved ? <Check size={14} /> : null}
          {saved ? 'Preferences Saved' : 'Save Preferences'}
        </button>
      </div>

      {/* Delivery Channels Row */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Delivery Channels:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={preferences.channelInApp} onChange={() => togglePref('channelInApp')} />
          <span>In-App Notifications</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={preferences.channelEmail} onChange={() => togglePref('channelEmail')} />
          <span>Email Broadcasts</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={preferences.channelSMS} onChange={() => togglePref('channelSMS')} />
          <span>SMS Text Alerts</span>
        </label>
      </div>

      {/* Alert Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Category 1: Area Health Alerts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldAlert size={16} color="#ea580c" /> Area Health Alerts (25 km Radius)
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              Receive targeted disease outbreak advisories for your registered district.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.areaAlerts}
            onChange={() => togglePref('areaAlerts')}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {/* Category 2: Disease Surveillance Updates */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              Disease Surveillance Telemetry
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              Weekly epidemic cluster summaries and public health bulletins.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.surveillanceAlerts}
            onChange={() => togglePref('surveillanceAlerts')}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {/* Category 3: Appointment Reminders */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              Consultation &amp; Appointment Reminders
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              Timely notifications for upcoming doctor shifts or scheduled visits.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.appointments}
            onChange={() => togglePref('appointments')}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {/* Category 4: Lab Result Notifications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              Lab Result &amp; Out-of-Range Flags
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              Immediate notification when diagnostic reports or out-of-range lab results are finalized.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.labResults}
            onChange={() => togglePref('labResults')}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
};
