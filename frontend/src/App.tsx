import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/public/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage').then(m => ({ default: m.RegisterPage })));
const EmergencyProfilePage = lazy(() => import('./pages/public/EmergencyProfilePage').then(m => ({ default: m.EmergencyProfilePage })));

// Patient Pages
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard').then(m => ({ default: m.PatientDashboard })));
const SmartHealthCard = lazy(() => import('./components/SmartHealthCard').then(m => ({ default: m.SmartHealthCard })));
const MedicalRecordsPage = lazy(() => import('./pages/patient/MedicalRecordsPage').then(m => ({ default: m.MedicalRecordsPage })));
const SurveillancePage = lazy(() => import('./pages/patient/SurveillancePage').then(m => ({ default: m.SurveillancePage })));
const FamilyTree = lazy(() => import('./components/FamilyTree').then(m => ({ default: m.FamilyTree })));
const LabReportsPage = lazy(() => import('./pages/patient/LabReportsPage').then(m => ({ default: m.LabReportsPage })));
const PrescriptionsPage = lazy(() => import('./pages/patient/PrescriptionsPage').then(m => ({ default: m.PrescriptionsPage })));
const HealthTrendsPage = lazy(() => import('./pages/patient/HealthTrendsPage').then(m => ({ default: m.HealthTrendsPage })));
const AIRiskPage = lazy(() => import('./pages/patient/AIRiskPage').then(m => ({ default: m.AIRiskPage })));
const HealthInsightsPage = lazy(() => import('./pages/patient/HealthInsightsPage').then(m => ({ default: m.HealthInsightsPage })));
const AIAssistantPage = lazy(() => import('./pages/patient/AIAssistantPage').then(m => ({ default: m.AIAssistantPage })));
const ReferralsPage = lazy(() => import('./pages/patient/ReferralsPage').then(m => ({ default: m.ReferralsPage })));
const PatientAppointmentsPage = lazy(() => import('./pages/patient/PatientAppointmentsPage').then(m => ({ default: m.PatientAppointmentsPage })));
const UserProfilePage = lazy(() => import('./pages/profile/UserProfilePage').then(m => ({ default: m.UserProfilePage })));

// Doctor Pages
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const DoctorPatientsPage = lazy(() => import('./pages/doctor/DoctorPatientsPage').then(m => ({ default: m.DoctorPatientsPage })));
const DoctorReferralsPage = lazy(() => import('./pages/doctor/DoctorReferralsPage').then(m => ({ default: m.DoctorReferralsPage })));
const DoctorAppointmentsPage = lazy(() => import('./pages/doctor/DoctorAppointmentsPage').then(m => ({ default: m.DoctorAppointmentsPage })));
const LeafletDiseaseMap = lazy(() => import('./components/LeafletDiseaseMap').then(m => ({ default: m.LeafletDiseaseMap })));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const DiseaseSurveillanceCenter = lazy(() => import('./pages/admin/DiseaseSurveillanceCenter').then(m => ({ default: m.DiseaseSurveillanceCenter })));
const AlertsPage = lazy(() => import('./pages/admin/AlertsPage').then(m => ({ default: m.AlertsPage })));
const HealthCampsPage = lazy(() => import('./pages/admin/HealthCampsPage').then(m => ({ default: m.HealthCampsPage })));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const VerificationCenterPage = lazy(() => import('./pages/admin/VerificationCenterPage').then(m => ({ default: m.VerificationCenterPage })));

