import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Smart Healthcare Database Seed ---');

  // Clear existing records to allow clean re-seeding
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.campScreening.deleteMany({});
  await prisma.healthCamp.deleteMany({});
  await prisma.communityAlert.deleteMany({});
  await prisma.locationRisk.deleteMany({});
  await prisma.diseaseReport.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.labReport.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.diseaseEpisode.deleteMany({});
  await prisma.familyMember.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('Admin@123', 10);
  const doctorPasswordHash = await bcrypt.hash('Doctor@123', 10);
  const patientPasswordHash = await bcrypt.hash('Patient@123', 10);

  // 1. Create Hospitals in Kopargaon & Shirdi Belt
  const hospitalCentral = await prisma.hospital.create({
    data: {
      name: 'Kopargaon Rural & General Hospital',
      address: 'Near Municipal Council, Main Road, Kopargaon',
      district: 'Kopargaon',
      lat: 19.8917,
      lng: 74.4789,
      contactPhone: '+91 2423 222100',
    },
  });

  const clinicRiverside = await prisma.hospital.create({
    data: {
      name: 'Shirdi Sai Sansthan Super Specialty Hospital',
      address: 'Ahmednagar-Manmad Road, Shirdi',
      district: 'Shirdi',
      lat: 19.7645,
      lng: 74.4762,
      contactPhone: '+91 2423 258500',
    },
  });

  const hospitalGreenValley = await prisma.hospital.create({
    data: {
      name: 'Rahata Sub-District Healthcare Center',
      address: 'Nagar-Manmad Highway, Rahata',
      district: 'Rahata',
      lat: 19.7125,
      lng: 74.4842,
      contactPhone: '+91 2423 243200',
    },
  });

  console.log('Created Hospitals.');

  // 2. Create Default Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@smarthealth.gov',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      name: 'Dr. Anita Desai (Chief Surveillance Officer)',
      phone: '+91 98765 43210',
    },
  });

  // 3. Create Doctors
  const doctorUser1 = await prisma.user.create({
    data: {
      email: 'dr.sharma@smarthealth.gov',
      passwordHash: doctorPasswordHash,
      role: 'DOCTOR',
      name: 'Dr. Rajesh Sharma',
      phone: '+91 98111 22233',
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      userId: doctorUser1.id,
      licenseNumber: 'MCI-KA-2015-08491',
      specialty: 'Internal Medicine & Cardiology',
      qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
      experienceYears: 14,
      hospitalId: hospitalCentral.id,
      verificationStatus: 'VERIFIED',
      verifiedDocumentType: 'MCI Medical Registration License',
      verifiedAt: new Date(),
    },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      email: 'dr.priya@smarthealth.gov',
      passwordHash: doctorPasswordHash,
      role: 'DOCTOR',
      name: 'Dr. Priya Nair',
      phone: '+91 98222 33344',
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: doctorUser2.id,
      licenseNumber: 'MCI-KA-2018-11204',
      specialty: 'Infectious Diseases & Epidemiology',
      qualification: 'MBBS, MD (Infectious Diseases), MPH',
      experienceYears: 8,
      hospitalId: clinicRiverside.id,
      verificationStatus: 'VERIFIED',
      verifiedDocumentType: 'MCI Medical Registration License',
      verifiedAt: new Date(),
    },
  });

  const doctorUser3 = await prisma.user.create({
    data: {
      email: 'dr.vikram@smarthealth.gov',
      passwordHash: doctorPasswordHash,
      role: 'DOCTOR',
      name: 'Dr. Vikram Seth',
      phone: '+91 98333 44455',
    },
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      userId: doctorUser3.id,
      licenseNumber: 'MCI-KA-2012-05988',
      specialty: 'Pediatrics & Family Medicine',
      qualification: 'MBBS, DCH, DNB (Pediatrics)',
      experienceYears: 16,
      hospitalId: hospitalGreenValley.id,
      verificationStatus: 'VERIFIED',
      verifiedDocumentType: 'MCI Medical Registration License',
      verifiedAt: new Date(),
    },
  });

  console.log('Created Doctors.');

  // 4. Create Primary Demo Patient (Rahul Verma)
  const patientUser1 = await prisma.user.create({
    data: {
      email: 'rahul.verma@example.com',
      passwordHash: patientPasswordHash,
      role: 'PATIENT',
      name: 'Rahul Verma',
      phone: '+91 99000 11223',
    },
  });

  const primaryPatient = await prisma.patient.create({
    data: {
      userId: patientUser1.id,
      healthId: 'SHC-2026-000001',
      dob: new Date('1988-06-15'),
      gender: 'MALE',
      bloodGroup: 'O+',
      address: 'Near Godavari River Bank, Tilak Nagar, Kopargaon',
      district: 'Kopargaon',
      lat: 19.8917,
      lng: 74.4789,
      emergencyContactName: 'Sunita Verma (Mother)',
      emergencyContactPhone: '+91 99000 99887',
      allergies: 'Penicillin, Amoxicillin',
      chronicConditions: 'Hypertension, Pre-diabetes',
    },
  });

  // Family Members for Rahul Verma (Hereditary Cardiovascular Pattern)
  await prisma.familyMember.createMany({
    data: [
      {
        patientId: primaryPatient.id,
        relation: 'Father',
        name: 'Ramesh Verma',
        age: 68,
        condition: 'Cardiovascular Disease',
        ageAtDiagnosis: 54,
        notes: 'Underwent angioplasty at age 58. Currently on statin therapy.',
      },
      {
        patientId: primaryPatient.id,
        relation: 'Mother',
        name: 'Sunita Verma',
        age: 64,
        condition: 'Type 2 Diabetes',
        ageAtDiagnosis: 50,
        notes: 'Diet and Metformin managed.',
      },
      {
        patientId: primaryPatient.id,
        relation: 'Brother',
        name: 'Amit Verma',
        age: 38,
        condition: 'Cardiovascular Disease',
        ageAtDiagnosis: 36,
        notes: 'Diagnosed with early-onset ischemic heart disease.',
      },
      {
        patientId: primaryPatient.id,
        relation: 'Grandfather',
        name: 'Mohanlal Verma',
        age: 82,
        condition: 'Cardiovascular Disease',
        ageAtDiagnosis: 60,
        notes: 'Paternal grandfather; history of myocardial infarction.',
      },
      {
        patientId: primaryPatient.id,
        relation: 'Sister',
        name: 'Pooja Verma',
        age: 34,
        condition: 'None',
        notes: 'Healthy baseline; no reported chronic conditions.',
      },
    ],
  });

  console.log('Created Primary Patient (Rahul Verma) and Family Tree.');

  // 5. Create Chronological Disease Episode & Medical Records for Rahul Verma
  const malariaEpisode = await prisma.diseaseEpisode.create({
    data: {
      patientId: primaryPatient.id,
      disease: 'Malaria',
      episodeCode: 'MAL-EP-001',
      status: 'RESOLVED',
      startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      resolvedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      severity: 'MODERATE',
      summary: 'Acute Plasmodium vivax infection treated with Artemisinin-based combination therapy. Full clinical recovery documented.',
    },
  });

  // Visit 1: Initial Acute Malaria Presentation (28 days ago)
  const visit1 = await prisma.medicalRecord.create({
    data: {
      patientId: primaryPatient.id,
      doctorId: doctor2.id,
      hospitalId: clinicRiverside.id,
      episodeId: malariaEpisode.id,
      visitDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      symptoms: 'High grade cyclical fever (103°F), severe shaking chills, profuse sweating, headache, nausea, generalized body aches.',
      diagnosis: 'Acute Malaria (Plasmodium vivax suspected)',
      disease: 'Malaria',
      severity: 'SEVERE',
      systolicBp: 130,
      diastolicBp: 84,
      glucose: 108,
      bmi: 27.2,
      heartRate: 108,
      temperature: 103.2,
      spo2: 97,
      clinicalNotes: 'Patient lives in Riverside District. Rapid diagnostic test (RDT) positive for P. vivax. Ordered confirmatory peripheral smear and platelet count. Commencing ACT regimen.',
      visitClassification: 'NEW_CONDITION',
      aiRiskLevel: 'MODERATE',
      aiRiskScore: 52.0,
      aiAnomalyDetected: true,
      aiAnomalyDetails: 'High fever (103.2 °F), Tachycardia (108 bpm)',
      locationDistrict: 'Riverside District',
      lat: 12.9716,
      lng: 77.5946,
    },
  });

  await prisma.prescription.create({
    data: {
      recordId: visit1.id,
      patientId: primaryPatient.id,
      doctorId: doctor2.id,
      medicineName: 'Artemether + Lumefantrine (Coartem)',
      dosage: '80mg/480mg',
      frequency: 'Twice daily with meals',
      durationDays: 3,
      instructions: 'Complete full 3-day course. Take with fatty meal or milk for absorption.',
      status: 'COMPLETED',
    },
  });

  await prisma.prescription.create({
    data: {
      recordId: visit1.id,
      patientId: primaryPatient.id,
      doctorId: doctor2.id,
      medicineName: 'Paracetamol (Crocin)',
      dosage: '650mg',
      frequency: 'Every 6 hours as needed for fever > 101°F',
      durationDays: 5,
      instructions: 'Do not exceed 3 grams daily.',
      status: 'COMPLETED',
    },
  });

  await prisma.labReport.create({
    data: {
      recordId: visit1.id,
      patientId: primaryPatient.id,
      testName: 'Peripheral Blood Smear for Malaria',
      testCategory: 'Hematology',
      measuredValue: 1.0,
      unit: 'index (1=positive)',
      normalRangeMin: 0,
      normalRangeMax: 0,
      isOutOfRange: true,
      outOfRangeType: 'HIGH',
      trendDirection: 'STABLE',
      reportDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      labTechnician: 'Dr. Priya Nair',
      notes: 'Schizonts and ring forms of Plasmodium vivax visualized.',
    },
  });

  await prisma.labReport.create({
    data: {
      recordId: visit1.id,
      patientId: primaryPatient.id,
      testName: 'Platelet Count',
      testCategory: 'Hematology',
      measuredValue: 92,
      unit: '10^3/uL',
      normalRangeMin: 150,
      normalRangeMax: 450,
      isOutOfRange: true,
      outOfRangeType: 'LOW',
      trendDirection: 'DOWNWARD',
      trendWarning: 'Thrombocytopenia secondary to acute malaria.',
      reportDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      labTechnician: 'Central Hematology Lab',
    },
  });

  // Visit 2: Follow-up & Response Check (21 days ago)
  const visit2 = await prisma.medicalRecord.create({
    data: {
      patientId: primaryPatient.id,
      doctorId: doctor2.id,
      hospitalId: clinicRiverside.id,
      episodeId: malariaEpisode.id,
      visitDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      symptoms: 'Mild residual fatigue. Fever has completely subsided. Appetite improving.',
      diagnosis: 'Malaria - Recovering',
      disease: 'Malaria',
      severity: 'MODERATE',
      systolicBp: 124,
      diastolicBp: 80,
      glucose: 114,
      bmi: 27.0,
      heartRate: 82,
      temperature: 98.8,
      spo2: 98,
      clinicalNotes: 'Good clinical response to ACT regimen. Patient afebrile for 48 hours. Platelet count recovering.',
      visitClassification: 'IMPROVING',
      aiRiskLevel: 'LOW',
      aiRiskScore: 32.0,
      aiAnomalyDetected: false,
      locationDistrict: 'Riverside District',
      lat: 12.9716,
      lng: 77.5946,
    },
  });

  await prisma.labReport.create({
    data: {
      recordId: visit2.id,
      patientId: primaryPatient.id,
      testName: 'Platelet Count',
      testCategory: 'Hematology',
      measuredValue: 148,
      unit: '10^3/uL',
      normalRangeMin: 150,
      normalRangeMax: 450,
      isOutOfRange: true,
      outOfRangeType: 'LOW',
      trendDirection: 'UPWARD',
      trendWarning: 'Platelets showing strong upward recovery.',
      reportDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      labTechnician: 'Central Hematology Lab',
    },
  });

  // Visit 3: Resolution Visit (10 days ago)
  const visit3 = await prisma.medicalRecord.create({
    data: {
      patientId: primaryPatient.id,
      doctorId: doctor2.id,
      hospitalId: clinicRiverside.id,
      episodeId: malariaEpisode.id,
      visitDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      symptoms: 'Completely asymptomatic. Good energy and normal appetite.',
      diagnosis: 'Malaria - Full Clinical & Parasitological Resolution',
      disease: 'Malaria',
      severity: 'MILD',
      systolicBp: 122,
      diastolicBp: 78,
      glucose: 125,
      bmi: 27.1,
      heartRate: 74,
      temperature: 98.4,
      spo2: 99,
      clinicalNotes: 'Repeat peripheral smear negative. Platelets normalized. Marking malaria episode as RESOLVED.',
      visitClassification: 'RESOLVED',
      aiRiskLevel: 'LOW',
      aiRiskScore: 24.0,
      aiAnomalyDetected: false,
      locationDistrict: 'Riverside District',
      lat: 12.9716,
      lng: 77.5946,
    },
  });

  await prisma.labReport.create({
    data: {
      recordId: visit3.id,
      patientId: primaryPatient.id,
      testName: 'Peripheral Blood Smear for Malaria',
      testCategory: 'Hematology',
      measuredValue: 0.0,
      unit: 'index',
      normalRangeMin: 0,
      normalRangeMax: 0,
      isOutOfRange: false,
      outOfRangeType: 'NORMAL',
      reportDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      labTechnician: 'Dr. Priya Nair',
      notes: 'No malarial parasites seen. Smear clear.',
    },
  });

  await prisma.labReport.create({
    data: {
      recordId: visit3.id,
      patientId: primaryPatient.id,
      testName: 'Platelet Count',
      testCategory: 'Hematology',
      measuredValue: 220,
      unit: '10^3/uL',
      normalRangeMin: 150,
      normalRangeMax: 450,
      isOutOfRange: false,
      outOfRangeType: 'NORMAL',
      trendDirection: 'UPWARD',
      reportDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      labTechnician: 'Central Hematology Lab',
    },
  });

  // Visit 4: Cardiometabolic Consultation with Dr. Sharma (3 days ago)
  const hypertensionEpisode = await prisma.diseaseEpisode.create({
    data: {
      patientId: primaryPatient.id,
      disease: 'Hypertension',
      episodeCode: 'HYP-EP-001',
      status: 'ACTIVE',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      severity: 'MODERATE',
      summary: 'Stage 1 Essential Hypertension with concurrent impaired fasting glucose and family history of premature CAD.',
    },
  });

  const visit4 = await prisma.medicalRecord.create({
    data: {
      patientId: primaryPatient.id,
      doctorId: doctor1.id,
      hospitalId: hospitalCentral.id,
      episodeId: hypertensionEpisode.id,
      visitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      symptoms: 'Mild occipital morning headaches, occasional palpitations after exertion. Patient notes strong family history of heart disease.',
      diagnosis: 'Stage 1 Hypertension & Impaired Fasting Glycemia',
      disease: 'Hypertension',
      severity: 'MODERATE',
      systolicBp: 146,
      diastolicBp: 92,
      glucose: 142,
      bmi: 27.5,
      heartRate: 78,
      temperature: 98.6,
      spo2: 98,
      clinicalNotes: 'Blood pressure elevated across 2 readings (146/92 mmHg). Fasting glucose in pre-diabetic / early diabetic range (142 mg/dL). Strong family history (Father & Brother with CAD). Initiating Telmisartan and lifestyle dietary modifications.',
      visitClassification: 'NEW_CONDITION',
      aiRiskLevel: 'HIGH',
      aiRiskScore: 78.5,
      aiAnomalyDetected: false,
      locationDistrict: 'Riverside District',
      lat: 12.9716,
      lng: 77.5946,
    },
  });

  await prisma.prescription.create({
    data: {
      recordId: visit4.id,
      patientId: primaryPatient.id,
      doctorId: doctor1.id,
      medicineName: 'Telmisartan',
      dosage: '40mg',
      frequency: 'Once daily in the morning',
      durationDays: 30,
      instructions: 'Monitor blood pressure weekly. Report any persistent dry cough or dizziness.',
      status: 'ACTIVE',
    },
  });

  // Fasting Blood Glucose Series demonstrating upward progression
  await prisma.labReport.create({
    data: {
      recordId: visit4.id,
      patientId: primaryPatient.id,
      testName: 'Fasting Blood Glucose',
      testCategory: 'Biochemistry',
      measuredValue: 142,
      unit: 'mg/dL',
      normalRangeMin: 70,
      normalRangeMax: 100,
      isOutOfRange: true,
      outOfRangeType: 'HIGH',
      trendDirection: 'UPWARD',
      trendWarning: 'Continuous upward progression detected across reports (108 -> 125 -> 142 mg/dL). Diabetic evaluation recommended.',
      reportDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      labTechnician: 'Dr. Rajesh Sharma',
      notes: 'Confirmed impaired fasting glycemia.',
    },
  });

  await prisma.labReport.create({
    data: {
      recordId: visit4.id,
      patientId: primaryPatient.id,
      testName: 'HbA1c',
      testCategory: 'Biochemistry',
      measuredValue: 6.7,
      unit: '%',
      normalRangeMin: 4.0,
      normalRangeMax: 5.6,
      isOutOfRange: true,
      outOfRangeType: 'HIGH',
      trendDirection: 'UPWARD',
      reportDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      labTechnician: 'Central Pathology',
      notes: 'Consistent with early Type 2 Diabetes.',
    },
  });

  console.log('Created Primary Patient medical visits, prescriptions, and lab history.');

  // 6. Create 55 Additional Realistic Patients across Kopargaon, Shirdi & Rahata Belt
  const districts = [
    { name: 'Kopargaon', lat: 19.8917, lng: 74.4789 },
    { name: 'Shirdi', lat: 19.7645, lng: 74.4762 },
    { name: 'Rahata', lat: 19.7125, lng: 74.4842 },
    { name: 'Sangamner', lat: 19.5772, lng: 74.2074 },
    { name: 'Yeola', lat: 20.0422, lng: 74.4886 },
  ];

  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aayush', 'Rudra', 'Kabir', 'Ananya', 'Diya', 'Gauri', 'Isha', 'Kavya', 'Khushi', 'Meera', 'Navya', 'Pooja', 'Pari', 'Riya', 'Saanvi', 'Tanvi', 'Vanya', 'Zoya', 'Aditi', 'Tara', 'Sneha', 'Deepak', 'Suresh', 'Manish', 'Naveen', 'Rohan', 'Karan', 'Simran', 'Neha', 'Sunita', 'Geeta', 'Lakshmi', 'Ramesh', 'Vijay', 'Alok', 'Mohan', 'Sanjay', 'Sunil', 'Preeti', 'Swati'];
  const lastNames = ['Patel', 'Sharma', 'Rao', 'Kumar', 'Singh', 'Reddy', 'Iyer', 'Nair', 'Verma', 'Gupta', 'Mehta', 'Joshi', 'Bhat', 'Deshmukh', 'Chopra', 'Pillai', 'Menon', 'Kulkarni', 'Das', 'Chatterjee'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const generatedPatients = [primaryPatient];

  for (let i = 2; i <= 60; i++) {
    const fn = firstNames[(i * 3) % firstNames.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@example.com`;
    const distIdx = i <= 32 ? 0 : (i % districts.length); // 50% in Kopargaon to populate local outbreak!
    const dist = districts[distIdx];

    const u = await prisma.user.create({
      data: {
        email,
        passwordHash: patientPasswordHash,
        role: 'PATIENT',
        name: `${fn} ${ln}`,
        phone: `+91 ${98000 + i} ${10000 + i}`,
      },
    });

    const p = await prisma.patient.create({
      data: {
        userId: u.id,
        healthId: `SHC-2026-${String(i).padStart(6, '0')}`,
        dob: new Date(1955 + (i % 45), (i % 12), (i % 28) + 1),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        bloodGroup: bloodGroups[i % bloodGroups.length],
        address: `House ${10 + i}, ${dist.name} Belt`,
        district: dist.name,
        lat: dist.lat + (Math.random() - 0.5) * 0.03,
        lng: dist.lng + (Math.random() - 0.5) * 0.03,
        emergencyContactName: `Emergency Contact for ${fn}`,
        emergencyContactPhone: `+91 99000 ${String(10000 + i)}`,
        allergies: i % 5 === 0 ? 'Penicillin' : (i % 8 === 0 ? 'Sulfa' : ''),
        chronicConditions: i % 4 === 0 ? 'Hypertension' : (i % 6 === 0 ? 'Type 2 Diabetes' : ''),
      },
    });

    generatedPatients.push(p);
  }

  console.log(`Seeded ${generatedPatients.length} realistic patients in Kopargaon-Shirdi sector.`);

  // 7. Seed Intentional Outbreak Data in Kopargaon & Shirdi
  console.log('Generating intentional Dengue & Malaria outbreak in Kopargaon and Shirdi...');

  const outbreakConfigs = [
    // Week -4 (28-22 days ago): 5 cases in Kopargaon
    { count: 5, daysAgoMin: 22, daysAgoMax: 28, disease: 'Dengue', district: 'Kopargaon', lat: 19.8917, lng: 74.4789 },
    // Week -3 (21-15 days ago): 11 cases in Kopargaon
    { count: 11, daysAgoMin: 15, daysAgoMax: 21, disease: 'Dengue', district: 'Kopargaon', lat: 19.8925, lng: 74.4800 },
    // Week -2 (14-8 days ago): 20 cases in Kopargaon
    { count: 20, daysAgoMin: 8, daysAgoMax: 14, disease: 'Dengue', district: 'Kopargaon', lat: 19.8910, lng: 74.4775 },
    // Week -1 (7-0 days ago): 35 cases in Kopargaon
    { count: 35, daysAgoMin: 0, daysAgoMax: 7, disease: 'Dengue', district: 'Kopargaon', lat: 19.8920, lng: 74.4795 },
    // A secondary Malaria cluster in Shirdi (14 cases)
    { count: 14, daysAgoMin: 0, daysAgoMax: 14, disease: 'Malaria', district: 'Shirdi', lat: 19.7645, lng: 74.4762 },
    // Typhoid cases in Rahata (8 cases)
    { count: 8, daysAgoMin: 0, daysAgoMax: 20, disease: 'Typhoid', district: 'Rahata', lat: 19.7125, lng: 74.4842 },
  ];

  let reportCount = 0;
  for (const cfg of outbreakConfigs) {
    for (let j = 0; j < cfg.count; j++) {
      const daysAgo = cfg.daysAgoMin + Math.random() * (cfg.daysAgoMax - cfg.daysAgoMin);
      const repDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await prisma.diseaseReport.create({
        data: {
          disease: cfg.disease,
          district: cfg.district,
          lat: cfg.lat + (Math.random() - 0.5) * 0.02,
          lng: cfg.lng + (Math.random() - 0.5) * 0.02,
          reportDate: repDate,
          ageGroup: j % 4 === 0 ? '<18' : (j % 4 === 1 ? '18-45' : (j % 4 === 2 ? '46-60' : '60+')),
          gender: j % 2 === 0 ? 'MALE' : 'FEMALE',
          severity: j % 5 === 0 ? 'SEVERE' : (j % 3 === 0 ? 'MODERATE' : 'MILD'),
          source: 'CLINICAL_VISIT',
        },
      });
      reportCount++;
    }
  }

  console.log(`Seeded ${reportCount} surveillance disease reports.`);

  // 8. Pre-populate LocationRisks & CommunityAlerts
  await prisma.locationRisk.createMany({
    data: [
      {
        district: 'Kopargaon',
        disease: 'Dengue',
        totalCases: 71,
        activeCases: 35,
        weeklyGrowthRate: 75.0,
        riskLevel: 'HIGH_RISK',
        hotspotClusterId: 'HOTSPOT-DEN-01',
        aiInsight: 'CRITICAL OUTBREAK: Dengue cases in Kopargaon escalated by +75% over the past 2 weeks (35 active cases). Geospatial DBSCAN clustering detected active vector transmission hotspot centered at lat 19.8920, lng 74.4795 (Tilak Nagar / Godavari river bank).',
        recommendedAction: 'Deploy municipal vector fogging units and approve the recommended Community Dengue Screening Camp.',
        lastEvaluatedAt: new Date(),
      },
      {
        district: 'Shirdi',
        disease: 'Malaria',
        totalCases: 18,
        activeCases: 14,
        weeklyGrowthRate: 45.0,
        riskLevel: 'WARNING',
        hotspotClusterId: 'HOTSPOT-MAL-02',
        aiInsight: 'SURVEILLANCE WARNING: Emerging Malaria fever cluster in Shirdi (14 cases this week, +45% growth). Early clinical warning flag triggered.',
        recommendedAction: 'Broadcast community mosquito avoidance advisory and monitor platelet surveillance.',
        lastEvaluatedAt: new Date(),
      },
      {
        district: 'Rahata',
        disease: 'Typhoid',
        totalCases: 10,
        activeCases: 4,
        weeklyGrowthRate: 15.0,
        riskLevel: 'NORMAL',
        aiInsight: 'Baseline sporadic Typhoid presentations in Rahata. Parameters within acceptable municipal threshold.',
        recommendedAction: 'Routine water quality testing and food hygiene enforcement.',
        lastEvaluatedAt: new Date(),
      },
    ],
  });

  // Active Community Alert for Kopargaon
  await prisma.communityAlert.create({
    data: {
      district: 'Kopargaon',
      disease: 'Dengue',
      riskLevel: 'HIGH_RISK',
      title: '🚨 High-Risk Dengue Outbreak Alert in Kopargaon',
      message: 'Active epidemiological surveillance indicates a significant localized escalation in Dengue cases across Kopargaon (Godavari river corridor). Residents are advised to take urgent mosquito bite precautions.',
      precautions: '1. Use DEET/Picaridin mosquito repellents and sleep under bed nets.\n2. Inspect containers, flowerpots, and drains; remove standing water.\n3. Wear light-colored, long-sleeved clothing.\n4. Seek immediate medical evaluation if high fever, joint pain, or rash develops.',
      isActive: true,
      createdAt: new Date(),
    },
  });

  // Recommended Community Health Camp
  await prisma.healthCamp.create({
    data: {
      district: 'Kopargaon',
      venue: 'Kopargaon Municipal Secondary School & Community Center',
      targetDisease: 'Dengue',
      campDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      capacity: 300,
      doctorsAssigned: 'Dr. Priya Nair, Dr. Rajesh Sharma (Epidemiology Response Taskforce)',
      status: 'RECOMMENDED',
      recommendationReason: 'Automated AI recommendation: High-density DBSCAN cluster (35 active cases) detected in Kopargaon. Rapid community screening, NS1 antigen testing, and preventative education required.',
      screenedCount: 0,
      createdAt: new Date(),
    },
  });

  // Dispatch initial Notifications to Patient 1 (Rahul Verma)
  await prisma.notification.createMany({
    data: [
      {
        userId: primaryPatient.userId,
        title: '🚨 Community Alert: Dengue Outbreak in Kopargaon',
        message: 'Public health authorities have identified an elevated cluster of Dengue cases in your district (Kopargaon). Please review mosquito safety guidance.',
        type: 'DISEASE_ALERT',
        priority: 'CRITICAL',
        district: 'Kopargaon',
        relatedDisease: 'Dengue',
        isRead: false,
      },
      {
        userId: primaryPatient.userId,
        title: 'Cardiometabolic Risk Indicator: Doctor Review Recommended',
        message: 'Your recent blood pressure (146/92 mmHg) and fasting glucose (142 mg/dL) combined with family history show an elevated cardiometabolic risk score.',
        type: 'AI_HEALTH_FLAG',
        priority: 'WARNING',
        district: 'Kopargaon',
        isRead: false,
      },
    ],
  });

  // Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        userRole: 'ADMIN',
        action: 'SYSTEM_INITIALIZATION',
        resource: 'DATABASE',
        details: 'System database successfully seeded with population models and outbreak telemetry.',
      },
      {
        userId: doctorUser2.id,
        userRole: 'DOCTOR',
        action: 'VIEW_PATIENT_RECORD',
        resource: 'PATIENT',
        resourceId: primaryPatient.id,
        details: 'Initial clinical intake for Rahul Verma (SHC-2026-000001)',
      },
    ],
  });

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log('Demo Credentials:');
  console.log('  Admin:   admin@smarthealth.gov / Admin@123');
  console.log('  Doctor:  dr.sharma@smarthealth.gov / Doctor@123');
  console.log('  Patient: rahul.verma@example.com / Patient@123 (ID: SHC-2026-000001)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
