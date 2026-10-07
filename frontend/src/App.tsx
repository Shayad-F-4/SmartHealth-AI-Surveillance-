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
const UserProfilePage = lazy(() => import('./pages/profile/UserProfilePage').then(m => ({ default: m.UserProfilePage })));

// Doctor Pages
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const DoctorPatientsPage = lazy(() => import('./pages/doctor/DoctorPatientsPage').then(m => ({ default: m.DoctorPatientsPage })));
const DoctorReferralsPage = lazy(() => import('./pages/doctor/DoctorReferralsPage').then(m => ({ default: m.DoctorReferralsPage })));
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

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={(t) => setCurrentTab(t)} />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
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
