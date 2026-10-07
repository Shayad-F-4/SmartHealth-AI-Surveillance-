import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { loginRateLimiter, registerRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';
import { requirePatientAccess, requireDoctorAccess, requireDocumentAccess } from '../middleware/authorization';

import * as authCtrl from '../controllers/authController';
import * as patientCtrl from '../controllers/patientController';
import * as docCtrl from '../controllers/documentController';
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
import * as aiAssistantCtrl from '../controllers/aiAssistantController';
import * as knowledgeCtrl from '../controllers/knowledgeController';
import * as cdsCtrl from '../controllers/clinicalDecisionSupportController';
import * as identityDocCtrl from '../controllers/identityDocumentController';
import * as passwordResetCtrl from '../controllers/passwordResetController';
import * as securityCtrl from '../controllers/securityController';
import * as mfaCtrl from '../controllers/mfaController';
import * as sessionCtrl from '../controllers/sessionController';

const router = Router();

// --- Public Emergency Health Profile Route ---
router.get('/emergency/:healthId', emergCtrl.getEmergencyProfile);

// --- Auth Routes ---
router.post('/auth/register', registerRateLimiter, authCtrl.register);
router.post('/auth/login', loginRateLimiter, authCtrl.login);
router.post('/auth/logout', authenticate, authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.put('/auth/me', authenticate, authCtrl.updateMe);
router.post('/auth/avatar', authenticate, authCtrl.avatarUploadMiddleware, authCtrl.uploadAvatar);
router.post('/auth/password-reset/request', passwordResetRateLimiter, passwordResetCtrl.requestPasswordReset);
router.post('/auth/password-reset/reset', passwordResetCtrl.resetPassword);

// --- Security Routes ---
router.get('/security/settings', authenticate, securityCtrl.getSecuritySettings);
router.get('/security/login-history', authenticate, securityCtrl.getLoginHistory);
router.get('/security/login-history/:userId', authenticate, authorize(['ADMIN']), securityCtrl.getUserLoginHistory);

// --- Session Management Routes ---
router.get('/security/sessions', authenticate, sessionCtrl.getUserSessions);
router.post('/security/sessions/:sessionId/revoke', authenticate, sessionCtrl.revokeUserSession);
router.post('/security/sessions/revoke-all', authenticate, sessionCtrl.revokeAllOtherSessions);

// --- MFA Routes ---
router.post('/mfa/setup', authenticate, mfaCtrl.setupMFA);
router.post('/mfa/verify', authenticate, mfaCtrl.verifyAndEnableMFA);
router.post('/mfa/verify-login', authenticate, mfaCtrl.verifyMFALogin);
router.post('/mfa/disable', authenticate, mfaCtrl.disableMFA);
router.get('/mfa/status', authenticate, mfaCtrl.getMFAStatus);

// --- Patient Routes ---
router.get('/patients/profile', authenticate, patientCtrl.getPatientProfile);
router.get('/patients/profile/:id', authenticate, requirePatientAccess, patientCtrl.getPatientProfile);
router.put('/patients/profile', authenticate, patientCtrl.updatePatientProfile);
router.get('/patients/card', authenticate, patientCtrl.getSmartHealthCard);
router.get('/patients/card/:id', authenticate, requirePatientAccess, patientCtrl.getSmartHealthCard);
router.get('/patients/timeline', authenticate, patientCtrl.getMedicalTimeline);
router.get('/patients/timeline/:id', authenticate, requirePatientAccess, patientCtrl.getMedicalTimeline);
router.post('/patients/documents/upload', authenticate, docCtrl.documentUploadMiddleware, docCtrl.uploadAndAnalyzeDocument);
router.get('/patients/episodes', authenticate, patientCtrl.getDiseaseEpisodes);
router.get('/patients/episodes/:id', authenticate, requirePatientAccess, patientCtrl.getDiseaseEpisodes);
router.get('/patients/analytics', authenticate, patientCtrl.getPersonalAnalytics);
router.get('/patients/analytics/:id', authenticate, requirePatientAccess, patientCtrl.getPersonalAnalytics);
router.get('/patients/health-trends', authenticate, patientCtrl.getLongitudinalHealthTrends);
router.get('/patients/health-trends/:id', authenticate, requirePatientAccess, patientCtrl.getLongitudinalHealthTrends);
router.get('/patients/risk', authenticate, patientCtrl.getAIHealthRisk);
router.get('/patients/risk/:id', authenticate, requirePatientAccess, patientCtrl.getAIHealthRisk);

// --- Doctor Routes ---
router.get('/doctors/dashboard', authenticate, authorize(['DOCTOR']), doctorCtrl.getDoctorDashboard);
router.get('/doctors/profile', authenticate, doctorCtrl.getDoctorProfile);
router.put('/doctors/profile', authenticate, authorize(['DOCTOR']), doctorCtrl.updateDoctorProfile);
router.get('/doctors/profile/:id', authenticate, requireDoctorAccess, doctorCtrl.getDoctorProfile);
router.get('/doctors/patients', authenticate, authorize(['DOCTOR', 'ADMIN']), doctorCtrl.searchPatients);
router.get('/doctors/patients/:patientId/full-history', authenticate, authorize(['DOCTOR', 'ADMIN']), doctorCtrl.getPatientFullHistory);
router.get('/doctors/patients/:patientId/clinical-decision-support', authenticate, authorize(['DOCTOR', 'ADMIN']), cdsCtrl.getDoctorCDS);
router.post('/doctors/patients/:patientId/clinical-decision-support/review', authenticate, authorize(['DOCTOR', 'ADMIN']), cdsCtrl.recordReviewStatus);
router.get('/patients/clinical-decision-support', authenticate, cdsCtrl.getPatientCDS);
router.get('/patients/clinical-decision-support/:id', authenticate, requirePatientAccess, cdsCtrl.getPatientCDS);

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
router.get('/family/tree/:patientId', authenticate, requirePatientAccess, familyCtrl.getFamilyTree);
router.post('/family/member', authenticate, familyCtrl.addFamilyMember);
router.delete('/family/member/:id', authenticate, familyCtrl.deleteFamilyMember);

// --- Referral Routes ---
router.post('/referrals', authenticate, authorize(['DOCTOR']), refCtrl.createReferral);
router.get('/referrals', authenticate, refCtrl.getPatientReferrals);
router.get('/referrals/patient/:patientId', authenticate, requirePatientAccess, refCtrl.getPatientReferrals);
router.put('/referrals/:id/status', authenticate, authorize(['DOCTOR']), refCtrl.updateReferralStatus);

// --- Surveillance & Analytics Routes ---
router.get('/surveillance/overview', authenticate, survCtrl.getOverview);
router.get('/surveillance/hotspots', authenticate, survCtrl.getHotspots);
router.get('/surveillance/forecast', authenticate, survCtrl.getForecast);
router.get('/surveillance/map-data', authenticate, survCtrl.getMapData);
router.get('/surveillance/insights', authenticate, survCtrl.getAdminInsights);
router.get('/surveillance/intelligence', authenticate, authorize(['ADMIN']), survCtrl.getIntelligence);
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

// --- Medical Knowledge Base & RAG Management Routes (Admin) ---
router.get('/knowledge/documents', authenticate, authorize(['ADMIN']), knowledgeCtrl.getDocuments);
router.get('/knowledge/documents/:id', authenticate, authorize(['ADMIN']), knowledgeCtrl.getDocumentById);
router.post('/knowledge/documents', authenticate, authorize(['ADMIN']), knowledgeCtrl.createDocument);
router.put('/knowledge/documents/:id/status', authenticate, authorize(['ADMIN']), knowledgeCtrl.updateDocumentStatus);
router.post('/knowledge/reindex', authenticate, authorize(['ADMIN']), knowledgeCtrl.reindexCorpus);

// --- Contextual AI Assistant Routes ---
router.post('/ai/chat', authenticate, aiAssistantCtrl.askContextualAssistant);

// --- Audit Log Routes ---
router.get('/audit', authenticate, authorize(['ADMIN']), auditCtrl.getAuditLogs);

// --- Identity Document & Verification Routes ---
router.post('/identity-documents/upload', authenticate, identityDocCtrl.identityDocumentUploadMiddleware, identityDocCtrl.uploadIdentityDocument);
router.get('/identity-documents', authenticate, identityDocCtrl.getUserDocuments);
router.get('/identity-documents/:id', authenticate, requireDocumentAccess, identityDocCtrl.getDocumentById);
router.get('/identity-documents/:id/view', authenticate, requireDocumentAccess, identityDocCtrl.viewDocumentFile);
router.delete('/identity-documents/:id', authenticate, requireDocumentAccess, identityDocCtrl.deleteDocument);
router.get('/verification/requests', authenticate, authorize(['ADMIN']), identityDocCtrl.getAllVerificationRequests);
router.post('/verification/requests/:id/review', authenticate, authorize(['ADMIN']), identityDocCtrl.reviewVerificationRequest);
router.get('/verification/stats', authenticate, authorize(['ADMIN']), identityDocCtrl.getVerificationStats);

export default router;
