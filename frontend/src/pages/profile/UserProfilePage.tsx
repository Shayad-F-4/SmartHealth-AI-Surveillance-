import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { PersonalInformationCard } from '../../components/profile/PersonalInformationCard';
import { EmergencyInformationCard } from '../../components/profile/EmergencyInformationCard';
import { SmartHealthCardPreview } from '../../components/profile/SmartHealthCardPreview';
import { IdentityDocumentsCard } from '../../components/profile/IdentityDocumentsCard';
import { DoctorCredentialsCard } from '../../components/profile/DoctorCredentialsCard';
import { MedicalInformationCard } from '../../components/profile/MedicalInformationCard';
import { NotificationPreferencesCard } from '../../components/profile/NotificationPreferencesCard';
import { SecurityPrivacyCard } from '../../components/profile/SecurityPrivacyCard';
import { DoctorProfessionalCard } from '../../components/profile/DoctorProfessionalCard';
import { DoctorAvailabilityCard } from '../../components/profile/DoctorAvailabilityCard';
import { AdminRoleAccessCard } from '../../components/profile/AdminRoleAccessCard';
import { ProfileEditModal } from '../../components/profile/ProfileEditModal';
import { EmergencyContactModal } from '../../components/profile/EmergencyContactModal';
import api from '../../services/api';

interface UserProfilePageProps {
  onNavigate?: (tab: string) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const role = (user?.role || 'PATIENT').toUpperCase() as 'PATIENT' | 'DOCTOR' | 'ADMIN';

  // Active tab state depending on role
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [patientData, setPatientData] = useState<any>(null);
  const [doctorData, setDoctorData] = useState<any>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Notifications
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfileData = async () => {
    try {
      if (role === 'PATIENT') {
        const res = await api.get('/patients/profile');
        setPatientData(res.data.data || res.data);
      } else if (role === 'DOCTOR') {
        const res = await api.get('/doctors/profile');
        setDoctorData(res.data.data || res.data);
      }
    } catch (err) {
      console.error('Error fetching profile details:', err);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [role]);

  const handleSaveProfile = async (formData: any) => {
    try {
      // 1. Update basic user details
      await api.put('/auth/me', {
        name: formData.name,
        phone: formData.phone
      });

      // 2. Role specific backend updates
      if (role === 'PATIENT') {
        await api.put('/patients/profile', {
          bloodGroup: formData.bloodGroup
        }).catch(() => {});
      } else if (role === 'DOCTOR') {
        await api.put('/doctors/profile', {
          specialty: formData.specialization,
          qualification: formData.qualification,
          experienceYears: formData.experience
        }).catch(() => {});
      }

      await refreshUser();
      setNotificationMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setNotificationMsg(null), 4000);
      await fetchProfileData();
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save changes.' });
      setTimeout(() => setNotificationMsg(null), 5000);
      throw err;
    }
  };

  const handleSaveEmergencyContact = async (emergencyData: any) => {
    try {
      await api.put('/patients/profile', {
        emergencyContactName: emergencyData.primaryName,
        emergencyContactPhone: emergencyData.primaryPhone
      });

      await refreshUser();
      setNotificationMsg({ type: 'success', text: 'Emergency contacts synchronized with Smart Health Card!' });
      setTimeout(() => setNotificationMsg(null), 4000);
      await fetchProfileData();
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save emergency contact.' });
      setTimeout(() => setNotificationMsg(null), 5000);
      throw err;
    }
  };

