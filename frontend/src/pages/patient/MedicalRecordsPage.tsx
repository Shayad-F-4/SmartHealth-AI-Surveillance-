import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Calendar,
  FlaskConical,
  Upload,
  Download,
  Share2,
  Eye,
  Search,
  ChevronDown,
  X,
  ShieldCheck,
  ArrowRight,
  Droplets,
  Pill,
  Syringe,
  Stethoscope,
  ScanLine,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { MedicalTimelinePage } from './MedicalTimelinePage';
import api from '../../services/api';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type RecordCategory =
  | 'All Records'
  | 'Consultations'
  | 'Lab Reports'
  | 'Prescriptions'
  | 'Imaging'
  | 'Vaccinations'
  | 'Other';

export interface MedicalRecordItem {
  id: string;
  date: string;
  title: string;
  description: string;
  category: Exclude<RecordCategory, 'All Records'>;
  doctor: string;
  facility: string;
  results?: { label: string; value: string }[];
  status?: 'Normal' | 'Abnormal' | 'Active' | 'Pending';
  isLive?: boolean;
}

const STATIC_RECORDS: MedicalRecordItem[] = [
  {
    id: 'r1',
    date: '22 Aug 2026',
    title: 'Complete Blood Count (CBC)',
    description: 'WBC, RBC, Platelets, Hemoglobin panel',
    category: 'Lab Reports',
    doctor: 'Dr. Rajesh Sharma',
    facility: 'Metro Central Hospital',
    status: 'Normal',
    results: [
      { label: 'WBC', value: '6.2 ×10³/µL' },
      { label: 'RBC', value: '4.8 ×10⁶/µL' },
      { label: 'Platelets', value: '210 ×10³/µL' },
      { label: 'Hemoglobin', value: '13.1 g/dL' },
    ],
  },
  {
    id: 'r2',
    date: '05 Aug 2026',
    title: 'Chest X-Ray (PA View)',
    description: 'Bilateral lung fields clear. No consolidation or effusion.',
    category: 'Imaging',
    doctor: 'Dr. Priya Mehta',
    facility: 'City Diagnostics',
    status: 'Normal',
  },
  {
    id: 'r3',
    date: '15 Jul 2026',
    title: 'Artemisinin Combination Therapy',
    description: 'Antimalarial therapeutic regimen (3-day course)',
    category: 'Prescriptions',
    doctor: 'Dr. Priya Mehta',
    facility: 'City Health Center',
    status: 'Normal',
  },
  {
    id: 'r4',
    date: '01 Jul 2026',
    title: 'Typhoid Conjugate Vaccination',
    description: 'Immunization Booster — Single Dose (0.5 mL IM)',
    category: 'Vaccinations',
    doctor: 'Public Health Officer',
    facility: 'Riverside Health Camp',
    status: 'Normal',
  },
  {
    id: 'r5',
    date: '20 Jun 2026',
    title: 'Routine Health Consultation',
    description: 'Annual wellness exam and metabolic risk counseling.',
    category: 'Consultations',
    doctor: 'Dr. Neha Kapoor',
    facility: 'Riverside Clinic',
    status: 'Normal',
  },
  {
    id: 'r6',
    date: '12 May 2026',
    title: 'Abdominal Ultrasound',
    description: 'Normal hepatic parenchyma. No focal lesions.',
    category: 'Imaging',
    doctor: 'Dr. Arvind Rao',
    facility: 'City Diagnostics',
    status: 'Normal',
  },
  {
    id: 'r7',
    date: '30 Mar 2026',
    title: 'Lipid Profile Panel',
    description: 'Total Cholesterol, HDL, LDL, Triglycerides assessment',
    category: 'Lab Reports',
    doctor: 'Dr. Rajesh Sharma',
    facility: 'Metro Central Hospital',
    status: 'Normal',
    results: [
      { label: 'Total Cholesterol', value: '182 mg/dL' },
      { label: 'HDL', value: '48 mg/dL' },
      { label: 'LDL', value: '110 mg/dL' },
      { label: 'Triglycerides', value: '145 mg/dL' },
    ],
  },
  {
    id: 'r8',
    date: '14 Jan 2026',
    title: 'Seasonal Fever Discharge Summary',
    description: 'Viral fever management. Fully resolved post supportive care.',
    category: 'Other',
    doctor: 'Dr. Neha Kapoor',
    facility: 'Riverside Hospital',
    status: 'Normal',
  },
];

