import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

import * as authCtrl from '../controllers/authController';
import * as patientCtrl from '../controllers/patientController';
import * as doctorCtrl from '../controllers/doctorController';
import * as visitCtrl from '../controllers/visitController';
import * as labCtrl from '../controllers/labController';
import * as presCtrl from '../controllers/prescriptionController';
import * as familyCtrl from '../controllers/familyController';
import * as refCtrl from '../controllers/referralController';
import * as survCtrl from '../controllers/surveillanceController';
import * as alertCtrl from '../controllers/alertController';
import * as campCtrl from '../controllers/campController';
import * as notifCtrl from '../controllers/notificationController';
import * as auditCtrl from '../controllers/auditController';
import * as emergCtrl from '../controllers/emergencyController';
import * as analyticsCtrl from '../controllers/analyticsController';

const router = Router();

// --- Public Emergency Health Profile Route ---
router.get('/emergency/:healthId', emergCtrl.getEmergencyProfile);

// --- Auth Routes ---
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);

// --- Patient Routes ---
router.get('/patients/profile', authenticate, patientCtrl.getPatientProfile);
router.get('/patients/profile/:id', authenticate, patientCtrl.getPatientProfile);
router.put('/patients/profile', authenticate, patientCtrl.updatePatientProfile);
router.get('/patients/card', authenticate, patientCtrl.getSmartHealthCard);
router.get('/patients/card/:id', authenticate, patientCtrl.getSmartHealthCard);
router.get('/patients/timeline', authenticate, patientCtrl.getMedicalTimeline);
router.get('/patients/timeline/:id', authenticate, patientCtrl.getMedicalTimeline);
router.get('/patients/episodes', authenticate, patientCtrl.getDiseaseEpisodes);
router.get('/patients/episodes/:id', authenticate, patientCtrl.getDiseaseEpisodes);
router.get('/patients/analytics', authenticate, patientCtrl.getPersonalAnalytics);
router.get('/patients/analytics/:id', authenticate, patientCtrl.getPersonalAnalytics);
router.get('/patients/risk', authenticate, patientCtrl.getAIHealthRisk);
router.get('/patients/risk/:id', authenticate, patientCtrl.getAIHealthRisk);

// --- Doctor Routes ---
router.get('/doctors/dashboard', authenticate, authorize(['DOCTOR']), doctorCtrl.getDoctorDashboard);
router.get('/doctors/patients', authenticate, authorize(['DOCTOR', 'ADMIN']), doctorCtrl.searchPatients);
router.get('/doctors/patients/:patientId/full-history', authenticate, authorize(['DOCTOR', 'ADMIN']), doctorCtrl.getPatientFullHistory);

// --- Visit & Medical Record Routes ---
router.post('/visits', authenticate, authorize(['DOCTOR']), visitCtrl.createVisit);
router.get('/visits/:id', authenticate, visitCtrl.getVisitById);

// --- Lab Routes ---
router.post('/labs', authenticate, authorize(['DOCTOR', 'ADMIN']), labCtrl.createLabReport);
router.get('/labs', authenticate, labCtrl.getPatientLabReports);
router.get('/labs/patient/:patientId', authenticate, labCtrl.getPatientLabReports);

// --- Prescription Routes ---
router.post('/prescriptions', authenticate, authorize(['DOCTOR']), presCtrl.createPrescription);
router.get('/prescriptions', authenticate, presCtrl.getPatientPrescriptions);
router.get('/prescriptions/patient/:patientId', authenticate, presCtrl.getPatientPrescriptions);

// --- Family Health Tree Routes ---
router.get('/family/tree', authenticate, familyCtrl.getFamilyTree);
router.get('/family/tree/:patientId', authenticate, familyCtrl.getFamilyTree);
router.post('/family/member', authenticate, familyCtrl.addFamilyMember);
router.delete('/family/member/:id', authenticate, familyCtrl.deleteFamilyMember);

// --- Referral Routes ---
router.post('/referrals', authenticate, authorize(['DOCTOR']), refCtrl.createReferral);
router.get('/referrals', authenticate, refCtrl.getPatientReferrals);
router.get('/referrals/patient/:patientId', authenticate, refCtrl.getPatientReferrals);
router.put('/referrals/:id/status', authenticate, authorize(['DOCTOR']), refCtrl.updateReferralStatus);

// --- Surveillance & Analytics Routes ---
router.get('/surveillance/overview', authenticate, survCtrl.getOverview);
router.get('/surveillance/hotspots', authenticate, survCtrl.getHotspots);
router.get('/surveillance/forecast', authenticate, survCtrl.getForecast);
router.get('/surveillance/map-data', authenticate, survCtrl.getMapData);
router.get('/surveillance/insights', authenticate, survCtrl.getAdminInsights);
router.get('/surveillance/analytics', authenticate, authorize(['ADMIN']), analyticsCtrl.getPopulationAnalytics);

// --- Community Alert Routes ---
router.get('/alerts', alertCtrl.getActiveAlerts);
router.get('/alerts/history', authenticate, alertCtrl.getAlertHistory);
router.post('/alerts', authenticate, authorize(['ADMIN']), alertCtrl.createManualAlert);
router.put('/alerts/:id/status', authenticate, authorize(['ADMIN']), alertCtrl.toggleAlertStatus);

// --- Health Camp Routes ---
router.get('/camps', authenticate, campCtrl.getHealthCamps);
router.post('/camps', authenticate, authorize(['ADMIN']), campCtrl.createHealthCamp);
router.put('/camps/:id/status', authenticate, authorize(['ADMIN']), campCtrl.updateCampStatus);
router.post('/camps/:id/screenings', authenticate, authorize(['DOCTOR', 'ADMIN']), campCtrl.recordScreening);

// --- Notification Routes ---
router.get('/notifications', authenticate, notifCtrl.getUserNotifications);
router.put('/notifications/:id/read', authenticate, notifCtrl.markNotificationAsRead);
router.put('/notifications/read-all', authenticate, notifCtrl.markAllNotificationsAsRead);

// --- Audit Log Routes ---
router.get('/audit', authenticate, authorize(['ADMIN']), auditCtrl.getAuditLogs);

export default router;