  // Define tabs per role
  const patientTabs = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'emergency', label: 'Emergency Information' },
    { id: 'medical', label: 'Medical Information' },
    { id: 'notifications', label: 'Notification Preferences' },
    { id: 'security', label: 'Security & Privacy' }
  ];

  const doctorTabs = [
    { id: 'personal', label: 'Profile' },
    { id: 'professional', label: 'Professional Details' },
    { id: 'hospital', label: 'Hospital & Department' },
    { id: 'availability', label: 'Availability' },
    { id: 'credentials', label: 'Identity & Credentials' },
    { id: 'notifications', label: 'Notification Preferences' },
    { id: 'security', label: 'Security' }
  ];

  const adminTabs = [
    { id: 'personal', label: 'Profile' },
    { id: 'roleaccess', label: 'Role & Access' },
    { id: 'account', label: 'Account Settings' },
    { id: 'notifications', label: 'Notification Preferences' },
    { id: 'security', label: 'Security & Access' }
  ];

  const currentTabs = role === 'PATIENT' ? patientTabs : role === 'DOCTOR' ? doctorTabs : adminTabs;

  // Extract display information safely from DB context
  const displayName = user?.name || (role === 'DOCTOR' ? 'Dr. Rajesh Sharma' : role === 'ADMIN' ? 'System Admin' : 'Rahul Verma');
  const bloodGroup = patientData?.bloodGroup || user?.patient?.bloodGroup || 'B+';
  const emergencyPhone = patientData?.emergencyContactPhone || user?.patient?.emergencyContactPhone || '+91 98765 43210';
  const emergencyName = patientData?.emergencyContactName || user?.patient?.emergencyContactName || 'Amit Verma';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 50,
            padding: '12px 18px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            border: `1px solid ${notificationMsg.type === 'success' ? '#047857' : '#be123c'}`,
            background: notificationMsg.type === 'success' ? '#064e3b' : '#881337',
            color: notificationMsg.type === 'success' ? '#ecfdf5' : '#fff1f2',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Modern Cover Header */}
      <ProfileHeader
        user={user}
        onEditClick={() => setIsEditModalOpen(true)}
        onViewCardClick={role === 'PATIENT' ? () => onNavigate && onNavigate('card') : undefined}
      />

      {/* Main Content Area */}
      <div style={{ maxWidth: '1280px', margin: '1.5rem auto 0 auto', padding: '0 1rem' }}>
        {/* Navigation Tabs Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '6px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 'max-content' }}>
            {currentTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: 12,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive
                      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                    boxShadow: isActive ? '0 2px 8px rgba(15, 23, 42, 0.2)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panes with smooth animation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* TAB: Personal Information */}
          {activeTab === 'personal' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div style={{ minWidth: 0 }}>
                <PersonalInformationCard
                  user={user}
                  onEdit={() => setIsEditModalOpen(true)}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                {role === 'PATIENT' ? (
                  <SmartHealthCardPreview
                    user={user}
                    onViewFullCard={() => onNavigate && onNavigate('card')}
                    onEditEmergency={() => setIsEmergencyModalOpen(true)}
                  />
                ) : role === 'DOCTOR' ? (
                  <DoctorProfessionalCard
                    doctor={user?.doctor || doctorData}
                    onEdit={() => setIsEditModalOpen(true)}
                  />
                ) : (
                  <AdminRoleAccessCard
                    roleName="Administrator"
                    department="IT & System Management"
                    organization="SmartHealth Platform"
                    accessLevel="Full Access (Super Admin)"
                    accountStatus="ACTIVE"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB: Emergency Information (Patient) */}
          {activeTab === 'emergency' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div style={{ minWidth: 0 }}>
                <EmergencyInformationCard
                  patient={user?.patient || patientData}
                  onEdit={() => setIsEmergencyModalOpen(true)}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <SmartHealthCardPreview
                  user={user}
                  onViewFullCard={() => onNavigate && onNavigate('card')}
                  onEditEmergency={() => setIsEmergencyModalOpen(true)}
                />
              </div>
            </div>
          )}

          {/* TAB: Medical Information (Patient) */}
          {activeTab === 'medical' && (
            <MedicalInformationCard
              patient={user?.patient || patientData}
              onNavigateToRecords={() => onNavigate && onNavigate('records')}
            />
          )}

          {/* TAB: Identity & Documents (Patient) */}
          {activeTab === 'identity' && role === 'PATIENT' && (
            <IdentityDocumentsCard />
          )}

          {/* TAB: Identity & Credentials (Doctor) */}
          {activeTab === 'credentials' && role === 'DOCTOR' && (
            <DoctorCredentialsCard />
          )}

          {/* TAB: Professional Details (Doctor) */}
          {activeTab === 'professional' && (
            <DoctorProfessionalCard
              doctor={user?.doctor || doctorData}
              onEdit={() => setIsEditModalOpen(true)}
            />
          )}

          {/* TAB: Hospital & Department (Doctor) */}
          {activeTab === 'hospital' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <DoctorProfessionalCard
                doctor={user?.doctor || doctorData}
                onEdit={() => setIsEditModalOpen(true)}
              />
              <DoctorAvailabilityCard onEdit={() => setIsEditModalOpen(true)} />
            </div>
          )}

          {/* TAB: Availability (Doctor) */}
          {activeTab === 'availability' && (
            <DoctorAvailabilityCard onEdit={() => setIsEditModalOpen(true)} />
          )}

          {/* TAB: Role & Access (Admin) */}
          {activeTab === 'roleaccess' && (
            <AdminRoleAccessCard
              roleName="Administrator"
              department="IT & System Management"
              organization="SmartHealth Platform"
              accessLevel="Full Access (Super Admin)"
              accountStatus="ACTIVE"
            />
          )}

          {/* TAB: Account Settings (Admin) */}
          {activeTab === 'account' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <PersonalInformationCard
                user={user}
                onEdit={() => setIsEditModalOpen(true)}
              />
              <AdminRoleAccessCard
                roleName="Administrator"
                department="IT & System Management"
                organization="SmartHealth Platform"
                accessLevel="Full Access (Super Admin)"
                accountStatus="ACTIVE"
              />
            </div>
          )}

          {/* TAB: Notification Preferences (All Roles) */}
          {activeTab === 'notifications' && (
            <NotificationPreferencesCard userRole={role} />
          )}

          {/* TAB: Security & Privacy (All Roles) */}
          {activeTab === 'security' && (
            <SecurityPrivacyCard user={user} />
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        initialData={{
          name: displayName,
          phone: user?.phone || '+91 98765 43210',
          address: patientData?.address || user?.patient?.district || 'Riverside District, Pune, Maharashtra',
          preferredLanguage: 'English',
          bloodGroup: bloodGroup,
          specialization: doctorData?.specialization || user?.doctor?.specialty,
          qualification: doctorData?.qualification,
          experience: doctorData?.experience,
          hospitalName: doctorData?.hospitalName || user?.doctor?.hospital?.name,
          department: doctorData?.department
        }}
        role={role}
      />

      {/* Emergency Contact Modal */}
      <EmergencyContactModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSave={handleSaveEmergencyContact}
        initialData={{
          primaryName: emergencyName,
          primaryRelation: 'Father',
          primaryPhone: emergencyPhone,
          secondaryName: 'Neha Verma',
          secondaryRelation: 'Mother',
          secondaryPhone: '+91 87654 32109'
        }}
      />
    </div>
  );
};
