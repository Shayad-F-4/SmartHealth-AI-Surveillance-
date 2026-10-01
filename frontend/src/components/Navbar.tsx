import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldAlert, LogOut, User, CheckCheck, Search, MapPin, CloudSun, ChevronDown } from 'lucide-react';
import api from '../services/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  district?: string;
  isRead: boolean;
  createdAt: string;
}

export const Navbar: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user, logout, unreadNotifications, fetchNotificationsCount } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch {
      // ignore
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      loadNotifications();
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      fetchNotificationsCount();
    } catch {
      // ignore
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      fetchNotificationsCount();
    } catch {
      // ignore
    }
  };

  return (
    <header className="top-navbar no-print">
      {/* Left Section - Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-muted)' 
            }} 
          />
          <input
            type="text"
            placeholder="Search diseases, symptoms, doctors, or health tips..."
            style={{
              width: '100%',
              padding: '0.6rem 0.9rem 0.6rem 2.75rem',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              background: '#fafbfc',
              color: 'var(--text-main)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-500)';
              e.target.style.background = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-light)';
              e.target.style.background = '#fafbfc';
            }}
          />
        </div>
      </div>

      {/* Right Section - Location, Weather, Notifications, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
        {/* Location Selector */}
        {user?.patient?.district && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 0.85rem',
            background: '#fafbfc',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            cursor: 'pointer',
          }}>
            <MapPin size={16} color="var(--primary-600)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {user.patient.district}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
        )}

        {/* Weather Widget */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem 0.85rem',
          background: '#fffbeb',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #fde68a',
        }}>
          <CloudSun size={18} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#b45309', lineHeight: 1 }}>
              28°C
            </div>
            <div style={{ fontSize: '0.7rem', color: '#92400e' }}>
              Partly Cloudy
            </div>
          </div>
        </div>

        {/* Emergency Fast Lookup Button */}
        <button
          onClick={() => onNavigate && onNavigate('emergency-lookup')}
          className="emergency-quick-btn"
          title="Instant Emergency Profile Lookup by Smart Health ID"
        >
          <ShieldAlert size={15} />
          <span>Emergency Lookup</span>
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleOpenNotifications}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Bell size={18} color="var(--text-main)" />
            {unreadNotifications > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '360px',
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-light)',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Community & Health Alerts</span>
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary-600)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No recent alerts or notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markSingleRead(n.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.isRead ? '#ffffff' : '#f8fafc',
                        borderLeft: !n.isRead
                          ? n.priority === 'CRITICAL'
                            ? '4px solid #ef4444'
                            : '4px solid #f59e0b'
                          : '4px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  flexShrink: 0,
                }}
              >
                {user.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : <User size={18} />}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                    {user.name}
                  </span>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : user.role === 'DOCTOR' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                    {user.role}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {user.patient?.healthId || user.doctor?.specialty || user.email}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.65rem' }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
