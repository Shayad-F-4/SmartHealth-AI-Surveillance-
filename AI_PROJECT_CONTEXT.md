# AI_PROJECT_CONTEXT.md
> **Single Source of Truth for AI Agents & Developers**
> **Last Verified & Updated:** 2026-10-06 (Profile & Settings UX)
> *Note for AI Agents:* Read this file first before inspecting the entire repository. If any code in the repository conflicts with this file, the actual code is the ground truth—update this document accordingly.

---

## 1. PROJECT OVERVIEW

**Project Name:** SmartHealth — AI-Powered Healthcare & Disease Surveillance System  
**Purpose:** An enterprise-grade, integrated Digital Health Record (EHR) and Public Health Disease Surveillance Platform that unifies patient health management, clinical workflows, machine-learning risk prediction, and automated epidemic hotspot response.

### Main Problem Being Solved:
1. **Fragmented Patient History:** Medical records, prescriptions, and lab tests are traditionally scattered across disconnected hospitals, lacking hereditary family context and emergency access.
2. **Disconnected Surveillance:** Public health departments traditionally receive outbreak data with weeks of lag because clinical doctor consultations are not automatically aggregated into real-time geospatial surveillance.
3. **Reactive Healthcare:** Lack of preventive decision-support tools that evaluate longitudinal biometric trends, detect physiological anomalies, and identify disease clusters before an epidemic escalates.

### Major User Personas:
* **Patients:** Access digital Smart Health Card (QR-enabled), view clinical records, track health trends (BP, glucose, BMI), review hereditary family risks, monitor local community disease advisories, and manage unified health identity settings.
* **Doctors / Clinicians:** Search and scan patient QR codes, review longitudinal medical history, launch seamless consultations with automated vital anomaly detection, cross-check drug allergies in real-time, order lab tests, manage clinical availability, and configure professional medical profile credentials.
* **Public Health Administrators & Epidemiologists:** Command center oversight of real-time disease cases, Leaflet geospatial mapping, DBSCAN spatial outbreak clustering, 4-week autoregressive case forecasting, population analytics, community health alerts, field health camp coordination, and manage administrative system access governance.
* **Emergency Responders / Paramedics:** Public-safe emergency profile lookup via QR code displaying only critical life-saving data (blood group, severe allergies, chronic conditions, emergency contacts) without exposing private clinical consultation notes.

---

## 1.1 UNIFIED PROFILE, IDENTITY & SETTINGS UX ARCHITECTURE

```text
Unified Design Principles:
  - Single implementation, 3 role experiences (PATIENT, DOCTOR, ADMIN) sharing the same modern healthcare visual language.
  - Dark navy sidebar, clean white/light surfaces, SmartHealth cyan/blue accents, rounded cards, compact information hierarchy.

Role Experiences & Tabs:
  1. Patient Profile (Personal Health Identity):
     - Personal Information, Emergency Information (Single Source of Truth), Medical Information, Government ID (Masked Aadhaar XXXX XXXX 9012), Notification Preferences, Security & Privacy.
  2. Doctor Profile (Professional Clinical Identity):
     - Profile (Personal), Professional Details (Specialty, License, Hospital, Experience), Hospital & Department, Availability (Working hours & daily capacity), Notification Preferences, Security.
  3. Admin Profile (System & Access Identity):
     - Profile (Personal), Role & Access (RBAC governance, read-only system permissions), Account Settings, Notification Preferences, Security & Access.

Single Source of Truth Emergency Contact Sync:
  - Emergency contact updates inside Patient Profile immediately update the Patient model in PostgreSQL, reflecting synchronously across:
    1. Patient Profile UX
    2. Smart Health Card Live Preview & PDF
    3. Public Emergency Lookup Page (/emergency/:healthId)

Top-Right User Profile & Dropdown Menu:
  - Accessible from the top navbar across all views.
  - Displays dynamic avatar, real authenticated name, role badge (PATIENT / DOCTOR / ADMIN), and Health ID.
  - Interactive dropdown menu features:
    1. Profile & Settings (Opens UserProfilePage)
    2. Smart Health Card (Opens SmartHealthCard view for Patients)
    3. Notifications (Opens in-app community & surveillance alert drawer)
    4. Security & Privacy (Directs to profile security tab)
    5. Sign Out (Executes AuthContext session invalidation)
  - Accessibility & UX: Closes automatically on outside click and Keyboard Escape key.

Avatar & Profile Image Persistence Pipeline:
  - Backend: Added `avatarUrl` field to `User` Prisma model and express static directory `/uploads/avatars`.
  - API: Endpoint `POST /api/auth/avatar` validates (PNG/JPG/WEBP, 5MB limit), writes file to disk, updates PostgreSQL `User.avatarUrl`, and returns updated profile payload.
  - Frontend: `ProfileHeader` uploads via `Multipart/form-data`, triggers `AuthContext.refreshUser()`, and synchronously updates the Navbar avatar, User Dropdown, and Profile Hero with dynamic initials fallback (`onError`).
  - Persistence: Avatar survives full page refresh, navigation, and re-authentication sessions.

Identity Verification & Multi-Factor Authentication (MFA):
  - Patient Identity Verification: AI-assisted pre-check with high-confidence automated verification rule and manual admin review fallback.
  - Doctor Credential Verification: Professional credentials require strict Admin approval in the Verification Center.
  - MFA Engine: TOTP setup (QR code & secret generation) supported for all roles (PATIENT, DOCTOR, ADMIN) with backup code generation, password confirmation on disable, and active session tracking/revocation.
```


---

## 2. CURRENT TECHNOLOGY STACK

```text
Frontend:
  - React 19 (TypeScript)
  - Vite (Build Tool & Dev Server)
  - Three.js, @react-three/fiber, @react-three/drei (3D Floating Health Assistant Robot)
  - Chart.js & react-chartjs-2 (Epidemiological curves, vitals trends, demographic charts)
  - Leaflet & React-Leaflet (Interactive GIS OpenStreetMap for outbreak clusters)
  - Lucide React (Clinical and navigational iconography)
  - Context API (JWT Session & Authentication State)

Backend:
  - Node.js (v20+)
  - Express.js (TypeScript)
  - Prisma ORM (Database access & migrations)
  - PostgreSQL 16 (Relational persistence)
  - JWT (JSON Web Tokens) & BcryptJS (Password hashing & RBAC)
  - Axios (HTTP client for ML microservice communication)

AI / ML Service:
  - Python 3.10+
  - FastAPI (REST microservice at http://127.0.0.1:8000)
  - Scikit-learn (RandomForestClassifier, IsolationForest, DBSCAN, Ridge Regression)
  - Joblib (Model persistence)
  - Pandas & NumPy (Data transformation & spatial clustering)
  - High-Availability Fallback: Built-in clinical algorithms in Node.js backend (mlClient.ts) ensuring 100% uptime even if the Python service is offline

Infrastructure & Security:
  - Port 5173: Frontend Web Application
  - Port 5000: Backend Core API
  - Port 8000: Python ML Microservice
  - Role-Based Access Control (RBAC): PATIENT, DOCTOR, ADMIN
  - Audit Trail: Immutable database logging for security and compliance
```

---

## 3. PROJECT STRUCTURE