const CATEGORIES: RecordCategory[] = [
  'All Records',
  'Lab Reports',
  'Prescriptions',
  'Consultations',
  'Vaccinations',
  'Imaging',
  'Other',
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Lab Reports': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  Imaging: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
  Prescriptions: { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
  Vaccinations: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  Consultations: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  Other: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
};

function RecordIcon({ title, category, color }: { title: string; category: string; color: string }) {
  const t = title.toLowerCase();
  let Icon = FileText;
  if (t.includes('blood') || t.includes('cbc') || t.includes('lipid') || category === 'Lab Reports') Icon = Droplets;
  else if (t.includes('x-ray') || t.includes('ultrasound') || t.includes('scan') || category === 'Imaging') Icon = ScanLine;
  else if (t.includes('prescription') || t.includes('medicine') || category === 'Prescriptions') Icon = Pill;
  else if (t.includes('vaccination') || t.includes('vaccine') || category === 'Vaccinations') Icon = Syringe;
  else if (t.includes('consultation') || t.includes('checkup') || category === 'Consultations') Icon = Stethoscope;
  else if (t.includes('discharge') || t.includes('summary')) Icon = ClipboardList;

  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        background: color + '15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={20} color={color} />
    </div>
  );
}

function CategoryPill({ cat }: { cat: string }) {
  const s = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Other'];
  return (
    <span
      style={{
        padding: '0.2rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 700,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {cat}
    </span>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const isAbnormal = status === 'Abnormal';
  const isActive = status === 'Active';
  let bg = '#ECFDF5';
  let color = '#065F46';
  let border = '#A7F3D0';
  let text = '✓ Normal';

  if (isAbnormal) {
    bg = '#FEF2F2';
    color = '#991B1B';
    border = '#FECACA';
    text = '⚠ Abnormal';
  } else if (isActive) {
    bg = '#EFF6FF';
    color = '#1D4ED8';
    border = '#BFDBFE';
    text = '● Active';
  }

  return (
    <span
      style={{
        padding: '0.2rem 0.6rem',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 700,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {text}
    </span>
  );
}

/* ─── Add Health Record Modal ─────────────────────────────────────────── */

function AddHealthRecordModal({
  onClose,
  onRecordAdded,
}: {
  onClose: () => void;
  onRecordAdded?: () => void;
}) {
  const [selectedType, setSelectedType] = useState<string>('Lab Report');
  const [title, setTitle] = useState('');
  const [doctor, setDoctor] = useState('');
  const [facility, setFacility] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const RECORD_TYPES = [
    { label: 'Lab Report', desc: 'Blood, urine, pathology, metabolic panels' },
    { label: 'Prescription', desc: 'Medication name, dosage, doctor instructions' },
    { label: 'Consultation', desc: 'Doctor visit summary, clinical evaluation' },
    { label: 'Vaccination', desc: 'Immunization dose, vaccine type, certificate' },
    { label: 'Imaging', desc: 'X-Ray, Ultrasound, CT, MRI scans' },
    { label: 'Other Document', desc: 'Discharge summary, referral, fitness slip' },
  ];

  const handleUpload = async () => {
    if (!file && !title.trim()) {
      setErrorMsg('Please select a file or provide a record title.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      if (file) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('title', title.trim() || file.name);
        if (description) formData.append('description', description);

        const token = localStorage.getItem('token');
        const response = await fetch('/api/patients/documents/upload', {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload document.');
        }

        setExtractedData(data);
      } else {
        // Form-only entry
        alert(`Record "${title}" added successfully.`);
        if (onRecordAdded) onRecordAdded();
        onClose();
        return;
      }

      if (onRecordAdded) onRecordAdded();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: '1.75rem',
          width: '100%',
          maxWidth: 580,
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Add Health Record
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Upload clinical documents or enter records into your permanent health archive.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '0.4rem', cursor: 'pointer' }}
          >
            <X size={18} color="#64748b" />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        {extractedData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, marginBottom: '0.35rem' }}>
                <CheckCircle size={18} /> Record Analyzed &amp; Persisted to Archive
              </div>
              <p style={{ fontSize: '0.86rem', color: '#15803d', margin: 0 }}>
                {extractedData.extractedData?.summary || 'Document extracted and stored into your health records repository.'}
              </p>
            </div>

            {extractedData.extractedData?.labTests && extractedData.extractedData.labTests.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Extracted Lab Parameters ({extractedData.extractedData.labTests.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 180, overflowY: 'auto' }}>
                  {extractedData.extractedData.labTests.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.testName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {t.measuredValue} {t.unit || ''}
                        </span>
                        <StatusPill status={t.status === 'ABNORMAL' ? 'Abnormal' : 'Normal'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                marginTop: '0.5rem',
                padding: '0.65rem 1.25rem',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Done &amp; View Records
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Record Type Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Select Record Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                {RECORD_TYPES.map((rt) => (
                  <button
                    key={rt.label}
                    type="button"
                    onClick={() => setSelectedType(rt.label)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: `1.5px solid ${selectedType === rt.label ? '#0284c7' : '#e2e8f0'}`,
                      background: selectedType === rt.label ? '#f0f9ff' : '#ffffff',
                      color: selectedType === rt.label ? '#0369a1' : '#334155',
                      fontWeight: selectedType === rt.label ? 700 : 500,
                      fontSize: '0.84rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div>{rt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Upload Box */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Upload Document (PDF / Image)
              </label>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: 10,
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <Upload size={24} color="#0284c7" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>
                  {file ? file.name : 'Click to browse or drop document here'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Supports PDF, PNG, JPG (up to 10MB) &bull; Automated parameter extraction
                </div>
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      if (!title) setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                />
              </div>
            </div>

            {/* Details Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Record Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete Blood Count"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Doctor / Provider
                </label>
                <input
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Facility / Diagnostic Center
              </label>
              <input
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="e.g. Metro Central Hospital"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '0.55rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: isUploading ? '#94a3b8' : '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {isUploading ? 'Analyzing...' : '+ Save Record'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Detail View Modal ──────────────────────────────────────────────── */

function RecordDetailModal({
  record,
  onClose,
}: {
  record: MedicalRecordItem;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: '1.75rem',
          width: '100%',
          maxWidth: 540,
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <CategoryPill cat={record.category} />
              {record.status && <StatusPill status={record.status} />}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {record.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '0.4rem', cursor: 'pointer' }}
          >
            <X size={18} color="#64748b" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Date</span>
            <strong style={{ color: '#0f172a' }}>{record.date}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Doctor</span>
            <strong style={{ color: '#0f172a' }}>{record.doctor}</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Facility</span>
            <strong style={{ color: '#0f172a' }}>{record.facility}</strong>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
            Clinical Description
          </span>
          <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            {record.description}
          </p>
        </div>

        {record.results && record.results.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Parameters &amp; Findings
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {record.results.map((r) => (
                <div key={r.label} style={{ padding: '0.65rem 0.85rem', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                  <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            onClick={() => {
              const text = `SMARTHEALTH MEDICAL RECORD\n\nTitle: ${record.title}\nCategory: ${record.category}\nDate: ${record.date}\nDoctor: ${record.doctor}\nFacility: ${record.facility}\n\nDescription:\n${record.description}\n\n${record.results ? record.results.map((r) => `${r.label}: ${r.value}`).join('\n') : ''}`;
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${record.title.replace(/\s+/g, '_')}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              flex: 1,
              padding: '0.6rem',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Download size={15} /> Download Record
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1rem',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main MedicalRecordsPage Component ───────────────────────────────── */

export interface MedicalRecordsPageProps {
  initialSection?: 'records' | 'timeline';
  initialCategory?: RecordCategory;
  onNavigate?: (tab: string) => void;
}

export const MedicalRecordsPage: React.FC<MedicalRecordsPageProps> = ({
  initialSection = 'records',
  initialCategory = 'All Records',
}) => {
  const [section, setSection] = useState<'records' | 'timeline'>(initialSection);
  const [activeCategory, setActiveCategory] = useState<RecordCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRecord, setViewRecord] = useState<MedicalRecordItem | null>(null);
  const [liveLabs, setLiveLabs] = useState<any[]>([]);
  const [livePrescriptions, setLivePrescriptions] = useState<any[]>([]);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  const loadLiveData = async () => {
    try {
      const [labsRes, rxRes] = await Promise.allSettled([
        api.get('/labs'),
        api.get('/prescriptions'),
      ]);
      if (labsRes.status === 'fulfilled') {
        const raw = labsRes.value.data.labs || labsRes.value.data;
        if (Array.isArray(raw)) setLiveLabs(raw);
      }
      if (rxRes.status === 'fulfilled') {
        const raw = rxRes.value.data.prescriptions || rxRes.value.data;
        if (Array.isArray(raw)) setLivePrescriptions(raw);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  // Merge static records with live backend lab reports and prescriptions
  const allRecords = useMemo(() => {
    const list: MedicalRecordItem[] = [...STATIC_RECORDS];

    // Map live labs
    liveLabs.forEach((lab) => {
      list.push({
        id: `lab-${lab.id}`,
        date: new Date(lab.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        title: lab.testName || 'Diagnostic Lab Test',
        description: `Category: ${lab.testCategory || 'General Pathology'} &bull; Reference interval: ${lab.normalRangeMin || '-'} - ${lab.normalRangeMax || '-'} ${lab.unit || ''}`,
        category: 'Lab Reports',
        doctor: lab.technicianName || 'Diagnostic Lab Specialist',
        facility: 'Central Healthcare Pathology Lab',
        status: lab.isOutOfRange ? 'Abnormal' : 'Normal',
        results: [
          { label: lab.testName, value: `${lab.measuredValue} ${lab.unit || ''}` },
          { label: 'Reference Range', value: `${lab.normalRangeMin}-${lab.normalRangeMax} ${lab.unit || ''}` },
        ],
        isLive: true,
      });
    });

    // Map live prescriptions
    livePrescriptions.forEach((rx) => {
      list.push({
        id: `rx-${rx.id}`,
        date: new Date(rx.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        title: `Prescription: ${rx.medicineName}`,
        description: `${rx.dosage} &bull; Schedule: ${rx.frequency} &bull; Duration: ${rx.durationDays} days. ${rx.instructions || ''}`,
        category: 'Prescriptions',
        doctor: rx.doctor?.user?.name || 'Authorized Attending Physician',
        facility: 'SmartHealth Clinical Network',
        status: rx.status === 'ACTIVE' ? 'Active' : 'Normal',
        isLive: true,
      });
    });

    return list;
  }, [liveLabs, livePrescriptions]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let list = allRecords;
    if (activeCategory !== 'All Records') {
      list = list.filter((r) => r.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.doctor.toLowerCase().includes(q) ||
          r.facility.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRecords, activeCategory, searchQuery]);

  // 3 Recent Records for Quick Access
  const recentRecords = useMemo(() => allRecords.slice(0, 3), [allRecords]);

  return (
    <>
      {showAddModal && (
        <AddHealthRecordModal
          onClose={() => setShowAddModal(false)}
          onRecordAdded={() => {
            loadLiveData();
          }}
        />
      )}
      {viewRecord && (
        <RecordDetailModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* ── Page Header & Primary Action ───────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 0.35rem 0' }}>
              Medical Records
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Central archive for your lab reports, prescriptions, clinical consultations, and medical documents.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.35rem',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={16} /> Add Health Record
            </button>
          </div>
        </div>

        {/* ── Sub-navigation Tabs: All Records | Medical Timeline ─────── */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: 12, width: 'fit-content', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setSection('records')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1.15rem',
              borderRadius: 9,
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: section === 'records' ? '#ffffff' : 'transparent',
              color: section === 'records' ? '#0369a1' : '#64748b',
              boxShadow: section === 'records' ? '0 2px 6px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={16} color={section === 'records' ? '#0284c7' : '#64748b'} />
            All Records
          </button>
          <button
            onClick={() => setSection('timeline')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1.15rem',
              borderRadius: 9,
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: section === 'timeline' ? '#ffffff' : 'transparent',
              color: section === 'timeline' ? '#0369a1' : '#64748b',
              boxShadow: section === 'timeline' ? '0 2px 6px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={16} color={section === 'timeline' ? '#0284c7' : '#64748b'} />
            Medical Timeline
          </button>
        </div>

        {/* ── View: Medical Timeline ──────────────────────────────────── */}
        {section === 'timeline' && <MedicalTimelinePage />}

        {/* ── View: All Records ───────────────────────────────────────── */}
        {section === 'records' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Filter Chips Bar */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: 999,
                    border: `1px solid ${activeCategory === cat ? '#0284c7' : '#e2e8f0'}`,
                    background: activeCategory === cat ? '#0284c7' : '#ffffff',
                    color: activeCategory === cat ? '#ffffff' : '#475569',
                    fontSize: '0.82rem',
                    fontWeight: activeCategory === cat ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                placeholder="Search records by title, doctor, facility..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.5rem',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>

            {/* ── Recent Health Records (Clean & Compact) ───────────── */}
            {!searchQuery.trim() && activeCategory === 'All Records' && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Recent Health Records
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {recentRecords.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '1.1rem',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <CategoryPill cat={rec.category} />
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{rec.date}</span>
                        </div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                          {rec.title}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                          {rec.facility}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                        {rec.status && <StatusPill status={rec.status} />}
                        <button
                          onClick={() => setViewRecord(rec)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          View Details <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── All Records List ──────────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  All Records ({filteredRecords.length})
                </h3>
              </div>

              {filteredRecords.length === 0 ? (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', color: '#94a3b8' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>No records found</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Try clearing filters or add a new record.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredRecords.map((record) => {
                    const cat = CATEGORY_COLORS[record.category] ?? CATEGORY_COLORS['Other'];
                    return (
                      <div
                        key={record.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
                        }}
                      >
                        {/* Date badge */}
                        <div style={{ width: 68, flexShrink: 0, textAlign: 'center' }}>
                          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>
                            {record.date.split(' ')[1]} {record.date.split(' ')[2]}
                          </p>
                          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, margin: '0.15rem 0 0 0' }}>
                            {record.date.split(' ')[0]}
                          </p>
                        </div>

                        {/* Vertical line */}
                        <div style={{ width: 1, height: 40, background: '#e2e8f0', flexShrink: 0 }} />

                        {/* Category icon */}
                        <RecordIcon title={record.title} category={record.category} color={cat.text} />

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                            <p style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                              {record.title}
                            </p>
                            <CategoryPill cat={record.category} />
                            {record.status && <StatusPill status={record.status} />}
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {record.description}
                          </p>
                          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                            {record.doctor !== '—' && <>{record.doctor} &bull; </>}
                            {record.facility}
                          </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button
                            onClick={() => setViewRecord(record)}
                            style={{
                              padding: '0.45rem 0.85rem',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                              borderRadius: 8,
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <Eye size={13} /> View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MedicalRecordsPage;
