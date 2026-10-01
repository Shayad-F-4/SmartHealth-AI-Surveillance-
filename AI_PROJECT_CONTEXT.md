# AI_PROJECT_CONTEXT.md
> **Single Source of Truth for AI Agents & Developers**  
> **Last Verified & Updated:** 2026-10-01  
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
* **Patients:** Access digital Smart Health Card (QR-enabled), view clinical records, track health trends (BP, glucose, BMI), review hereditary family risks, and monitor local community disease advisories.
* **Doctors / Clinicians:** Search and scan patient QR codes, review longitudinal medical history, launch seamless consultations with automated vital anomaly detection, cross-check drug allergies in real-time, order lab tests, and refer to specialists.
* **Public Health Administrators & Epidemiologists:** Command center oversight of real-time disease cases, Leaflet geospatial mapping, DBSCAN spatial outbreak clustering, 4-week autoregressive case forecasting, population analytics, community health alerts, and field health camp coordination.
* **Emergency Responders / Paramedics:** Public-safe emergency profile lookup via QR code displaying only critical life-saving data (blood group, severe allergies, chronic conditions, emergency contacts) without exposing private clinical consultation notes.

---

## 2. CURRENT TECHNOLOGY STACK

```text
Frontend:
  - React 19 (TypeScript)
  - Vite (Build Tool & Dev Server)
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
* `[x]` Role-Based Access Control (`PATIENT`, `DOCTOR`, `ADMIN`)
* `[x]` Immutable Audit Trail Logging (User actions, timestamps, IP address)
* `[x]` Notification System with real-time unread badges

### Public & Emergency
* `[x]` Landing Page with quick demo credentials
* `[x]` User Registration (Patient & Doctor workflows)
* `[x]` Public Emergency Health Profile (`/emergency/:healthId` — QR-scannable, sanitizes private notes)

### Patient Portal
* `[x]` Patient Overview Dashboard
* `[x]` Smart Health Card (with QR code generation)
* `[x]` Unified Medical Records:
  * `[x]` Clinical Records (Search, filter by category: Consultations, Labs, Imaging, etc.)
  * `[x]` Medical Timeline (Chronological, immutable visit log)
  * `[x]` Disease Episodes (Groups multi-visit disease episodes from onset to resolution)
* `[x]` Longitudinal Health Trends (BP Systolic/Diastolic and Glucose time-series charts)
* `[x]` AI Health Risk Predictor (Metabolic & cardiovascular risk percentage, contributing factors)
* `[x]` Family Health Tree (Pedigree chart identifying hereditary cardiovascular/metabolic conditions)
* `[x]` Prescriptions Archive (Medication status, dosage, duration, allergy flags)
* `[x]` Lab Reports Repository (Out-of-range flagging, units, reference intervals)
* `[x]` Specialist Referrals Tracker
* `[x]` Citizen Disease Surveillance Advisory

### Doctor Portal
* `[x]` Doctor Dashboard (Daily shift stats, recently attended patients)
* `[x]` Unified Patients Workflow:
  * `[x]` Search by Health ID, name, or phone
  * `[x]` Optical QR Reader Terminal simulator
  * `[x]` Comprehensive Patient Profile & History Inspection (Timeline, Episodes, Family, Labs, Card)
  * `[x]` In-workflow Clinical Consultation intake
  * `[x]` Real-time Drug Allergy Conflict Detection
  * `[x]` Automated Vital Sign Physiological Anomaly Detection
  * `[x]` Automated Disease Surveillance Sync (contagious cases automatically report to surveillance)
  * `[x]` Lab test ordering and Specialist referral issuance
* `[x]` Doctor Referrals Management
* `[x]` Local Disease Surveillance Map

### Admin & Public Health Surveillance
* `[x]` Healthcare Operations Dashboard (System-wide KPIs, registered population, active camps)
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
* `POST /api/auth/login` — Authentication and JWT token issuance
* `GET  /api/auth/me` — Authenticated user profile fetch

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

* **Current Phase:** Phase 0 Completed (Initial System Audit & Architecture Alignment) -> Entering Phase 1 (AI Medical Document Analyzer)
* **Current Feature:** Initial Architecture Audit & Implementation Assessment
* **Status:** Operational & Audited
* **Last Completed Task:** Codebase audit, verified 18 Prisma models, confirmed scikit-learn models & backend fallbacks, verified UI design system and GitHub synchronization.
* **Current Problem:** File upload in MedicalRecordsPage is currently simulated client-side (mock alert); no structured document extraction pipeline is connected to the database yet.
* **Next Task:** PHASE 1 — AI Medical Document Analyzer (Secure upload, validation, OCR/text extraction, structured medical entity parsing, timeline linking).

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

---

## 12. CURRENT TASK

* **Current Task:** Initial System Audit & Implementation Assessment
* **Status:** Complete
* **Files Modified/Created:** `AI_PROJECT_CONTEXT.md`
* **Expected Result:** Clear audit report presented to user identifying existing vs missing capabilities, broken/mock integrations, and ready to start Phase 1 upon confirmation.

---

## 13. NEXT TASKS (12-Phase Roadmap)

1. **Phase 1 — AI Medical Document Analyzer:** File validation, text/data extraction, structured entity parsing (tests, values, units, ranges), summary generation, and timeline integration.
2. **Phase 2 — Longitudinal Health Analysis:** Historical comparison of lab results & vitals, trend charts, change detection, and timeline correlation without unsupported diagnoses.
3. **Phase 3 — Existing ML Risk Prediction + AI Explanation Layer:** Preserve Random Forest / Isolation Forest outputs while adding an AI explanation layer detailing contributing factors, supporting records, and clinical limitations.
4. **Phase 4 — Contextual AI Health Assistant:** Authorized patient-context QA assistant respecting RBAC and privacy (never hallucinating or cross-contaminating patient data).
5. **Phase 5 — Disease Surveillance Intelligence:** Explanatory intelligence layer above existing DBSCAN and autoregressive forecasting.
6. **Phase 6 — Medical Knowledge Retrieval:** Trustworthy medical evidence layer clearly distinguishing patient data vs general guidelines vs ML predictions.
7. **Phase 7 — Smart Medical Timeline:** Unify consultations, labs, prescriptions, vaccinations, AI document findings, and health changes into a clickable, record-linked timeline.
8. **Phase 8 — Doctor Dashboard Patient Summary:** High-density, efficient patient review interface minimizing navigation during active shifts.
9. **Phase 9 — Admin Disease Intelligence Dashboard:** Enhanced population-health decision-support overview.
10. **Phase 10 — Security & RBAC Hardening:** Comprehensive review of file upload safety, SQL/ORM safety, input sanitization, and secret protection.
11. **Phase 11 — UI/UX Polish:** Refined states (loading, empty, error, success) and accessibility across all portals.
12. **Phase 12 — End-to-End System Testing:** Multi-role integration testing, validation checks, and regression verification.

---

## 14. IMPORTANT TECHNICAL DECISIONS

1. **Single-Page Tabbed Routing vs Multiple Routers:** Navigation in `App.tsx` uses stateful role-aware tab routing. External sub-links (e.g., clicking *"Inspect Hotspots"* from Overview) pass tab identifiers that seamlessly activate the corresponding parent module sub-tab.
2. **High-Availability ML Client:** The Node.js backend must never crash or block clinical visits if the Python service is offline. Robust fallback heuristics must always be maintained in `mlClient.ts`.
3. **Decision-Support vs. Medical Diagnosis:** AI outputs must always be labeled with advisory terminology (*"Risk indication"*, *"Potential hotspot"*) to adhere to medical ethics and software safety standards.
4. **Data Isolation:** Contagious disease reports (`DiseaseReport`) are anonymized to age group, gender, and district coordinates, preserving patient privacy while enabling spatial surveillance.
5. **Real Extraction vs Mock:** Document processing must parse actual files (PDF/image text) and map them to real Prisma records (`LabReport`, `MedicalRecord`) rather than displaying static mocks.

---

## 15. KNOWN ISSUES & AUDIT FINDINGS

* `[ ]` **Mock Document Upload:** The "Upload Record" button in `MedicalRecordsPage.tsx` currently triggers a client-side `alert()` simulation. It needs a real `multipart/form-data` upload endpoint with validation, storage, and parser.
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