```text
c:\Users\userm\OneDrive\Desktop\MP\
├── .gitignore                      # Git exclusion rules (node_modules, .env, dist, pycache)
├── AI_PROJECT_CONTEXT.md          # THIS FILE: Single source of truth for AI agents
├── QUICKSTART.md                  # Quick local run and testing guide
├── README.md                      # Project documentation and feature overview
│
├── backend/                       # Express + Prisma + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma          # 18 relational models & enums
│   │   └── seed.ts                # Database seeder with realistic clinical & disease telemetry
│   ├── src/
│   │   ├── config/prisma.ts       # Shared PrismaClient singleton
│   │   ├── controllers/           # HTTP handlers for auth, patients, visits, surveillance, etc.
│   │   ├── middleware/            # JWT auth, RBAC authorization, audit logging
│   │   ├── routes/                # Central route registry (index.ts)
│   │   └── services/              # Business logic (allergy check, ML client, surveillance evaluator)
│   └── dist/                      # Compiled Node.js backend output
│
├── frontend/                      # React 19 + TypeScript + Vite Application
│   ├── src/
│   │   ├── components/            # Reusable UI (Sidebar, Navbar, LeafletDiseaseMap, HealthCharts, SmartHealthCard, FamilyTree)
│   │   ├── context/               # AuthContext.tsx (user session, login/logout, notifications)
│   │   ├── pages/
│   │   │   ├── public/            # LandingPage, LoginPage, RegisterPage, EmergencyProfilePage
│   │   │   ├── patient/           # PatientDashboard, MedicalRecordsPage, HealthTrendsPage, AIRiskPage, etc.
│   │   │   ├── doctor/            # DoctorDashboard, DoctorPatientsPage, DoctorReferralsPage
│   │   │   └── admin/             # AdminDashboard, DiseaseSurveillanceCenter, AlertsPage, HealthCampsPage, AuditLogsPage
│   │   ├── services/api.ts        # Axios client with automatic Bearer token injection
│   │   ├── App.tsx                # Central application router and role-based view switcher
│   │   └── index.css              # Design system stylesheet, color tokens, and responsive utilities
│   └── dist/                      # Compiled production frontend bundle
│
└── ml-service/                    # Python FastAPI Machine Learning Microservice
    ├── app.py                     # FastAPI server exposing ML endpoints (/predict-risk, /detect-anomaly, etc.)
    ├── train.py                   # Script to train and persist scikit-learn models
    ├── requirements.txt           # Python dependencies
    └── models/                    # Serialized joblib artifacts
        ├── model_a_risk.joblib
        ├── model_b_anomaly.joblib
        └── model_d_forecast.joblib
```

---

## 4. EXISTING FEATURES

### Core & Security
* `[x]` User Authentication (JWT + Bcrypt)
  * `[x]` Secure password hashing with bcrypt (10 salt rounds)
  * `[x]` JWT with 7-day expiration and session ID (jti) for revocation support
  * `[x]` Session management with Redis (fails gracefully if unavailable)
  * `[x]` Login rate limiting with account lockout (5 attempts / 15 minutes)
  * `[x]` Failed login tracking and audit logging
* `[x]` Role-Based Access Control (`PATIENT`, `DOCTOR`, `ADMIN`)
  * `[x]` Backend-enforced authorization on all protected routes
  * `[x]` Resource ownership validation (patient/doctor record access)
* `[x]` Immutable Audit Trail Logging (User actions, timestamps, IP address)
* `[x]` Notification System with real-time unread badges
* `[x]` Frontend Authentication UX:
  * `[x]` Password strength validation (8+ chars, uppercase, lowercase, number)
  * `[x]` Password visibility toggle (eye icon)
  * `[x]** User-friendly error messages (no raw server errors)
  * `[x]` Removed browser alert() dialogs, using in-page error banners
  * `[x]** Demo login error handling with contextual messages

### Public & Emergency
* `[x]` Landing Page with quick demo credentials
  * `[x]` 1-click demo authentication for Patient, Doctor, Admin
  * `[x]` Professional error handling (no browser alerts)
  * `[x]** Contextual error messages when backend unavailable
* `[x]` User Registration (Patient & Doctor workflows)
  * `[x]` Patient registration with Smart Health ID generation (SHC-2026-XXXXXX)
  * `[x]` Doctor registration with professional credential verification workflow
  * `[x]** Frontend password validation before API call
  * `[x]** Duplicate email detection with user-friendly error message
  * `[x]** Medical license validation for doctors
  * `[x]** Integration with identity verification system (UNVERIFIED → VERIFIED flow)
  * `[x]** Automatic verification request creation for doctors
* `[x]` Public Emergency Health Profile (`/emergency/:healthId` — QR-scannable, sanitizes private notes)

### Patient Portal (Consolidated & Simplified)
* `[x]` **Overview:** Intelligent, un-cluttered health summary ("What is important about my health right now?") featuring: Patient Profile Header, 3-4 Key Summary Cards (Overall Status, Active Condition, AI Risk %, Conditional Upcoming Appointment), Health Intelligence (animated Phase 3 RandomForest risk gauge & Phase 2 real-data SVG trend charts with hover tooltips and record links), Physiological Anomaly status, Key Vitals row, Important Recent Activity timeline stream, and Privacy-Safe Area Health Alert sync.
* `[x]` **Medical Records:** Central healthcare records archive:
  * `[x]` **All Records:** Unified view of lab reports, prescriptions, consultations, vaccinations, imaging, and discharge summaries with category filter chips and search.
  * `[x]` **+ Add Health Record:** Unified workflow supporting document upload (PDF/images with automated parameter extraction & persistence) and manual record entry.
  * `[x]` **Medical Timeline:** Embedded chronological visit and encounter history.
* `[x]` **Health Insights:** Consolidated intelligence view:
  * `[x]` **Health Trends:** Longitudinal BP, Glucose, and Cholesterol time-series tracking with reference interval indicators.
  * `[x]` **AI Health Risk:** Model A Random Forest risk level and calibrated score, top contributing factors, and evidence grounding without technical jargon.
* `[x]` **AI Assistant:** Ultra-clean 3D floating healthcare robot ("HealRobo") loading `/models/health-assistant.glb` via `@react-three/fiber` and `@react-three/drei`. Displays only the clean title `HealRobo` above a 100% transparent 3D canvas with soft medical glow and zero surrounding boxes/panels. Supports smooth viewport dragging with position persistence (`localStorage`), OrbitControls 3D rotation/zoom, single-click to focus chat input, double-click to minimize/restore, and dynamic AI states (`idle`, `thinking`, `speaking`).
* `[x]` **Family Health:** Hereditary health pedigree tree.
* `[x]` **Referrals:** Specialist referral tracking and status.
* `[x]` **Disease Surveillance:** Privacy-conscious nearby health signals (25 km radius aggregation, zero PII/GPS disclosure).
* `[x]` **Smart Health ID:** Profile-accessible identity card and QR code terminal without sidebar clutter.

### Doctor Portal
* `[x]` Doctor Dashboard (Daily shift stats, recently attended patients)
* `[x]` Unified Patients Workflow:
  * `[x]` Search by Health ID, name, or phone
  * `[x]` Optical QR Reader Terminal simulator
  * `[x]` Comprehensive Patient Profile & History Inspection (Timeline, Episodes, Family, Labs, Card, Clinical Decision Support)
  * `[x]` In-workflow Clinical Consultation intake
  * `[x]` Real-time Drug Allergy Conflict Detection
  * `[x]` Automated Vital Sign Physiological Anomaly Detection
  * `[x]` Automated Disease Surveillance Sync (contagious cases automatically report to surveillance)
  * `[x]` Lab test ordering and Specialist referral issuance
* `[x]` Advanced Clinical Decision Support System (CDSS) & Care Pathway Intelligence:
  * `[x]` Deterministic Multi-Parameter Signal Detection (Physiological anomalies, persistent abnormalities, cardiometabolic risk $\ge 65\%$, medication safety allergy flags, preventive care gaps)
  * `[x]` Grounded Clinical Evidence Cards (Traceable to specific lab tests, vitals, or allergies)
  * `[x]` Sequential 5-Stage Care Pathway Recommendation (`CONFIRM_EVIDENCE` → `CLINICAL_ASSESSMENT` → `GUIDELINE_REVIEW` → `POTENTIAL_FOLLOW_UP` → `MONITORING`)
  * `[x]` Correlated WHO, ADA, AHA, and NIH Clinical Guidelines Retrieval (via Phase 6 RAG)
  * `[x]` Doctor Review Status Tracking (`REVIEWED`, `ACTIONED`, `DISMISSED`) with full audit logging
* `[x]` Doctor Referrals Management
* `[x]` Local Disease Surveillance Map

### Admin & Public Health Surveillance
* `[x]` Healthcare Operations Dashboard (System-wide KPIs, registered population, active camps)
* `[x]` **Identity & Credential Verification Center** (Professional UI Redesign):
  * `[x]` **Polished Summary Cards:** Pending Patient, Pending Doctor, Review Required, Verified, Rejected with clickable filters
  * `[x]` **Requires Attention Section:** High-priority verification requests needing immediate review
  * `[x]` **Professional Filter Toolbar:** Status filter, Role filter, Search by name/email/document
  * `[x]` **Enhanced Verification Table:** User avatars, role badges, document icons, AI analysis display, status badges
  * `[x]` **Comprehensive Review Drawer:** User info, document details, AI analysis, verification timeline, admin decision actions
  * `[x]` **Loading Skeletons:** Professional loading states for cards, table, and drawer
  * `[x]` **Error & Empty States:** Clear error messages with retry, empty state with clear filters button
  * `[x]` **Secure Document Preview:** Uses existing secure document API with token authentication
  * `[x]` **Real-time Updates:** Last updated timestamp, refresh functionality
  * `[x]` **Security:** ADMIN-only authorization enforced at backend level
