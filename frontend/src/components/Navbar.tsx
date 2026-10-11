import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldAlert, LogOut, User, CheckCheck, Search, MapPin, CloudSun, ChevronDown, CreditCard, ShieldCheck, RefreshCw, X, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { getCurrentPosition, reverseGeocode, formatHeaderLocation } from '../services/locationService';
import { useLocation } from '../context/LocationContext';

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

interface NavbarProps {
  onNavigate?: (tab: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onToggleMobileSidebar }) => {
  const { user, logout, unreadNotifications, fetchNotificationsCount } = useAuth();
  const { locationDetails, loading: locationLoading, error: locationError, refreshLocation } = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Live Weather state
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [showLocationCard, setShowLocationCard] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [refreshStep, setRefreshStep] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (locationDetails?.latitude && locationDetails?.longitude) {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${locationDetails.latitude}&longitude=${locationDetails.longitude}&current_weather=true`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data?.current_weather) {
            setWeather({
              temp: Math.round(data.current_weather.temperature),
              condition: data.current_weather.weathercode <= 3 ? 'Clear / Fair' : 'Overcast / Cloud',
            });
          }
        })
        .catch(() => {});
    }
  }, [locationDetails]);
  const handleRefreshLocation = async () => {
    setRefreshingLocation(true);
    setRefreshStep('Getting current location...');
    await new Promise(r => setTimeout(r, 200));
    setRefreshStep('Finding locality...');
    await refreshLocation();
    setRefreshStep('✓ Location updated');
    setTimeout(() => {
      setRefreshStep(null);
      setRefreshingLocation(false);
    }, 1200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.top-navbar')) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (onNavigate) {
      onNavigate('records');
    }
  };

  return (
    <header className="top-navbar no-print">
      {/* Left Section - Mobile Hamburger + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-md)',
            }}
            aria-label="Toggle navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        )}

        <form onSubmit={handleSearchSubmit} className="navbar-search-form">
          <Search 
            size={16} 
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, conditions, doctors..."
            style={{
              width: '100%',
              padding: '0.5rem 0.8rem 0.5rem 2.4rem',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              background: '#fafbfc',
              color: 'var(--text-main)',
              outline: 'none',
            }}
          />
        </form>
      </div>

      {/* Right Section - Location, Weather, Notifications, User */}
      <div className="navbar-right-section" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', position: 'relative' }}>
        {/* Location Display Button with LocationCard Popup */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLocationCard(!showLocationCard)}
            className="navbar-location-btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              background: '#fafbfc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              color: 'var(--text-main)',
              maxWidth: '220px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
            title={locationDetails?.displayHeader || 'View / Refresh Location'}
          >
            <MapPin size={15} color="var(--primary-600)" style={{ flexShrink: 0 }} />
            <span className="navbar-location-text" style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {locationDetails?.displayHeader ||
                user?.doctor?.hospital?.name ||
                user?.doctor?.hospital?.district ||
                user?.patient?.locality ||
                user?.patient?.district ||
                (locationError ? 'Set Location' : 'Detecting location...')}
            </span>
          </button>

          {/* 📍 LocationCard Modal Panel (Requirement 5) */}
          {showLocationCard && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-light)',
              padding: '1rem',
              zIndex: 1000,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <MapPin size={16} color="var(--primary-600)" />
                  <span>Current Location</span>
                </div>
                <button
                  onClick={() => setShowLocationCard(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {locationDetails ? (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.25 }}>
                    {locationDetails.locality || locationDetails.subLocality || locationDetails.city || 'Current Area'}
                  </div>
                  {locationDetails.city && locationDetails.city !== locationDetails.locality && (
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>
                      {locationDetails.city}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '2px' }}>
                    {locationDetails.state || locationDetails.district || 'India'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.65rem', fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                    <Check size={14} />
                    <span>{locationDetails.isLive ? '✓ Live location detected' : '📌 Stored profile location'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {locationError || 'No verified location available yet.'}
                </div>
              )}

              {refreshStep && (
                <div style={{ fontSize: '0.78rem', color: 'var(--primary-600)', fontWeight: 600, marginBottom: '0.6rem' }}>
                  {refreshStep}
                </div>
              )}

              <button
                onClick={handleRefreshLocation}
                disabled={refreshingLocation}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  background: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--primary-700)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <RefreshCw size={14} className={refreshingLocation ? 'spin' : ''} />
                <span>{refreshingLocation ? 'Updating...' : '↻ Refresh Location'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Weather Widget */}
        {weather ? (
          <div 
            className="navbar-weather-badge"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              background: '#fffbeb',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #fde68a',
            }}
          >
            <CloudSun size={18} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#b45309', lineHeight: 1 }}>
                {weather.temp}°C
              </div>
              <div style={{ fontSize: '0.7rem', color: '#92400e' }}>
                {weather.condition}
              </div>
            </div>
          </div>
        ) : null}

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

        {/* User Info & Dropdown Menu */}
        {user && (
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowUserMenu((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-md)',
                background: showUserMenu ? 'rgba(15, 23, 42, 0.05)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
              title="User Account & Quick Settings"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowUserMenu((prev) => !prev);
                }
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  user.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : <User size={18} />
                )}
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                    {user.name}
                  </span>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : user.role === 'DOCTOR' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                    {user.role}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                  {user.patient?.healthId || user.doctor?.licenseNumber || user.email}
                </div>
              </div>
              <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </div>

            {/* Polished Dropdown Menu */}
            {showUserMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '240px',
                  background: 'white',
                  borderRadius: '14px',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
                  border: '1px solid var(--border-light)',
                  zIndex: 60,
                  overflow: 'hidden',
                  padding: '0.4rem',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.3rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Signed in as
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate && onNavigate('profile');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <User size={15} color="#0284c7" />
                  <span>Profile & Settings</span>
                </button>

                {user.role === 'PATIENT' && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate && onNavigate('card');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <CreditCard size={15} color="#0284c7" />
                    <span>Smart Health Card</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleOpenNotifications();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Bell size={15} color="#0284c7" />
                  <span>Notifications</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate && onNavigate('profile');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ShieldCheck size={15} color="#0284c7" />
                  <span>Security & Privacy</span>
                </button>

                <div style={{ borderTop: '1px solid #f1f5f9', margin: '0.3rem 0' }} />

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#ef4444',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={15} color="#ef4444" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
