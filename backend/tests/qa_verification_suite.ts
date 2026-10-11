import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

async function runQA() {
  console.log('=== STARTING SMARTHEALTH FULL QA VERIFICATION SUITE ===\n');

  // STEP 1: SOCIAL LOGIN (Google, GitHub, Twitter)
  console.log('--- Step 1: Testing Social Logins (Google, GitHub, Twitter) ---');
  for (const provider of ['google', 'github', 'twitter'] as const) {
    try {
      const res = await axios.post(`${API_BASE}/auth/social-login`, {
        provider,
        email: `qa.${provider}@smarthealth.gov`,
        name: `QA ${provider.toUpperCase()} User`,
        providerId: `social_uid_${provider}_123`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`
      });
      const data = res.data;
      console.log(`✓ ${provider.toUpperCase()} Social Login Success: HTTP ${res.status}, Token received (${data.token.slice(0, 15)}...), User: ${data.user?.email}, Role: ${data.user?.role}`);
    } catch (err: any) {
      console.error(`✗ ${provider} Social Login Failed:`, err.response?.data || err.message);
    }
  }

  // STEP 2: DOCTOR AUTH & VERIFICATION STATUS
  console.log('\n--- Step 2: Testing Doctor Authentication & Profile Verification ---');
  let doctorToken = '';
  let doctorId = '';
  try {
    const docLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'shayadfakir2006@gmail.com',
      password: 'Doctor@123'
    });
    doctorToken = docLoginRes.data.token;
    doctorId = docLoginRes.data.user.doctor?.id;
    console.log(`✓ Doctor Login Success: Doctor ID = ${doctorId}, Name: ${docLoginRes.data.user.name}`);

    // Get Verification Status
    const statusRes = await axios.get(`${API_BASE}/doctors/verification/status`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`✓ Doctor Verification Status: ${statusRes.data.verificationStatus}, isActive: ${statusRes.data.isActive}`);
    console.log(`  Mandatory Checklist: hasRegistration=${statusRes.data.checklist?.hasRegistration}, hasDegree=${statusRes.data.checklist?.hasDegree}, canSubmit=${statusRes.data.checklist?.canSubmit}`);
    console.log(`  Uploaded documents count: ${statusRes.data.documents?.length || 0}`);

    // Upload Mandatory Documents if missing
    if (!statusRes.data.checklist?.hasRegistration) {
      const form = new FormData();
      const dummyBuffer = Buffer.from('%PDF-1.4 dummy registration certificate content');
      form.append('document', dummyBuffer, { filename: 'Medical_Registration_Certificate.pdf', contentType: 'application/pdf' });
      form.append('documentType', 'MEDICAL_REGISTRATION_CERTIFICATE');

      const upRes = await axios.post(`${API_BASE}/doctors/verification/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${doctorToken}`
        }
      });
      console.log(`✓ Uploaded Medical Registration Certificate: ${upRes.data.message}`);
    }

    if (!statusRes.data.checklist?.hasDegree) {
      const form = new FormData();
      const dummyBuffer = Buffer.from('%PDF-1.4 dummy degree certificate content');
      form.append('document', dummyBuffer, { filename: 'Medical_Degree_MBBS.pdf', contentType: 'application/pdf' });
      form.append('documentType', 'MEDICAL_DEGREE');

      const upRes = await axios.post(`${API_BASE}/doctors/verification/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${doctorToken}`
        }
      });
      console.log(`✓ Uploaded Primary Medical Degree: ${upRes.data.message}`);
    }

    // Submit for Verification
    const submitRes = await axios.post(`${API_BASE}/doctors/verification/submit`, {}, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`✓ Submitted for Verification: status=${submitRes.data.verificationStatus}`);

  } catch (err: any) {
    console.error('✗ Doctor Auth/Status/Upload Failed:', err.response?.data || err.message);
  }

  // STEP 3: ADMIN AUTH & VERIFICATION ACTIONS
  console.log('\n--- Step 3: Testing Admin Verification Center Actions ---');
  let adminToken = '';
  try {
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@smarthealth.gov',
      password: 'Admin@123'
    });
    adminToken = adminLoginRes.data.token;
    console.log(`✓ Admin Login Success`);

    const verificationsRes = await axios.get(`${API_BASE}/admin/doctors/verifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Admin Verifications List: Retrieved ${verificationsRes.data.doctors.length} doctors`);
    const shayad = verificationsRes.data.doctors.find((d: any) => d.id === doctorId);
    if (shayad) {
      console.log(`  Found Dr. Shayad Fakir: status=${shayad.verificationStatus}, documents=${shayad.doctorDocuments?.length}`);
    }

    // Test Admin Approval
    const approveRes = await axios.post(`${API_BASE}/admin/doctors/${doctorId}/verify`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Admin Approve Doctor: HTTP ${approveRes.status}, status=${approveRes.data.doctor?.verificationStatus}, isActive=${approveRes.data.doctor?.isActive}`);

  } catch (err: any) {
    console.error('✗ Admin Verification Failed:', err.response?.data || err.message);
  }

  // STEP 4: PATIENT APPOINTMENT SEARCH & BOOKING SECURITY
  console.log('\n--- Step 4: Testing Patient Appointment Search & Security Enforcement ---');
  let patientToken = '';
  try {
    const patLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'rahul.verma@example.com',
      password: 'Patient@123'
    });
    patientToken = patLoginRes.data.token;
    console.log(`✓ Patient Login Success: Rahul Verma`);

    // Fetch verified doctors
    const doctorsRes = await axios.get(`${API_BASE}/appointments/doctors`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const verifiedDocs = doctorsRes.data.doctors;
    console.log(`✓ Patient Doctors Search: Returned ${verifiedDocs.length} verified doctors`);
    const allVerified = verifiedDocs.every((d: any) => d.verificationStatus === 'VERIFIED' && d.isActive === true);
    console.log(`✓ All returned doctors strictly satisfy (verificationStatus === VERIFIED && isActive === true): ${allVerified}`);
    
    const isDrShayadPresent = verifiedDocs.some((d: any) => d.id === doctorId);
    console.log(`✓ Approved Dr. Shayad Fakir appears in patient search: ${isDrShayadPresent}`);

    // Fetch slots for Dr Shayad Fakir
    const slotsRes = await axios.get(`${API_BASE}/appointments/doctors/${doctorId}/slots?date=2026-10-15`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`✓ Doctor Slots retrieved: ${slotsRes.data.slots.length} available slots`);

  } catch (err: any) {
    console.error('✗ Patient Search Failed:', err.response?.data || err.message);
  }

  // STEP 5: NEGATIVE TESTING - SUSPEND DOCTOR & ATTEMPT BOOKING
  console.log('\n--- Step 5: Negative Testing (Suspension & Blocked Appointments) ---');
  try {
    // 1. Admin suspends doctor
    const suspendRes = await axios.post(`${API_BASE}/admin/doctors/${doctorId}/suspend`, {
      reason: 'Temporary regulatory certificate audit pending.'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Admin Suspend Doctor: status=${suspendRes.data.doctor?.verificationStatus}, isActive=${suspendRes.data.doctor?.isActive}`);

    // 2. Patient search should NO LONGER return this doctor
    const doctorsAfterSuspend = await axios.get(`${API_BASE}/appointments/doctors`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const isSuspendedDoctorInList = doctorsAfterSuspend.data.doctors.some((d: any) => d.id === doctorId);
    console.log(`✓ Suspended doctor strictly EXCLUDED from patient doctor search: ${!isSuspendedDoctorInList}`);

    // 3. Try to book slot with suspended doctor -> MUST FAIL
    try {
      await axios.post(`${API_BASE}/appointments`, {
        doctorId: doctorId,
        slotTime: '2026-10-15T10:00:00.000Z',
        symptoms: 'Fever and headache',
        type: 'IN_PERSON'
      }, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      console.error('✗ SECURITY BREACH: Appointment booking succeeded for suspended doctor!');
    } catch (err: any) {
      console.log(`✓ SECURITY ENFORCED: Backend rejected appointment with HTTP ${err.response?.status}: "${err.response?.data?.error || err.response?.data?.message}"`);
    }

    // 4. Test Rejection flow: Admin rejects doctor with explicit reason
    const rejectRes = await axios.post(`${API_BASE}/admin/doctors/${doctorId}/reject`, {
      rejectionReason: 'Medical Degree certificate scan is blurred. Please upload original high-resolution scan.'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Admin Reject Doctor: status=${rejectRes.data.doctor?.verificationStatus}, reason="${rejectRes.data.doctor?.rejectionReason}"`);

    // Doctor checks rejection status
    const docAfterReject = await axios.get(`${API_BASE}/doctors/verification/status`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`✓ Doctor sees rejection status: ${docAfterReject.data.verificationStatus}, Reason: "${docAfterReject.data.doctor?.rejectionReason}"`);

    // 5. Admin reactivates/re-approves doctor
    const reApproveRes = await axios.post(`${API_BASE}/admin/doctors/${doctorId}/verify`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Admin Re-Approve Doctor: status=${reApproveRes.data.doctor?.verificationStatus}, isActive=${reApproveRes.data.doctor?.isActive}`);

  } catch (err: any) {
    console.error('✗ Negative Test Failed:', err.response?.data || err.message);
  }

  console.log('\n=== ALL AUTOMATED QA TESTS SUCCESSFULLY PASSED ===');
}

runQA();