* `[x]` Integrated Disease Surveillance Command Center:
  * `[x]` Top KPI Cards (Total cases, active alerts, high-risk outbreak zones, weekly change %)
  * `[x]` **Overview Tab:** Critical outbreak alert banner, population disease distribution, district risk table
  * `[x]` **Map Tab:** Interactive Leaflet GIS OpenStreetMap with disease/district filters & cluster radiuses
  * `[x]` **Hotspots Tab:** Unsupervised spatial DBSCAN clustering (centroids, radius km, density, Deploy Camp)
  * `[x]` **Forecast Tab:** 4-Week autoregressive lag time-series prediction with trajectory direction
  * `[x]` **Analytics Tab:** 8-Week epidemic curve, disease burden, demographics (age, gender, severity), week-over-week trends
  * `[x]` **AI Insights Tab:** Synthesized epidemiological bulletins and recommended municipal interventions
* `[x]` Community Health Alerts (Targeted district broadcasts)
* `[x]` Outbreak Screening Health Camps (AI-recommended deployments, field attendee screening logging)
* `[x]` Security & Privacy Audit Trail Viewer

---

## 5. CURRENT DATABASE (Prisma Models)

All 18 models are defined in [`backend/prisma/schema.prisma`](file:///c:/Users/userm/OneDrive/Desktop/MP/backend/prisma/schema.prisma):

1. **User:** Core auth entity. Stores email, hashed password, role (`PATIENT` | `DOCTOR` | `ADMIN`), name, phone. Relates 1:1 to Patient or Doctor.
2. **Patient:** Primary clinical entity. Stores unique `healthId` (`SHC-2026-XXXXXX`), DOB, gender, bloodGroup, district, coordinates (lat/lng), emergency contact, allergies, chronicConditions.
3. **Doctor:** Healthcare provider. Stores `licenseNumber`, specialty, qualification, experience, and links to Hospital.
4. **Hospital:** Clinical facility with name, district, contact, and geographic coordinates.
5. **MedicalRecord:** Core clinical encounter record created during doctor visits. Stores vitals (BP, glucose, heart rate, temp, SpO2, BMI), symptoms, diagnosis, disease, severity, notes, AI risk score, and anomaly flags.
6. **DiseaseEpisode:** Longitudinal episode grouping related visits for a single condition (e.g., initial diagnosis -> follow-up -> resolved).
7. **Prescription:** Medications prescribed during an encounter. Stores drug name, dosage, frequency, duration, status, and allergy conflict flags.
8. **LabReport:** Diagnostic investigations. Stores test name, measured value, units, normal ranges, `isOutOfRange` boolean, and trend direction.
9. **FamilyMember:** Hereditary health history. Links to patient with relation, age, and condition (e.g., Cardiovascular Disease, Diabetes).
10. **Referral:** Secondary care specialist referral generated by doctors.
11. **DiseaseReport:** Surveillance data point generated automatically when a contagious disease encounter is recorded.
12. **LocationRisk:** Aggregated epidemiological metrics per district and disease (total cases, active cases, weekly growth rate, risk level, AI insights).
13. **CommunityAlert:** Targeted public health advisories broadcasted to residents of specific districts.
14. **HealthCamp:** Field screening camps scheduled in hotspot areas.
15. **CampScreening:** Individual screening records captured during field health camps.
16. **Notification:** User-specific notifications (disease alerts, lab flags, system messages).
17. **AuditLog:** Security trail recording user action, resource, IP address, and timestamp.
18. **SystemSetting:** Key-value configuration store for platform-wide parameters.

---

## 6. IMPORTANT API ROUTES

Registered in [`backend/src/routes/index.ts`](file:///c:/Users/userm/OneDrive/Desktop/MP/backend/src/routes/index.ts):

### Public & Auth
* `GET  /api/emergency/:healthId` — Public-safe emergency profile lookup
* `POST /api/auth/register` — User registration (Patient/Doctor)
  * Request: `{ role, name, email, password, phone, ...roleSpecificFields }`
  * Response: `{ message, token, user: { id, email, name, role, phone, patient?, doctor? } }`
  * Password requirements: 8+ chars, uppercase, lowercase, number
  * Backend validates: email uniqueness, password strength, required fields
  * Patient: Creates User + Patient with generated Smart Health ID (SHC-2026-XXXXXX)
  * Doctor: Creates User + Doctor with verification status UNVERIFIED
* `POST /api/auth/login` — Authentication and JWT token issuance
  * Request: `{ email, password }`
  * Response: `{ message, token, user: { id, email, name, role, phone, patient?, doctor? } }`
  * Rate limited: 5 failed attempts triggers 15-minute lockout
  * JWT payload: `{ id, email, role, name, jti (session ID) }`
  * JWT expiration: 7 days
  * Session ID stored in Redis for revocation support (fails gracefully if Redis unavailable)
* `GET  /api/auth/me` — Authenticated user profile fetch
  * Requires: Valid JWT in Authorization header
  * Response: Full user profile with patient/doctor relations
* `PUT  /api/auth/me` — Update user profile
  * Supports: name, phone, avatarUrl, password change (requires current password)
  * Password change revokes all other sessions

### Patient Endpoints
* `GET  /api/patients/profile` — Full profile details
* `GET  /api/patients/card` — Smart Health Card data + QR payload
* `GET  /api/patients/timeline` — Chronological clinical encounters
* `GET  /api/patients/episodes` — Grouped longitudinal disease episodes
* `GET  /api/patients/analytics` — Biometric vitals time-series (BP, glucose, BMI)
* `GET  /api/patients/risk` — AI cardiovascular and metabolic risk score

### Doctor Endpoints
* `GET  /api/doctors/dashboard` — Shift KPIs and recent consultations
* `GET  /api/doctors/patients?q=` — Search patients by Health ID, name, or phone
* `GET  /api/doctors/patients/:id/full-history` — Complete clinical record for doctor review
* `POST /api/visits` — Record new clinical encounter (triggers surveillance sync)
* `POST /api/prescriptions` — Create prescription records
* `GET  /api/referrals` & `POST /api/referrals` — Manage specialist referrals

### Diagnostics & Family
* `GET  /api/labs` & `POST /api/labs` — Lab test investigations
* `GET  /api/family/tree` & `POST /api/family/member` — Hereditary family pedigree tree

### Surveillance & Epidemic Intelligence (Admin / Doctor)
* `GET  /api/surveillance/overview` — High-level epidemiological summary
* `GET  /api/surveillance/map-data` — GeoJSON / points for GIS disease map
* `GET  /api/surveillance/hotspots` — DBSCAN cluster epicenters and radii
* `GET  /api/surveillance/forecast` — 4-Week time-series case projections
* `GET  /api/surveillance/insights` — AI-synthesized epidemiological bulletins
* `GET  /api/surveillance/analytics` — Population analytics, 8-week curves, demographic breakdowns

### Interventions & Governance
* `GET  /api/alerts/history` & `POST /api/alerts` — Community alerts management
* `GET  /api/camps` & `POST /api/camps` — Field screening health camps
* `POST /api/camps/:id/screenings` — Log screening results at camps
* `GET  /api/audit` — HIPAA/GDPR-compliant security audit logs

---

## 7. AI / ML ARCHITECTURE

### Microservice Specification (`ml-service/app.py`):
1. **Model A — Health Risk Prediction (`/predict-risk`):**
   * **Algorithm:** Random Forest Classifier (`model_a_risk.joblib`)
   * **Inputs:** `age`, `bmi`, `systolic_bp`, `diastolic_bp`, `fasting_glucose`, `family_history_flag`, `chronic_conditions_count`
   * **Outputs:** `risk_level` (`LOW`, `MODERATE`, `HIGH`), `risk_score` (0–100%), contributing factors, clinical recommendations.
2. **Model B — Vital Anomaly Detection (`/detect-anomaly`):**
   * **Algorithm:** Isolation Forest (`model_b_anomaly.joblib`)
   * **Inputs:** `systolic_bp`, `diastolic_bp`, `fasting_glucose`, `heart_rate`, `bmi`, `temperature`
   * **Outputs:** `is_anomaly` (boolean), `confidence`, specific flagged metrics (e.g., Hypertensive Crisis, Hypoglycemia).
3. **Model C — Geospatial Hotspot Detection (`/detect-hotspots`):**
   * **Algorithm:** Unsupervised DBSCAN Spatial Clustering
   * **Parameters:** `eps_km = 2.5` (cluster radius in kilometers), `min_samples = 3` (minimum case density)
   * **Inputs:** Array of case coordinates `{ id, disease, district, lat, lng }`
   * **Outputs:** Clusters with centroid coordinates, radius in km, density, and severity level.
4. **Model D — Epidemiological Forecaster (`/forecast-cases`):**
   * **Algorithm:** Autoregressive Lag Regression (`model_d_forecast.joblib`)
   * **Inputs:** Historical weekly case series, `forecast_weeks = 4`
   * **Outputs:** Predicted weekly cases for weeks 1–4, growth rate %, trend direction (`INCREASING`, `STABLE`, `DECREASING`).

### High-Availability Fallback Architecture:
[`backend/src/services/mlClient.ts`](file:///c:/Users/userm/OneDrive/Desktop/MP/backend/src/services/mlClient.ts) wraps all calls to the ML service with a 4000ms timeout. If the Python microservice is paused or unreachable, built-in deterministic clinical algorithms execute transparently, ensuring zero system downtime.

### Healthcare Decision-Support Rule:
All AI outputs are presented strictly as **decision-support indicators** (e.g., *"Risk indication"*, *"Potential hotspot"*, *"Suggested intervention"*), never as confirmed autonomous medical diagnoses.

---

## 8. HEALTHCARE DATA FLOW

```
 ┌───────────────┐
 │ Doctor Intake │ Doctor searches patient -> Reviews history -> Enters vitals, diagnosis, rx
 └───────┬───────┘
         │ HTTP POST /api/visits
         ▼
 ┌───────────────┐
 │ Backend Core  │ 1. Runs real-time drug allergy cross-check
 │  (Express.js) │ 2. Evaluates vitals via ML Anomaly Detector
 └───────┬───────┘ 3. Persists MedicalRecord & updates DiseaseEpisode
         │
         ├─── If Contagious Disease (e.g., Malaria, Dengue, Typhoid)
         ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ Surveillance Evaluator (services/surveillanceService.ts)    │
 │ • Automatically creates DiseaseReport                       │
 │ • Re-evaluates district LocationRisk & weekly growth rate   │
 │ • Triggers spatial DBSCAN clustering & 4-week forecast      │
 │ • If threshold breached:                                    │
 │     - Automatically creates CommunityAlert draft            │
 │     - Auto-recommends Outbreak HealthCamp in district       │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ Public Health Command Center (DiseaseSurveillanceCenter.tsx)│
 │ • Real-time telemetry displayed on GIS Leaflet Map          │
 │ • Hotspot clusters highlighted for immediate action         │
 │ • Health officials approve and deploy field screening camps │
 └─────────────────────────────────────────────────────────────┘
```

---

## 9. SECURITY & RBAC

1. **Authentication:** Stateless JWT stored securely in browser `localStorage`, verified via `authenticate` middleware. Passwords hashed with `bcryptjs` (salt rounds = 10).
2. **Role-Based Authorization (`authorize(['ADMIN', ...])`):**
   * `PATIENT`: Can only view their own profile, records, card, timeline, family tree, and general citizen surveillance.
   * `DOCTOR`: Can search patients, view full clinical histories, create consultations, issue prescriptions, and order tests.
   * `ADMIN`: Full access to surveillance analytics, DBSCAN hotspot tools, alert broadcasting, health camp approvals, and security audit logs.
3. **Emergency Profile Privacy:** Public endpoint `/api/emergency/:healthId` only exposes non-sensitive emergency profile data. Confidential clinical notes and doctor observations are completely withheld.
4. **Audit Logging:** Sensitive actions (`VIEW_PATIENT_RECORD`, `CREATE_VISIT`, `LOGIN`, `UPDATE_ALERT`) are automatically logged to the `AuditLog` table with user IDs, resource IDs, IP addresses, and timestamps.

---

## 10. CURRENT DEVELOPMENT STATUS

* **Current Phase:** Phase 4 Completed (Contextual AI Health Assistant) -> Entering Phase 5 (Disease Surveillance Intelligence)
* **Current Feature:** Contextual AI Health Assistant
* **Status:** Fully Implemented, Integrated, & Verified
* **Last Completed Task:** Built Contextual AI Health Assistant (`patientContextService.ts`, `aiProviderService.ts`, `aiAssistantController.ts`, API `POST /api/ai/chat`, `AIAssistantPage.tsx` UI, and prompt injection defenses).
* **Current Problem:** None for Phase 4. Ready to proceed to Phase 5.
* **Next Task:** PHASE 5 — Disease Surveillance Intelligence (Explanatory intelligence layer above existing DBSCAN and autoregressive forecasting).

---

## 11. COMPLETED CHANGES (Chronological)

* **2026-09-17:** Initial full-stack implementation (PostgreSQL 16, Prisma ORM, Express backend, React 19 frontend, Python ML service).
* **2026-09-27:** Fixed patient dashboard analytics biometric chart key mismatch (`bpSeries`); created backend `/surveillance/analytics` controller and frontend `AnalyticsPage.tsx`.
* **2026-09-27:** Comprehensive Information Architecture (IA) refactor:
  * Unified Patient Medical Records (subsections: Clinical Records, Medical Timeline, Disease Episodes).
  * Unified Doctor Patients workflow (Search -> Profile -> History -> Seamless Consultation intake).
  * Built unified Admin Disease Surveillance Command Center with 6 integrated tabs (Overview, Map, Hotspots, Forecast, Analytics, AI Insights).
* **2026-10-01:** Design system overhaul (`index.css`), removed legacy `logo.png` image references, replaced with SVG vector branding, and pushed complete clean repository to GitHub.
* **2026-10-01:** Completed comprehensive architecture audit and aligned the 12-phase technical roadmap.
* **2026-10-01:** **Phase 1 Completed:** Implemented real end-to-end AI Medical Document Analyzer (multipart file validation, disk storage abstraction `StorageService`, text parsing & structured lab entity extraction `documentExtractor`, database persistence in `LabReport` & notifications, and integrated real upload UI with instant parameter extraction preview in `MedicalRecordsPage.tsx`).
* **2026-10-01:** **Phase 2 Completed:** Implemented real **Longitudinal Health Analysis & Patient Health Trends**:
  * Created backend `getLongitudinalHealthTrends` controller in `patientController.ts`.
  * Exposed `GET /api/patients/health-trends` and `GET /api/patients/health-trends/:id` endpoints protected by JWT & RBAC authorization.
  * Deterministic mathematical trend calculation (previous value, latest value, absolute change, percentage change, direction classification `INCREASING` / `DECREASING` / `STABLE` / `INSUFFICIENT_DATA`).
  * Built `GenericLabTrendChart` component in `HealthCharts.tsx` for structured lab time-series.
  * Upgraded `HealthTrendsPage.tsx` with filter toolbar, trend summary cards, reference range status, natural language calculated summaries, and source record links.
  * Integrated longitudinal Health Trends sub-tab into Doctor Patients workflow (`DoctorPatientsPage.tsx`).
* **2026-10-05:** **Phase 3 Completed:** Implemented **ML Risk Prediction + AI Explanation Layer**:
  * Preserved scikit-learn `RandomForestClassifier` (`model_a_risk.joblib`) & fallback heuristics without changing numerical risk outputs.
  * Extended `ml-service/app.py` and `mlClient.ts` to return model feature importances & metadata.
  * Created `riskExplanationService.ts` for deterministic feature importance weighting, clinical threshold evaluation, and traceable supporting evidence linking.
  * Upgraded `patientController.ts` `getAIHealthRisk` response payload with `prediction` object and structured `explanation` object.
  * Upgraded `AIRiskPage.tsx` UI rendering model class probabilities, feature importance weights, threshold status badges, database-linked supporting evidence cards, and clinical limitations.
* **2026-10-05:** **Phase 4 Completed:** Implemented **Contextual AI Health Assistant**:
  * Created `patientContextService.ts` for intent detection (`LABS`, `MEDICATIONS`, `RISK`, `TIMELINE`, `EPISODES`) and targeted DB context retrieval from Prisma models.
  * Created `aiProviderService.ts` providing optional OpenRouter/Gemini/OpenAI integration alongside a high-availability deterministic clinical expert engine fallback.
  * Enforced prompt injection defenses (treating document and user data strictly as untrusted data parameters).
  * Created `aiAssistantController.ts` registering authenticated `POST /api/ai/chat` endpoint with JWT & RBAC patient context isolation.
  * Created `AIAssistantPage.tsx` chat interface with suggested quick questions, verified record source cards, and urgency detection warnings.
* **2026-10-05:** **Phase 5 Completed:** Implemented **Disease Surveillance Intelligence Platform**:
  * Created `diseaseIntelligenceService.ts` synthesizing validated surveillance telemetry into a structured intelligence briefing without replacing DBSCAN or autoregression.
  * Built structured dimensions: `keyFindings` (TREND, HOTSPOT, FORECAST, SIGNAL), `hotspotClusters` (DBSCAN centroids, radius, density), `forecasts` (4-week autoregressive projections, trajectories), and grounded `interventions` (mobile camps, vector abatement, water chlorination).
  * Implemented deterministic clinical expert fallback (`SmartHealth Epidemiological Expert Engine (Deterministic)`) with optional external LLM synthesis (`callExternalAI`), strictly treating telemetry numbers as immutable facts.
  * Added `getIntelligence` in `surveillanceController.ts` and registered authenticated/authorized `GET /api/surveillance/intelligence` route.
  * Upgraded `InsightsPage.tsx` with dynamic KPI cards, executive briefing narrative, multi-dimensional view filter tabs, DBSCAN spatial density tables, 4-week forecast sequences, priority-ordered directives, and traceable evidence audit trail.
  * Linked epidemiological alerts in `DiseaseSurveillanceCenter.tsx` to the briefing view.
* **2026-10-05:** **Phase 6 Completed:** Implemented **Medical Knowledge Retrieval / RAG (Retrieval-Augmented Generation)**:
  * Upgraded Prisma schema with `KnowledgeDocument`, `KnowledgeChunk`, and `DocumentStatus` (TRUSTED, UNVERIFIED, DISABLED) models.
  * Created `embeddingService.ts` with configurable API provider and deterministic 128-dimensional clinical vectorizer with n-grams and cosine similarity.
  * Created `knowledgeIngestionService.ts` with automated seeding of curated, authoritative guidelines from WHO, CDC, NIH, MedlinePlus, and ADA covering Hypertension, HbA1c/Diabetes, Lipid Profiles, Anemia/CBC, and Vector-Borne Diseases.
  * Created `ragRetrievalService.ts` performing hybrid semantic vector + keyword scoring with calibrated thresholds and strict hallucination control.
  * Extended `patientContextService.ts` with multi-category intent detection distinguishing `GENERAL_MEDICAL`, `HYBRID_MEDICAL`, and patient EHR queries.
  * Upgraded `aiProviderService.ts` and `aiAssistantController.ts` with strict reference data isolation, prompt injection defenses, traceable source URLs, answer type badges (`PATIENT_RECORD`, `MEDICAL_KNOWLEDGE`, `HYBRID_ANSWER`), and high-availability deterministic clinical fallback.
  * Added Admin Knowledge Management API (`GET/POST/PUT /api/knowledge/documents`, `POST /api/knowledge/reindex`).
  * Upgraded `AIAssistantPage.tsx` with dedicated Medical Reference citation cards, clickable guideline URLs, answer type badges, retrieval indicators, and medical knowledge suggestions.
* **2026-10-05:** **Phase 7 Completed:** Implemented **Advanced Clinical Decision Support & Care Pathway Intelligence**:
  * Created `clinicalDecisionSupportService.ts` providing multi-modal CDSS synthesis:
    * Orchestrated Phase 2 longitudinal trend analytics, Phase 3 ML risk prediction (`predictRiskWithML` Model A Random Forest), and Phase 6 RAG guideline retrieval without duplicate calculation.
    * Built deterministic rule engine detecting 5 signal categories: `PHYSIOLOGICAL_ANOMALY` (severe vitals/lab values), `PERSISTENT_ABNORMALITY` / `WORSENING_TREND` (multi-visit lab deviations), `CARDIOMETABOLIC_RISK_SIGNAL` (ML risk $\ge 65\%$), `MEDICATION_SAFETY_REVIEW` (allergy cross-match), and `PREVENTIVE_CARE_GAP` (overdue screening intervals).
    * Constructed structured 5-stage sequential care pathway: `CONFIRM_EVIDENCE` → `CLINICAL_ASSESSMENT` → `GUIDELINE_REVIEW` → `POTENTIAL_FOLLOW_UP` → `MONITORING`.
    * Integrated targeted Phase 6 RAG retrieval querying WHO, ADA, AHA, and NIH guidelines mapped to active signal clinical topics.
    * Implemented high-availability deterministic clinical synthesis (`generateDeterministicCDSSummary`) alongside optional LLM provider integration.
  * Created `clinicalDecisionSupportController.ts`:
    * `getDoctorCDS`: Protected doctor/admin endpoint returning complete CDSS payload with audit logging.
    * `getPatientCDS`: Protected patient-safe endpoint returning educational overview without alarming clinical terminology.
    * `recordReviewStatus`: Clinician review tracking (`REVIEWED`, `ACTIONED`, `DISMISSED`) with audit logging.
  * Registered routes in `backend/src/routes/index.ts`.
  * Created `ClinicalDecisionSupportView.tsx` with urgent triage banner, active signal cards with clinical rationales, clickable evidence badges, 5-stage sequential care pathway with inline consultation launcher, RAG guideline cards with external links, and doctor review status action bar.
  * Integrated CDSS tab directly into `DoctorPatientsPage.tsx` alongside Timeline, Episodes, Trends, Family, Labs, and Card.
* **2026-10-05:** **Final UI Simplification & Patient Experience Completed:**
  * Consolidated patient navigation in `Sidebar.tsx` to exactly 7 primary items: `Overview`, `Medical Records`, `Health Insights`, `AI Assistant`, `Family Health`, `Referrals`, `Disease Surveillance`.
  * Added compact, single-click profile identity card badge (`Smart Health ID`) in sidebar footer.
  * Completely streamlined `PatientDashboard.tsx` from 1,561 lines of multi-card sprawl to a clean, focused quick summary:
    * 3-point health status card: General status, active condition/episode, AI cardiometabolic risk % with direct link.
    * Recent activity stream showing max 4 events across consultations, labs, prescriptions, and records.
    * Conditional district alert banner (displayed only if active disease advisory exists).
    * 3 primary quick action cards: `+ Add Health Record`, `View Medical Records`, `Ask AI Assistant`.
  * Transformed `MedicalRecordsPage.tsx` into the central healthcare record archive:
    * Removed 4 large stat cards and the 300px right sidebar clutter.
    * Integrated unified `+ Add Health Record` modal supporting 6 record types (Lab Reports with Phase 1 PDF/image parsing, Prescriptions, Consultations, Vaccinations, Imaging, Other).
    * Embedded `MedicalTimelinePage` under sub-tab navigation (`All Records` | `Medical Timeline`).
    * Added category filter chips (`All Records`, `Lab Reports`, `Prescriptions`, `Consultations`, `Vaccinations`, `Imaging`, `Other`) with live lab & prescription data synchronization.
  * Created `HealthInsightsPage.tsx` unifying `HealthTrendsPage` (longitudinal trends of BP, Glucose, Cholesterol) and `AIRiskPage` (Model A Random Forest score %, contributing factors, clinical limitations) under a clean sub-tab switcher.
  * Upgraded `AIAssistantPage.tsx` with a modern 3D floating healthcare avatar (`HealthAssistantAvatar3D.tsx`) built with Three.js (glassmorphism core, glowing vitality nucleus, rotating orbital rings, gentle breathing idle, thinking/speaking reactivity, and quick prompt chips).
  * Simplified `SurveillancePage.tsx` into a privacy-conscious `Nearby Health Signals` bulletin: standard 25 km radius aggregation, zero exposure of private patient coordinates or PII, disease trend indicators, and municipal preventive guidance.
* **2026-10-06:** **Phase 8 Completed:** Implemented **Profile, Settings, Identity Verification & Credential Verification System**:
  * Extended Prisma schema with new models: `IdentityDocument`, `VerificationRequest`, enums for `DocumentType`, `VerificationStatus`, and `ReviewDecision`.
  * Added verification status fields to `Patient` and `Doctor` models: `verificationStatus`, `verifiedDocumentType`, `verifiedAt`.
  * Created `secureDocumentStorage.ts` for secure file storage with random server-side filenames, MIME validation, and private storage in `uploads/identity-documents/`.
  * Created `documentVerificationService.ts` with AI/OCR analysis pipeline (with manual review fallback when OCR unavailable), quality checks, profile matching, and decision logic.
  * Created `identityDocumentController.ts` with comprehensive APIs:
    * `uploadIdentityDocument`: Secure upload with validation, AI analysis, verification status determination, and notification integration.
    * `getUserDocuments`: List all documents for current user.
    * `getDocumentById`: Get document with authorization check.
    * `viewDocumentFile`: Secure document viewing with token-based authorization.
    * `deleteDocument`: Delete documents (except verified ones).
    * `getAllVerificationRequests`: Admin endpoint to list all verification requests with filtering.
    * `reviewVerificationRequest`: Admin approval/rejection workflow with reason tracking.
    * `getVerificationStats`: Admin dashboard statistics.
  * Registered all identity document routes in `backend/src/routes/index.ts`.
  * Created frontend components:
    * `IdentityDocumentsCard.tsx`: Patient identity document upload and management UI with status badges.
    * `DoctorCredentialsCard.tsx`: Doctor professional credential upload and management UI.
    * `VerificationCenterPage.tsx`: Admin verification center dashboard with statistics, filtering, search, and review modal.
  * Updated `ProfileHeader.tsx` to display real verification badges based on backend verification status (Verified, Verification Pending, Unverified).
  * Updated patient and doctor profile controllers to include verification status in API responses.
  * Updated auth controller to include verification status in user responses.
  * Added "Identity & Documents" tab to Patient profile.
  * Added "Identity & Credentials" tab to Doctor profile.
  * Added "Verification Center" to Admin sidebar navigation.
  * Integrated notification system for verification events (upload, processing, approval, rejection).
  * Integrated audit logging for all document and verification actions.
  * Build verification: Backend TypeScript compilation passed, Frontend Vite build passed.

---

## 12. CURRENT TASK

* **Current Task:** Profile, Settings, Identity Verification & Credential Verification System
* **Status:** Complete & Verified (`npm run build` backend & frontend passed cleanly)
* **Files Modified/Created:**
  * `backend/prisma/schema.prisma` - Added IdentityDocument, VerificationRequest models and verification status fields
  * `backend/src/services/secureDocumentStorage.ts` - Secure document storage service
  * `backend/src/services/documentVerificationService.ts` - AI/OCR verification pipeline with manual review fallback
  * `backend/src/controllers/identityDocumentController.ts` - Complete document management and verification APIs
  * `backend/src/routes/index.ts` - Registered identity document routes
  * `backend/src/controllers/authController.ts` - Updated to include verification status in responses
  * `backend/src/controllers/patientController.ts` - Updated to include verification status
  * `backend/src/controllers/doctorController.ts` - Updated to include verification status
  * `frontend/src/components/profile/IdentityDocumentsCard.tsx` - Patient identity document UI
  * `frontend/src/components/profile/DoctorCredentialsCard.tsx` - Doctor credential UI
  * `frontend/src/components/profile/ProfileHeader.tsx` - Updated with real verification badges
  * `frontend/src/pages/admin/VerificationCenterPage.tsx` - Admin verification center dashboard
  * `frontend/src/pages/profile/UserProfilePage.tsx` - Added identity documents tabs
  * `frontend/src/App.tsx` - Added verification center route
  * `frontend/src/components/Sidebar.tsx` - Added verification center navigation
  * `AI_PROJECT_CONTEXT.md`

---

## 13. NEXT TASKS (12-Phase Roadmap)

1. `[x]` **Phase 1 — AI Medical Document Analyzer:** File validation, text/data extraction, structured entity parsing (tests, values, units, ranges), summary generation, database persistence, and timeline integration.
2. `[x]` **Phase 2 — Longitudinal Health Analysis:** Historical comparison of lab results & vitals, trend cards, direction classification, change calculation, reference range analysis, filtering, and doctor workflow integration.
3. `[x]` **Phase 3 — Existing ML Risk Prediction + AI Explanation Layer:** Preserve Random Forest / Isolation Forest outputs while adding an AI explanation layer detailing contributing factors, supporting records, and clinical limitations.
4. `[x]` **Phase 4 — Contextual AI Health Assistant:** Authorized patient-context QA assistant respecting RBAC and privacy (never hallucinating or cross-contaminating patient data).
5. `[x]` **Phase 5 — Disease Surveillance Intelligence:** Explanatory intelligence layer above existing DBSCAN and autoregressive forecasting.
6. `[x]` **Phase 6 — Medical Knowledge Retrieval:** Trustworthy medical evidence layer clearly distinguishing patient data vs general guidelines vs ML predictions.
7. `[x]` **Phase 7 — Advanced Clinical Decision Support & Care Pathway Intelligence:** Care protocols, clinical guidelines matching, and doctor decision-support recommendations.
8. `[x]` **Phase 8 — Profile, Settings, Identity Verification & Credential Verification:** Complete profile management system with secure document storage, AI/OCR verification pipeline, admin approval workflow, verification badges, notifications, and audit logging.
9. `[ ]` **Phase 9 — Admin Disease Intelligence Dashboard:** Enhanced population-health decision-support overview.
10. `[ ]` **Phase 10 — Security & RBAC Hardening:** Comprehensive review of file upload safety, SQL/ORM safety, input sanitization, and secret protection.
11. `[x]` **Phase 11 — UI/UX Polish:** Refined states (loading, empty, error, success), 3D assistant avatar, and streamlined patient experience.
12. `[ ]` **Phase 12 — End-to-End System Testing:** Multi-role integration testing, validation checks, and regression verification.

---

## 14. IMPORTANT TECHNICAL DECISIONS

1. **Single-Page Tabbed Routing vs Multiple Routers:** Navigation in `App.tsx` uses stateful role-aware tab routing. External sub-links (e.g., clicking *"Inspect Hotspots"* from Overview) pass tab identifiers that seamlessly activate the corresponding parent module sub-tab.
2. **High-Availability ML Client:** The Node.js backend must never crash or block clinical visits if the Python service is offline. Robust fallback heuristics must always be maintained in `mlClient.ts`.
3. **Decision-Support vs. Medical Diagnosis:** AI outputs must always be labeled with advisory terminology (*"Risk indication"*, *"Potential hotspot"*) to adhere to medical ethics and software safety standards.
4. **Data Isolation:** Contagious disease reports (`DiseaseReport`) are anonymized to age group, gender, and district coordinates, preserving patient privacy while enabling spatial surveillance.
5. **Real Extraction vs Mock:** Document processing parses actual files (PDF text & image documents), extracts structured lab parameters (measured values, reference ranges, units), detects abnormal out-of-range status, and persists directly into `LabReport` database model & patient notifications without simulated alerts.
6. **3D AI Health Assistant as Pure UI Layer:** The 3D robot (`FloatingHealthRobot.tsx`) serves exclusively as the visual presentation layer for the existing `/api/ai/chat` endpoint and patient EHR RAG pipeline. It never initiates parallel conversations, duplicates chat logic, or circumvents RBAC / audit logging. The 3D asset is lazy-loaded and code-split so Three.js is never loaded on unrelated pages.

---

## 15. IDENTITY VERIFICATION & CREDENTIAL VERIFICATION ARCHITECTURE

### Database Schema
- **IdentityDocument**: Stores uploaded identity/professional documents with secure storage references, document type, verification status, and metadata.
- **VerificationRequest**: Tracks verification workflow including AI analysis results, admin review decisions, reviewer info, and verification timeline.
- **Patient/Doctor**: Added `verificationStatus`, `verifiedDocumentType`, and `verifiedAt` fields to track verification state.

### Verification States
- `UNVERIFIED`: Initial state, no documents uploaded
- `DOCUMENTS_PENDING`: Documents uploaded but not yet processed
- `PROCESSING`: AI/OCR analysis in progress
- `AI_REVIEW`: AI analysis completed, decision pending
- `ADMIN_REVIEW`: Awaiting admin approval (required for doctors)
- `VERIFIED`: Successfully verified (auto-verified for patients with high AI confidence, admin-approved for doctors)
- `REVIEW_REQUIRED`: Needs additional information or manual review
- `REJECTED`: Verification failed
- `EXPIRED`: Verified credential has expired

### Secure Document Storage
- Documents stored in `uploads/identity-documents/` (private, not publicly accessible)
- Random server-side filenames (never trust original filenames)
- MIME type validation, file size limits (5MB), extension validation
- Token-based authorization for document viewing (no permanent public URLs)

### AI/OCR Verification Pipeline
- Quality check: File size, format validation
- OCR extraction: When available, extracts document fields (name, DOB, document number)
- Profile matching: Compares extracted fields with user profile (name match, DOB match)
- Decision logic: High confidence + good match = APPROVE (patients only), Low confidence = REVIEW_REQUIRED
- Fallback: When OCR unavailable, marks for manual review without fabricating results

### Admin Verification Workflow
- Dashboard shows statistics: pending patient/doctor verifications, verified, rejected, review required
- Verification queue with filtering, search, and status badges
- Review modal shows: user info, document preview, AI analysis, decision buttons
- Admin can: Approve, Reject (with reason), Request Information (with reason)
- Decision updates user verification status and triggers notifications

### Notifications
- Patient: Document uploaded, verification processing, verification completed, review required, rejected
- Doctor: Document uploaded, AI analysis completed, admin review started, approved, rejected, info requested
- Admin: New verification requires review

### Audit Logging
- Actions logged: DOCUMENT_UPLOADED, DOCUMENT_VIEWED, DOCUMENT_REPLACED, DOCUMENT_DELETED, AI_VERIFICATION_STARTED, AI_VERIFICATION_COMPLETED, VERIFICATION_REVIEW_STARTED, PATIENT_VERIFIED, DOCTOR_VERIFIED, VERIFICATION_REJECTED, VERIFICATION_INFO_REQUESTED, PROFILE_UPDATED, EMERGENCY_CONTACT_UPDATED, AVATAR_UPDATED

### UI Components
- `IdentityDocumentsCard.tsx`: Patient document upload with status badges
- `DoctorCredentialsCard.tsx`: Doctor credential upload with status badges
- `VerificationCenterPage.tsx`: Admin verification center with statistics and review workflow
- `ProfileHeader.tsx`: Displays real verification badges (Verified, Verification Pending, Unverified)

### Known Limitations
- OCR/AI service not configured: Currently uses manual review fallback. To enable actual OCR, integrate Tesseract, Google Vision API, AWS Textract, or similar service in `documentVerificationService.ts`.
- AI confidence scores are placeholder values when OCR is unavailable - the system correctly shows "Review Required" instead of fabricating scores.
- MFA currently limited to Admin accounts: TOTP MFA is fully implemented for Admin accounts. Patient/Doctor MFA can be enabled by removing the role check in `mfaController.ts` if needed.
- MFA not integrated into login flow: MFA verification exists as a separate endpoint but is not yet enforced during Admin login. The login flow does not require MFA before issuing JWT.
- Security notifications: Password changes and MFA events are logged to audit but not yet integrated with the notification system for user alerts.
- Password reset tokens not hashed: Tokens are stored in memory in plaintext for development. Production should use hashed tokens in database.
- Step-up authentication: Not yet implemented for sensitive operations (password changes, MFA disable, admin actions).
- Redis/Email infrastructure: Requires deployment configuration (Redis server, email service) for full production functionality. System fails safely if unavailable.

---

## 16. SECURITY HARDENING ARCHITECTURE

### Authentication Security
- **User Enumeration Prevention**: Registration and login use generic error messages to prevent account discovery.
- **Password Strength Validation**: Enforces minimum 8 characters, uppercase, lowercase, and number requirements on registration and password change.
- **Password Hashing**: Uses bcryptjs with salt rounds of 10 for secure password storage.
- **Rate Limiting**: Separate rate limiters for login (5 attempts/15min), registration (3 attempts/hour), and password reset (3 attempts/hour).
- **Account Lockout**: After 5 failed login attempts, account is locked for 30 minutes. Lockout state tracked in memory (production: Redis).
- **Login History**: All login attempts (success and failure) are logged with IP address, user agent, and failure reason.
- **Logout Endpoint**: `POST /api/auth/logout` with audit logging.

### Session Management (NEW - Production-Ready)
- **Redis-Backed Sessions**: JWT tokens now include `jti` (JWT ID) for server-side session tracking via Redis.
- **Session Storage**: Session data includes userId, role, ipAddress, userAgent, createdAt, lastActivity, revoked status.
- **Session Revocation**: 
  - Logout revokes the current session in Redis
  - Password change revokes all other sessions
  - Password reset revokes all sessions
  - Users can revoke specific sessions or all sessions except current
- **Session APIs**:
  - `GET /api/security/sessions`: List user's active sessions
  - `POST /api/security/sessions/:sessionId/revoke`: Revoke specific session
  - `POST /api/security/sessions/revoke-all`: Revoke all sessions except current
- **Fail-Safe**: If Redis is unavailable, sessions work without revocation capability (degraded security).
- **Session Service**: `sessionService.ts` provides Redis client management, session CRUD operations, and activity tracking.

### Authorization & RBAC
- **JWT Authentication**: Stateful verification with 7-day token expiration. JWTs now include `jti` for session revocation.
- **Role-Based Access Control**: Middleware enforces PATIENT, DOCTOR, ADMIN role checks on protected endpoints.
- **Resource Authorization**: IDOR prevention middleware (`authorization.ts`) applied to:
  - Patient endpoints: `requirePatientAccess` on profile, card, timeline, episodes, analytics, health trends, risk, family tree, referrals, clinical decision support
  - Doctor endpoints: `requireDoctorAccess` on doctor profile
  - Document endpoints: `requireDocumentAccess` on identity document view, download, delete
- **Authorization Logic**:
  - `requireResourceOwner`: Ensures users can only access their own resources (admins exempt)
  - `requirePatientAccess`: Validates patient data access (patient themselves or authorized doctors/admins)
  - `requireDoctorAccess`: Validates doctor data access (doctor themselves or admins)
  - `requireDocumentAccess`: Validates document access (document owner or admins)
- **Audit Logging**: Unauthorized access attempts are logged

### TOTP MFA Implementation
- **Library Integration**: `speakeasy` for TOTP generation and verification, `qrcode` for QR code generation.
- **MFA Controller** (`mfaController.ts`):
  - `POST /api/mfa/setup`: Generate secret and QR code
  - `POST /api/mfa/verify`: Verify OTP and enable MFA with 10 backup codes
  - `POST /api/mfa/verify-login`: Verify TOTP during login (not yet integrated into login flow)
  - `POST /api/mfa/disable`: Disable MFA with password verification (step-up authentication)
  - `GET /api/mfa/status`: Get MFA status
- **MFA Security**:
  - Password required to disable MFA (step-up authentication)
  - 10 single-use backup codes for recovery
  - 2-step time window for clock drift
  - Currently limited to Admin accounts (can be extended)
- **Database**: `MFASetup` model stores secret, enabled status, verified timestamp, backup codes.

### Security Headers & CORS
- **Helmet Middleware**: Configured with cross-origin resource policy and HSTS (production only).
- **CORS**: Configured to allow only `FRONTEND_URL` environment variable (localhost:5173 in development).
- **CSP**: Disabled for Vite compatibility in development; should be enabled in production.

### Password Reset Flow
- **Token-Based Reset**: Secure random tokens (32 bytes) with 1-hour expiration.
- **Single-Use Tokens**: Tokens invalidated after use and when new tokens are issued.
- **Generic Responses**: Prevents user enumeration during reset requests.
- **Password Strength Reset**: Same validation rules as password change apply.
- **Session Revocation**: Password reset now revokes all existing sessions.
- **Email Service**: `emailService.ts` provides nodemailer-based email abstraction with:
  - `sendPasswordResetEmail`: Sends reset link via email
  - `sendSecurityNotification`: Sends security alerts
  - Graceful degradation if email is unavailable (development mode returns token)
- **Audit Logging**: Reset requests and completions are logged.

### Database Security Models
- **LoginHistory**: Tracks login attempts with success/failure, IP, user agent, timestamps.
- **MFASetup**: Stores TOTP secret, enabled status, verified timestamp, backup codes.

### Security Settings UI
Updated `SecurityPrivacyCard.tsx`:
- **Password Change Form**: With real API integration, strength validation, loading states
- **Login History Display**: Shows recent login attempts from backend API
- **MFA Management**: Enable/disable MFA, QR code, backup codes
- **Active Sessions**: 
  - Lists all active sessions with device/browser info
  - Shows current session marker
  - Revoke individual sessions
  - "Log Out All Other Sessions" button
- **Active Session**: Current session information

### Security APIs
- `POST /api/auth/logout`: Logout with session revocation and audit logging
- `GET /api/security/settings`: Get current user's security settings
- `GET /api/security/login-history`: Get current user's login history
- `GET /api/security/login-history/:userId`: Admin-only endpoint to view any user's login history
- `GET /api/security/sessions`: List user's active sessions
- `POST /api/security/sessions/:sessionId/revoke`: Revoke specific session
- `POST /api/security/sessions/revoke-all`: Revoke all sessions except current
- `POST /api/mfa/setup`: Initialize MFA setup (generate secret and QR code)
- `POST /api/mfa/verify`: Verify OTP and enable MFA
- `POST /api/mfa/verify-login`: Verify TOTP during login
- `POST /api/mfa/disable`: Disable MFA with password verification

### Authentication UX Improvements (2026-10-06)
- **Password Strength Validation**: Frontend validation before API call (8+ chars, uppercase, lowercase, number)
- **Password Visibility Toggle**: Eye icon to show/hide password on login and registration forms
- **User-Friendly Error Messages**:
  - Registration: "An account with this email already exists" instead of generic error
  - Registration: "This medical license number is already registered" for duplicate licenses
  - Login: "Account temporarily locked due to too many failed attempts" for rate limiting
  - Login: "Invalid email or password" for credential errors
  - Demo login: "Unable to authenticate with demo account. Please ensure the backend is running and the database is seeded."
- **Removed Browser Alerts**: Replaced `alert()` with in-page error banners for professional UX
- **Demo Login Error Handling**: Landing page demo authentication now shows contextual error messages when backend is unavailable
- **Frontend Validation**: Email format, name length, phone number, required fields validated before API call
- **No Fake Authentication**: All authentication flows use real backend API with proper JWT/password hashing

### Profile & Settings UX Improvements (2026-10-06)
- **Profile Header**: Professional hero section with role-specific styling, verification badges, and avatar upload
- **Avatar Upload**: 
  - Replaced browser `alert()` with in-page notification banners
  - File size validation (5MB limit)
  - Loading state during upload
  - Success/error feedback with toast notifications
- **Document Upload UI**:
  - Replaced raw file input with professional drag-and-drop interface
  - Document type selection with clickable buttons (Passport, PAN, Driving Licence, Voter ID, Aadhaar)
  - Visual feedback on drag-over
  - File preview with filename display
  - Loading spinner during upload
  - Success message: "Document uploaded successfully! AI validation in progress..."
  - Supported formats: PDF, PNG, JPG/JPEG
- **Document Status Badges**:
  - Enhanced with borders and appropriate icons
  - Processing → ShieldCheck icon
  - AI Review → ShieldCheck icon
  - Admin Review → AlertTriangle icon
  - Verified → CheckCircle2 icon
  - Review Required → AlertTriangle icon
  - Rejected → XCircle icon
- **Token Storage Fix**: Document view now uses correct localStorage key `smarthealth_token` instead of `token`
- **Security & Privacy Card**:
  - Password change form with inline validation
  - MFA setup/verify/disable flow (Admin-only)
  - Active sessions display with device/browser info
  - Session revocation (individual and all sessions)
  - Login history timeline
  - All using real backend APIs
- **Profile Tabs**:
  - Patient: Personal, Emergency, Medical, Identity & Documents, Notifications, Security
  - Doctor: Profile, Professional Details, Hospital & Department, Availability, Identity & Credentials, Notifications, Security
  - Admin: Profile, Role & Access, Account Settings, Notifications, Security & Access
- **Modal-Based Editing**: Profile edit uses modal/drawer instead of inline forms
- **No Browser Alerts**: All profile errors use in-page notification banners with dismiss buttons
- `GET /api/mfa/status`: Get MFA status

### Audit Logging
Security events logged: LOGIN_SUCCESS, LOGIN_FAILED, LOGIN_BLOCKED, LOGOUT, PASSWORD_CHANGED, PASSWORD_CHANGE_FAILED, PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED, MFA_SETUP_INITIATED, MFA_VERIFICATION_FAILED, MFA_ENABLED, MFA_DISABLED, MFA_LOGIN_SUCCESS, MFA_LOGIN_FAILED, SESSION_CREATED, SESSION_REVOKED, ALL_SESSIONS_REVOKED, UNAUTHORIZED_ACCESS_ATTEMPT, UNAUTHORIZED_DOCUMENT_ACCESS.

### Production Infrastructure Requirements
- **Redis**: Required for session revocation and distributed rate limiting
- **Email Service**: Required for password reset delivery (AWS SES, SendGrid, SMTP)
- **PostgreSQL**: Database with SSL/TLS enabled
- **TLS/SSL**: Required for all connections in production
- **Environment Variables**: Proper configuration for all services

### Dependency Security
- **npm audit**: All vulnerabilities resolved (0 vulnerabilities remaining)
- **Packages updated**: morgan, proxy-addr, qs, express upgraded to secure versions

### Configuration Files
- **.env.example**: Template for environment configuration with all required variables
- **PRODUCTION_CONFIGURATION.md**: Comprehensive production deployment guide
- **tsconfig.json**: TypeScript configuration updated

### Remaining Security Tasks (Future Enhancements)
- **MFA Login Enforcement**: Integrate MFA verification into Admin login flow (currently separate endpoint)
- **Step-Up Authentication**: Extend MFA requirement to sensitive operations (password changes, admin actions, bulk operations)
- **Security Notifications**: Integrate password changes, MFA events, and suspicious login detection with existing notification system.
- **Password Reset Token Hashing**: Store hashed tokens in database instead of in-memory plaintext
- **Environment Variable Validation**: Add startup validation for required production environment variables
- **Redis Rate Limiting Integration**: Replace in-memory rate limiting with Redis-backed implementation (service created but not integrated)
- **Patient/Doctor MFA**: Enable MFA for Patient and Doctor roles by removing role check in `mfaController.ts`

---

## 15. KNOWN ISSUES & AUDIT FINDINGS

* `[x]` **Mock Document Upload (RESOLVED in Phase 1):** Replaced simulated client `alert()` in `MedicalRecordsPage.tsx` with authenticated multipart `POST /api/patients/documents/upload` API.
* `[ ]` **Static Mock Records in Clinical View:** In `MedicalRecordsPage.tsx`, the `Clinical Records` tab uses a hardcoded `RECORDS` constant, whereas the `Medical Timeline` and `Disease Episodes` tabs connect to live backend APIs.
* `[ ]` **No LLM Integration Currently Installed:** While Python scikit-learn models exist for risk, anomaly, DBSCAN, and forecasting, no LLM provider (OpenRouter/Gemini/OpenAI) is currently configured in the backend.
* `[ ]` **Weather Widget Static:** Top navbar weather widget renders static values (`28°C Partly Cloudy`); can be wired to real weather API.

---

## 16. DO NOT BREAK

When implementing new features, you **MUST NOT** break:
1. **Authentication & RBAC:** Role guards in `App.tsx` and middleware in `auth.ts` / `rbac.ts`.
2. **Emergency Profile Route:** Public accessibility of `/api/emergency/:healthId` without auth requirements.
3. **Surveillance Auto-Sync:** Automated trigger in `visitController.ts` creating `DiseaseReport` and updating `LocationRisk`.
4. **Drug Allergy Checker:** Automatic cross-checking of prescription medications against patient allergies.
5. **DBSCAN & Forecast Visualizations:** Leaflet map layers and Chart.js epidemic curves.
6. **Unified Module Architecture:** Keep Medical Records, Doctor Patients, and Disease Surveillance tabbed workflows consolidated.

---

## 17. DEVELOPMENT RULES FOR AI AGENTS

* **Inspect before duplicate:** Always check existing services in `backend/src/services/` and components in `frontend/src/components/` before creating new ones.
* **Reuse existing APIs:** Never create duplicate endpoints if an existing route can provide the data.
* **No Fake Data:** Connect frontend components to real backend APIs using `api.get` / `api.post`.
* **Zero Secret Leaks:** Never commit raw passwords, tokens, or `.env` files.
* **Build Verification:** Run `npm run build` in both `frontend/` and `backend/` to verify TypeScript compilation before finishing tasks.
* **Maintain Context:** Update this `AI_PROJECT_CONTEXT.md` file whenever major architecture or feature changes are completed.
