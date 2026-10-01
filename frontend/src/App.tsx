import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { EmergencyProfilePage } from './pages/public/EmergencyProfilePage';

// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { SmartHealthCard } from './components/SmartHealthCard';
import { MedicalRecordsPage } from './pages/patient/MedicalRecordsPage';
import { SurveillancePage } from './pages/patient/SurveillancePage';
import { FamilyTree } from './components/FamilyTree';
import { LabReportsPage } from './pages/patient/LabReportsPage';
import { PrescriptionsPage } from './pages/patient/PrescriptionsPage';
import { HealthTrendsPage } from './pages/patient/HealthTrendsPage';
import { AIRiskPage } from './pages/patient/AIRiskPage';
import { ReferralsPage } from './pages/patient/ReferralsPage';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage';
import { DoctorReferralsPage } from './pages/doctor/DoctorReferralsPage';
import { LeafletDiseaseMap } from './components/LeafletDiseaseMap';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DiseaseSurveillanceCenter } from './pages/admin/DiseaseSurveillanceCenter';
import { AlertsPage } from './pages/admin/AlertsPage';
import { HealthCampsPage } from './pages/admin/HealthCampsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

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

  // Public Unauthenticated Pages
  if (!isAuthenticated) {
    if (currentTab === 'login') {
      return <LoginPage onNavigate={(p) => setCurrentTab(p)} />;
    }
    if (currentTab === 'register') {
      return <RegisterPage onNavigate={(p) => setCurrentTab(p)} />;
    }
    if (currentTab === 'emergency-view') {
      return (
        <EmergencyProfilePage
          healthId={selectedEmergencyHealthId}
          onBack={() => setCurrentTab('landing')}
        />
      );
    }
    return (
      <LandingPage
        onNavigate={(p) => setCurrentTab(p)}
        onSelectHealthId={(id) => setSelectedEmergencyHealthId(id)}
      />
    );
  }

  // Handle emergency lookup from inside navbar
  if (currentTab === 'emergency-view') {
    return (
      <EmergencyProfilePage
        healthId={selectedEmergencyHealthId}
        onBack={() => {
          if (user?.role === 'ADMIN') setCurrentTab('admin-dashboard');
          else if (user?.role === 'DOCTOR') setCurrentTab('doctor-dashboard');
          else setCurrentTab('dashboard');
        }}
      />
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
            if (action === 'emergency-lookup') {
              const hid = prompt('Enter Smart Health ID to lookup emergency profile (e.g. SHC-2026-000001):', 'SHC-2026-000001');
              if (hid) {
                setSelectedEmergencyHealthId(hid.trim());
                setCurrentTab('emergency-view');
              }
            }
          }}
        />

        <main className="page-body">
          {/* ===============================================================
              1. PATIENT PORTAL VIEWS
              =============================================================== */}
          {user?.role === 'PATIENT' && (
            <>
              {currentTab === 'dashboard' && <PatientDashboard onNavigate={(t) => setCurrentTab(t)} />}
              {currentTab === 'card' && cardData && <SmartHealthCard cardData={cardData} />}
              {currentTab === 'records' && <MedicalRecordsPage initialSection="records" />}
              {currentTab === 'timeline' && <MedicalRecordsPage initialSection="timeline" />}
              {currentTab === 'episodes' && <MedicalRecordsPage initialSection="episodes" />}
              {currentTab === 'trends' && <HealthTrendsPage />}
              {currentTab === 'ai-risk' && <AIRiskPage />}
              {currentTab === 'family' && familyData && (
                <FamilyTree
                  treeData={familyData}
                  onRefresh={async () => {
                    const res = await api.get('/family/tree');
                    setFamilyData(res.data);
                  }}
                />
              )}
              {currentTab === 'prescriptions' && <PrescriptionsPage />}
              {currentTab === 'labs' && <LabReportsPage />}
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
            </>
          )}
        </main>
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