import api from './services/api';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedEmergencyHealthId, setSelectedEmergencyHealthId] = useState<string>('SHC-2026-000001');
  const [consultationPatient, setConsultationPatient] = useState<any>(null);

  // Patient Card & Family data cache
  const [cardData, setCardData] = useState<any>(null);
  const [familyData, setFamilyData] = useState<any>(null);

  // Set default portal landing tab on authentication
  useEffect(() => {
    // Check URL for emergency path e.g. /emergency/SHC-2026-000001
    const pathname = window.location.pathname;
    if (pathname.startsWith('/emergency/')) {
      const hid = pathname.split('/emergency/')[1];
      if (hid) {
        setSelectedEmergencyHealthId(hid);
        setCurrentTab('emergency-view');
        return;
      }
    }

    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') setCurrentTab('admin-dashboard');
      else if (user.role === 'DOCTOR') setCurrentTab('doctor-dashboard');
      else setCurrentTab('dashboard');
    } else {
      if (currentTab !== 'login' && currentTab !== 'register' && currentTab !== 'emergency-view') {
        setCurrentTab('landing');
      }
    }
  }, [isAuthenticated, user]);

  // Load Patient card & family tree if user is patient
  useEffect(() => {
    const loadPatientDetails = async () => {
      if (user?.role === 'PATIENT') {
        try {
          const [cardRes, famRes] = await Promise.allSettled([
            api.get('/patients/card'),
            api.get('/family/tree'),
          ]);
          if (cardRes.status === 'fulfilled') setCardData(cardRes.value.data);
          if (famRes.status === 'fulfilled') setFamilyData(famRes.value.data);
        } catch {
          // ignore
        }
      }
    };

    loadPatientDetails();
  }, [user]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: 'var(--text-muted)' }}>
        <div>Initializing Smart Healthcare System...</div>
      </div>
    );
  }

  // Loading fallback for lazy-loaded components
  const LoadingFallback = () => (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: 'var(--text-muted)' }}>
      <div>Loading...</div>
    </div>
  );

  // Public Unauthenticated Pages
  if (!isAuthenticated) {
    if (currentTab === 'login') {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <LoginPage onNavigate={(p) => setCurrentTab(p)} />
        </Suspense>
      );
    }
    if (currentTab === 'register') {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <RegisterPage onNavigate={(p) => setCurrentTab(p)} />
        </Suspense>
      );
    }
    if (currentTab === 'emergency-view') {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <EmergencyProfilePage
            healthId={selectedEmergencyHealthId}
            onBack={() => setCurrentTab('landing')}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LandingPage
          onNavigate={(p) => setCurrentTab(p)}
          onSelectHealthId={(id) => setSelectedEmergencyHealthId(id)}
        />
      </Suspense>
    );
  }

  // Handle emergency lookup from inside navbar
  if (currentTab === 'emergency-view') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <EmergencyProfilePage
          healthId={selectedEmergencyHealthId}
          onBack={() => {
            if (user?.role === 'ADMIN') setCurrentTab('admin-dashboard');
            else if (user?.role === 'DOCTOR') setCurrentTab('doctor-dashboard');
            else setCurrentTab('dashboard');
          }}
        />
      </Suspense>
    );
  }

  const getHomeTab = () => {
    if (user?.role === 'ADMIN') return 'admin-dashboard';
    if (user?.role === 'DOCTOR') return 'doctor-dashboard';
    return 'dashboard';
  };

  const getSecondaryTab = () => {
    if (user?.role === 'ADMIN') return 'disease-surveillance-center';
    if (user?.role === 'DOCTOR') return 'patients';
    return 'records';
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={(t) => setCurrentTab(t)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
          onNavigate={(action) => {
            if (action === 'profile') {
              setCurrentTab('profile');
            } else if (action === 'emergency-lookup') {
              const hid = prompt('Enter Smart Health ID to lookup emergency profile (e.g. SHC-2026-000001):', 'SHC-2026-000001');
              if (hid) {
                setSelectedEmergencyHealthId(hid.trim());
                setCurrentTab('emergency-view');
              }
            }
          }}
        />

        <Suspense fallback={<LoadingFallback />}>
          <main className="page-body">
            {/* Unified Profile Page accessible across all roles */}
            {currentTab === 'profile' && <UserProfilePage onNavigate={(t) => setCurrentTab(t)} />}
          {/* ===============================================================
              1. PATIENT PORTAL VIEWS
              =============================================================== */}
          {user?.role === 'PATIENT' && (
            <>
              {currentTab === 'dashboard' && <PatientDashboard onNavigate={(t) => setCurrentTab(t)} />}
              {currentTab === 'card' && cardData && <SmartHealthCard cardData={cardData} />}
              {currentTab === 'records' && <MedicalRecordsPage initialSection="records" onNavigate={(t) => setCurrentTab(t)} />}
              {currentTab === 'timeline' && <MedicalRecordsPage initialSection="timeline" onNavigate={(t) => setCurrentTab(t)} />}
              {currentTab === 'episodes' && <MedicalRecordsPage initialSection="records" onNavigate={(t) => setCurrentTab(t)} />}
              {currentTab === 'health-insights' && (
                <HealthInsightsPage
                  initialTab="trends"
                  onNavigateToRecord={() => setCurrentTab('records')}
                />
              )}
              {currentTab === 'trends' && (
                <HealthInsightsPage
                  initialTab="trends"
                  onNavigateToRecord={() => setCurrentTab('records')}
                />
              )}
              {currentTab === 'ai-risk' && (
                <HealthInsightsPage
                  initialTab="ai-risk"
                  onNavigateToRecord={() => setCurrentTab('records')}
                />
              )}
              {currentTab === 'ai-assistant' && <AIAssistantPage onNavigateTab={(t) => setCurrentTab(t)} />}
              {currentTab === 'family' && familyData && (
                <FamilyTree
                  treeData={familyData}
                  onRefresh={async () => {
                    const res = await api.get('/family/tree');
                    setFamilyData(res.data);
                  }}
                />
              )}
              {currentTab === 'prescriptions' && (
                <MedicalRecordsPage
                  initialSection="records"
                  initialCategory="Prescriptions"
                  onNavigate={(t) => setCurrentTab(t)}
                />
              )}
              {currentTab === 'labs' && (
                <MedicalRecordsPage
                  initialSection="records"
                  initialCategory="Lab Reports"
                  onNavigate={(t) => setCurrentTab(t)}
                />
              )}
              {currentTab === 'referrals' && <ReferralsPage />}
              {currentTab === 'appointments' && <PatientAppointmentsPage />}
              {currentTab === 'surveillance' && <SurveillancePage onNavigate={(t) => setCurrentTab(t)} />}
            </>
          )}

          {/* ===============================================================
              2. DOCTOR PORTAL VIEWS
              =============================================================== */}
          {user?.role === 'DOCTOR' && (
            <>
              {currentTab === 'doctor-dashboard' && <DoctorDashboard onNavigate={(t) => setCurrentTab(t)} />}
              {(currentTab === 'patients' || currentTab === 'patient-search' || currentTab === 'add-visit') && (
                <DoctorPatientsPage
                  initialPatient={consultationPatient}
                  initialMode={currentTab === 'add-visit' ? 'consultation' : 'view'}
                />
              )}
              {currentTab === 'doctor-referrals' && <DoctorReferralsPage />}
              {currentTab === 'doctor-appointments' && <DoctorAppointmentsPage />}
              {currentTab === 'surveillance-map' && <LeafletDiseaseMap />}
            </>
          )}

          {/* ===============================================================
              3. ADMIN PORTAL VIEWS
              =============================================================== */}
          {user?.role === 'ADMIN' && (
            <>
              {currentTab === 'admin-dashboard' && <AdminDashboard onNavigate={(t) => setCurrentTab(t)} />}

              {/* Disease Surveillance Command Center (with subtab routing) */}
              {(currentTab === 'disease-surveillance' || currentTab === 'disease-surveillance-overview') && (
                <DiseaseSurveillanceCenter initialTab="overview" onNavigate={(t) => setCurrentTab(t)} />
              )}
              {(currentTab === 'disease-surveillance-map' || currentTab === 'surveillance-map') && (
                <DiseaseSurveillanceCenter initialTab="map" onNavigate={(t) => setCurrentTab(t)} />
              )}
              {(currentTab === 'disease-surveillance-hotspots' || currentTab === 'hotspots') && (
                <DiseaseSurveillanceCenter initialTab="hotspots" onNavigate={(t) => setCurrentTab(t)} />
              )}
              {(currentTab === 'disease-surveillance-forecast' || currentTab === 'forecast') && (
                <DiseaseSurveillanceCenter initialTab="forecast" onNavigate={(t) => setCurrentTab(t)} />
              )}
              {(currentTab === 'disease-surveillance-analytics' || currentTab === 'analytics') && (
                <DiseaseSurveillanceCenter initialTab="analytics" onNavigate={(t) => setCurrentTab(t)} />
              )}
              {(currentTab === 'disease-surveillance-insights' || currentTab === 'insights') && (
                <DiseaseSurveillanceCenter initialTab="insights" onNavigate={(t) => setCurrentTab(t)} />
              )}

              {/* Standalone Administrative Modules */}
              {currentTab === 'alerts' && <AlertsPage />}
              {currentTab === 'health-camps' && <HealthCampsPage />}
              {currentTab === 'audit-logs' && <AuditLogsPage />}
              {currentTab === 'verification-center' && <VerificationCenterPage />}
            </>
          )}
          </main>
        </Suspense>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <nav className="mobile-bottom-nav no-print">
        <div className="mobile-bottom-nav-items">
          <button 
            className={`mobile-nav-btn ${currentTab === getHomeTab() ? 'active' : ''}`}
            onClick={() => setCurrentTab(getHomeTab())}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Home
          </button>
          <button 
            className={`mobile-nav-btn ${currentTab === getSecondaryTab() ? 'active' : ''}`}
            onClick={() => setCurrentTab(getSecondaryTab())}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {user?.role === 'ADMIN' ? 'Surveillance' : user?.role === 'DOCTOR' ? 'Patients' : 'Records'}
          </button>
          <button 
            className={`mobile-nav-btn ${currentTab === 'appointments' || currentTab === 'doctor-appointments' ? 'active' : ''}`}
            onClick={() => setCurrentTab(user?.role === 'DOCTOR' ? 'doctor-appointments' : 'appointments')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Appointments
          </button>
          <button 
            className={`mobile-nav-btn ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile
          </button>
        </div>
      </nav>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
