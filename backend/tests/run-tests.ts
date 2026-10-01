import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const ML_BASE = 'http://127.0.0.1:8000';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`, detail || '');
    failed++;
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('  SMART HEALTHCARE SYSTEM: AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let adminToken = '';
  let doctorToken = '';
  let patientToken = '';
  let patientHealthId = 'SHC-2026-000001';
  let patientId = '';

  // 1. Authentication Tests
  console.log('--- Suite 1: Authentication & JWT Generation ---');
  try {
    const adminRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@smarthealth.gov',
      password: 'Admin@123',
    });
    adminToken = adminRes.data.token;
    assert(adminRes.data.user.role === 'ADMIN', 'Admin Login Authenticates with ADMIN role');
  } catch (e: any) {
    assert(false, 'Admin Login Authenticates with ADMIN role', e.message);
  }

  try {
    const doctorRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'dr.sharma@smarthealth.gov',
      password: 'Doctor@123',
    });
    doctorToken = doctorRes.data.token;
    assert(doctorRes.data.user.role === 'DOCTOR', 'Doctor Login Authenticates with DOCTOR role');
  } catch (e: any) {
    assert(false, 'Doctor Login Authenticates with DOCTOR role', e.message);
  }

  try {
    const patientRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'rahul.verma@example.com',
      password: 'Patient@123',
    });
    patientToken = patientRes.data.token;
    patientId = patientRes.data.user.patient.id;
    assert(patientRes.data.user.role === 'PATIENT', 'Patient Login Authenticates with PATIENT role');
    assert(patientRes.data.user.patient.healthId.startsWith('SHC-2026-'), 'Health ID follows SHC-2026-XXXXXX format');
  } catch (e: any) {
    assert(false, 'Patient Login Authenticates with PATIENT role', e.message);
  }

  // 2. RBAC Enforcement Tests
  console.log('\n--- Suite 2: Role-Based Access Control (RBAC) Enforcement ---');
  try {
    // Patient attempts to create a consultation visit (should return 403 Forbidden)
    await axios.post(
      `${API_BASE}/visits`,
      { patientId, disease: 'Malaria', symptoms: 'Test', diagnosis: 'Test', severity: 'MILD' },
      { headers: { Authorization: `Bearer ${patientToken}` } }
    );
    assert(false, 'Patient is rejected when attempting doctor-only consultation endpoint');
  } catch (e: any) {
    assert(e.response?.status === 403, 'Patient is rejected (403 Forbidden) when attempting doctor-only consultation endpoint');
  }

  try {
    // Doctor attempts to create a manual administrative alert (should return 403 Forbidden)
    await axios.post(
      `${API_BASE}/alerts`,
      { district: 'Metro North', disease: 'Malaria', title: 'Test', message: 'Test' },
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    assert(false, 'Doctor is rejected when attempting admin-only alert broadcast endpoint');
  } catch (e: any) {
    assert(e.response?.status === 403, 'Doctor is rejected (403 Forbidden) when attempting admin-only alert broadcast endpoint');
  }

  // 3. Clinical Safety & Allergy Conflict Engine
  console.log('\n--- Suite 3: Clinical Safety & Medication Allergy Engine ---');
  try {
    // Patient has allergy to 'Penicillin'. Doctor prescribes Amoxicillin (Penicillin class)
    const visitRes = await axios.post(
      `${API_BASE}/visits`,
      {
        patientId,
        symptoms: 'Mild throat discomfort',
        diagnosis: 'Bacterial Pharyngitis',
        disease: 'Other',
        severity: 'MILD',
        systolicBp: 122,
        diastolicBp: 80,
        glucose: 98,
        bmi: 25.0,
        heartRate: 72,
        temperature: 98.6,
        spo2: 99,
        prescriptions: [
          { medicineName: 'Amoxicillin + Clavulanate (Augmentin)', dosage: '625mg', frequency: 'Twice daily', durationDays: 5 },
        ],
      },
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );

    const rx = visitRes.data.prescriptions[0];
    assert(rx.allergyWarningTriggered === true, 'Allergy Conflict Engine triggers on cross-reactive Penicillin medication');
    assert(visitRes.data.allergyWarnings.length > 0, 'Clinician warning message returned with allergy context');
  } catch (e: any) {
    assert(false, 'Allergy Conflict Engine triggers on cross-reactive Penicillin medication', e.message);
  }

  // 4. Disease Episode Classification & Immutability
  console.log('\n--- Suite 4: Smart Disease Episode System & Record Immutability ---');
  try {
    const timelineBefore = await axios.get(`${API_BASE}/patients/timeline/${patientId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const countBefore = timelineBefore.data.length;

    // Record follow-up visit for Malaria
    const followUpRes = await axios.post(
      `${API_BASE}/visits`,
      {
        patientId,
        symptoms: 'Mild post-treatment fatigue, afebrile',
        diagnosis: 'Malaria follow-up',
        disease: 'Malaria',
        severity: 'MILD',
        systolicBp: 120,
        diastolicBp: 78,
        glucose: 96,
        bmi: 26.0,
        heartRate: 70,
        temperature: 98.4,
        spo2: 99,
      },
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );

    assert(followUpRes.data.episode.episodeCode.startsWith('MAL-EP-'), 'Visit automatically grouped under existing Malaria episode code');

    const timelineAfter = await axios.get(`${API_BASE}/patients/timeline/${patientId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(timelineAfter.data.length === countBefore + 1, 'Medical records are append-only and preserve chronological timeline');
  } catch (e: any) {
    assert(false, 'Smart Disease Episode classification & append-only timeline', e.message);
  }

  // 5. Family Health Tree & Hereditary Pattern Engine
  console.log('\n--- Suite 5: Family Health Tree & Pattern Detection ---');
  try {
    const famRes = await axios.get(`${API_BASE}/family/tree/${patientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(famRes.data.members.length >= 3, 'Family members retrieved and categorized into generational tiers');
    assert(famRes.data.patterns.length > 0, 'Multi-generation Cardiovascular Disease pattern detected and flagged');
    assert(famRes.data.patterns[0].disclaimer.includes('not constitute a clinical diagnosis'), 'Family pattern advisory clearly labeled as risk awareness, not diagnosis');
  } catch (e: any) {
    assert(false, 'Family Health Tree pattern detection', e.message);
  }

  // 6. Python ML Microservice Endpoints
  console.log('\n--- Suite 6: AI/ML Service Endpoints (Models A, B, C, D) ---');
  try {
    // Model A: Risk Prediction
    const riskRes = await axios.post(`${ML_BASE}/predict-risk`, {
      age: 62,
      bmi: 32.4,
      systolic_bp: 154,
      diastolic_bp: 96,
      fasting_glucose: 155,
      family_history_flag: 1,
      chronic_conditions_count: 2,
    });
    assert(riskRes.data.risk_level === 'HIGH', 'Model A (Random Forest) correctly classifies high-risk cardiometabolic profile');
    assert(riskRes.data.contributing_factors.length >= 3, 'Model A outputs structured explainability factors');

    // Model B: Anomaly Detection
    const anomalyRes = await axios.post(`${ML_BASE}/detect-anomaly`, {
      systolic_bp: 195,
      diastolic_bp: 115,
      fasting_glucose: 310,
      heart_rate: 130,
      bmi: 28.0,
      temperature: 104.5,
    });
    assert(anomalyRes.data.is_anomaly === true, 'Model B (Isolation Forest) flags hypertensive/hyperglycemic physiological anomaly');

    // Model C: Hotspot Detection
    const hotspotRes = await axios.post(`${ML_BASE}/detect-hotspots`, {
      cases: [
        { id: '1', disease: 'Malaria', district: 'Riverside District', lat: 12.9716, lng: 77.5946 },
        { id: '2', disease: 'Malaria', district: 'Riverside District', lat: 12.9720, lng: 77.5950 },
        { id: '3', disease: 'Malaria', district: 'Riverside District', lat: 12.9712, lng: 77.5940 },
        { id: '4', disease: 'Malaria', district: 'Riverside District', lat: 12.9718, lng: 77.5948 },
      ],
      eps_km: 2.0,
      min_samples: 3,
    });
    assert(hotspotRes.data.total_clusters >= 1, 'Model C (DBSCAN) aggregates localized coordinates into spatial cluster');

    // Model D: Disease Forecasting
    const forecastRes = await axios.post(`${ML_BASE}/forecast-cases`, {
      disease: 'Malaria',
      district: 'Riverside District',
      historical_weekly_cases: [6, 12, 22, 38],
      forecast_weeks: 4,
    });
    assert(forecastRes.data.predicted_weekly_cases.length === 4, 'Model D forecasts 4-week future disease trajectory');
    assert(forecastRes.data.trend === 'INCREASING', 'Model D detects increasing outbreak momentum');
  } catch (e: any) {
    assert(false, 'ML Microservice endpoints', e.message);
  }

  // 7. Public Emergency Health Profile (Privacy Verification)
  console.log('\n--- Suite 7: Public Emergency QR Profile (Privacy Protection) ---');
  try {
    const emergRes = await axios.get(`${API_BASE}/emergency/${patientHealthId}`);
    assert(emergRes.data.bloodGroup === 'O+', 'Emergency profile exposes vital blood group');
    assert(emergRes.data.criticalAllergies.length > 0, 'Emergency profile exposes critical drug allergies');
    assert(emergRes.data.emergencyContact.phone !== undefined, 'Emergency contact phone number provided');
    assert(emergRes.data.clinicalNotes === undefined, 'STRICT PRIVACY: Detailed clinical doctor notes are excluded');
    assert(emergRes.data.medicalRecords === undefined, 'STRICT PRIVACY: Full visit history is excluded');
  } catch (e: any) {
    assert(false, 'Public Emergency Profile privacy check', e.message);
  }

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
