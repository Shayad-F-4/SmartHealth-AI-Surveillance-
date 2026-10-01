import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  CreditCard,
  FileText,
  TrendingUp,
  Brain,
  Pill,
  GitFork,
  ShieldCheck,
  Eye,
  TestTube,
  Users,
  Compass,
  MapPin,
  Flame,
  LineChart,
  BarChart2,
  AlertTriangle,
  Tent,
  History,
  ChevronDown,
  ChevronRight,
  Stethoscope,
  Building2,
  HeartPulse,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const [surveillanceOpen, setSurveillanceOpen] = useState(true);

  if (!user) return null;

  const role = user.role;

  // Determine if current tab is a disease surveillance subsection
  const isSurveillanceActive =
    currentTab === 'disease-surveillance' ||
    currentTab.startsWith('disease-surveillance-') ||
    ['surveillance-overview', 'surveillance-map', 'hotspots', 'forecast', 'analytics', 'insights'].includes(currentTab);

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="sidebar-brand-wrapper">
          <div className="sidebar-brand-icon">
            <HeartPulse size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div className="sidebar-brand-info">
            <div className="sidebar-brand-title">
              <span>Smart</span>Health
            </div>
            <div className="sidebar-brand-subtitle">
              Clinical &amp; Surveillance
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* =================================================================
            1. PATIENT NAVIGATION
            ================================================================= */}
        {role === 'PATIENT' && (
          <>
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Patient Portal
            </div>

            <div className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => onSelectTab('dashboard')}>
              <Activity size={18} /> Overview
            </div>

            <div className={`nav-item ${currentTab === 'card' ? 'active' : ''}`} onClick={() => onSelectTab('card')}>
              <CreditCard size={18} /> Smart Health Card
            </div>

            <div className={`nav-item ${currentTab === 'records' || currentTab === 'timeline' || currentTab === 'episodes' ? 'active' : ''}`} onClick={() => onSelectTab('records')}>
              <FileText size={18} /> Medical Records
            </div>

            <div className={`nav-item ${currentTab === 'trends' ? 'active' : ''}`} onClick={() => onSelectTab('trends')}>
              <TrendingUp size={18} /> Health Trends
            </div>

            <div className={`nav-item ${currentTab === 'ai-risk' ? 'active' : ''}`} onClick={() => onSelectTab('ai-risk')}>
              <Brain size={18} /> AI Health Risk
            </div>

            <div className={`nav-item ${currentTab === 'family' ? 'active' : ''}`} onClick={() => onSelectTab('family')}>
              <GitFork size={18} /> Family Health
            </div>

            <div className={`nav-item ${currentTab === 'prescriptions' ? 'active' : ''}`} onClick={() => onSelectTab('prescriptions')}>
              <Pill size={18} /> Prescriptions
            </div>

            <div className={`nav-item ${currentTab === 'labs' ? 'active' : ''}`} onClick={() => onSelectTab('labs')}>
              <TestTube size={18} /> Lab Reports
            </div>

            <div className={`nav-item ${currentTab === 'referrals' ? 'active' : ''}`} onClick={() => onSelectTab('referrals')}>
              <ShieldCheck size={18} /> Specialist Referrals
            </div>

            <div className={`nav-item ${currentTab === 'surveillance' ? 'active' : ''}`} onClick={() => onSelectTab('surveillance')}>
              <Eye size={18} /> Disease Surveillance
            </div>
          </>
        )}

        {/* =================================================================
            2. DOCTOR NAVIGATION
            ================================================================= */}
        {role === 'DOCTOR' && (
          <>
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clinical Workflow
            </div>

            <div className={`nav-item ${currentTab === 'doctor-dashboard' ? 'active' : ''}`} onClick={() => onSelectTab('doctor-dashboard')}>
              <Activity size={18} /> Dashboard
            </div>

            <div className={`nav-item ${currentTab === 'patients' || currentTab === 'patient-search' || currentTab === 'add-visit' ? 'active' : ''}`} onClick={() => onSelectTab('patients')}>
              <Users size={18} /> Patients
            </div>

            <div className={`nav-item ${currentTab === 'doctor-referrals' ? 'active' : ''}`} onClick={() => onSelectTab('doctor-referrals')}>
              <ShieldCheck size={18} /> Referrals
            </div>

            <div className={`nav-item ${currentTab === 'surveillance-map' ? 'active' : ''}`} onClick={() => onSelectTab('surveillance-map')}>
              <MapPin size={18} /> Disease Map
            </div>
          </>
        )}

        {/* =================================================================
            3. ADMIN / PUBLIC HEALTH NAVIGATION
            ================================================================= */}
        {role === 'ADMIN' && (
          <>
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Administration
            </div>

            <div className={`nav-item ${currentTab === 'admin-dashboard' ? 'active' : ''}`} onClick={() => onSelectTab('admin-dashboard')}>
              <Building2 size={18} /> Dashboard
            </div>

            {/* Disease Surveillance Expandable Group */}
            <div
              className={`nav-item ${isSurveillanceActive ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => {
                onSelectTab('disease-surveillance');
                setSurveillanceOpen(true);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Compass size={18} /> Disease Surveillance
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSurveillanceOpen(!surveillanceOpen);
                }}
                style={{ cursor: 'pointer', padding: '0.2rem' }}
              >
                {surveillanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </div>

            {/* Surveillance Submenu */}
            {surveillanceOpen && (
              <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div
                  className={`nav-item ${currentTab === 'disease-surveillance' || currentTab === 'disease-surveillance-overview' ? 'active' : ''}`}
                  onClick={() => onSelectTab('disease-surveillance-overview')}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                >
                  <BarChart2 size={15} /> Overview
                </div>
                <div
                  className={`nav-item ${currentTab === 'disease-surveillance-map' || currentTab === 'surveillance-map' ? 'active' : ''}`}
                  onClick={() => onSelectTab('disease-surveillance-map')}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                >
                  <MapPin size={15} /> Map
                </div>
                <div
                  className={`nav-item ${currentTab === 'disease-surveillance-hotspots' || currentTab === 'hotspots' ? 'active' : ''}`}
                  onClick={() => onSelectTab('disease-surveillance-hotspots')}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                >
                  <Flame size={15} /> Hotspots
                </div>
                <div
                  className={`nav-item ${currentTab === 'disease-surveillance-forecast' || currentTab === 'forecast' ? 'active' : ''}`}
                  onClick={() => onSelectTab('disease-surveillance-forecast')}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                >
                  <LineChart size={15} /> Forecast
                </div>
                <div
                  className={`nav-item ${currentTab === 'disease-surveillance-analytics' || currentTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => onSelectTab('disease-surveillance-analytics')}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                >
                  <TrendingUp size={15} /> Analytics
                </div>
                <div
                  className={`nav-item ${currentTab === 'disease-surveillance-insights' || currentTab === 'insights' ? 'active' : ''}`}
                  onClick={() => onSelectTab('disease-surveillance-insights')}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                >
                  <Brain size={15} /> AI Insights
                </div>
              </div>
            )}

            <div className={`nav-item ${currentTab === 'alerts' ? 'active' : ''}`} onClick={() => onSelectTab('alerts')}>
              <AlertTriangle size={18} /> Community Alerts
            </div>

            <div className={`nav-item ${currentTab === 'health-camps' ? 'active' : ''}`} onClick={() => onSelectTab('health-camps')}>
              <Tent size={18} /> Health Camps
            </div>

            <div className={`nav-item ${currentTab === 'audit-logs' ? 'active' : ''}`} onClick={() => onSelectTab('audit-logs')}>
              <History size={18} /> Audit Logs
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-dot"></span>
          <span>System Online &bull; v2.0</span>
        </div>
        <div className="system-tech-badge">
          PostgreSQL 16 &bull; ML Engine
        </div>
      </div>
    </aside>
  );
};
