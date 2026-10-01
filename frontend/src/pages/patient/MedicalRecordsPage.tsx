import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  FlaskConical,
  Users,
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
  Pencil,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { MedicalTimelinePage } from './MedicalTimelinePage';
import { DiseaseEpisodesPage } from './DiseaseEpisodesPage';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type RecordCategory =
  | 'All Records'
  | 'Consultations'
  | 'Lab Reports'
  | 'Prescriptions'
  | 'Imaging'
  | 'Vaccinations'
  | 'Other';

interface MedicalRecord {
  id: string;
  date: string;
  title: string;
  description: string;
  category: Exclude<RecordCategory, 'All Records'>;
  doctor: string;
  facility: string;
  results?: { label: string; value: string }[];
  status?: 'Normal' | 'Abnormal' | 'Pending';
}

/* ─── Static data ────────────────────────────────────────────────────────── */

const RECORDS: MedicalRecord[] = [
  {
    id: 'r1',
    date: '22 Aug 2026',
    title: 'Complete Blood Count (CBC)',
    description: 'WBC, RBC, Platelets, Hemoglobin',
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
    title: 'Chest X-Ray',
    description: 'No abnormality detected',
    category: 'Imaging',
    doctor: 'Dr. Priya Mehta',
    facility: 'City Diagnostics',
    status: 'Normal',
  },
  {
    id: 'r3',
    date: '15 Jul 2026',
    title: 'Prescription',
    description: 'Antimalarial (Artemisinin-based)',
    category: 'Prescriptions',
    doctor: 'Dr. Priya Mehta',
    facility: 'City Health Center',
  },
  {
    id: 'r4',
    date: '01 Jul 2026',
    title: 'Vaccination Record',
    description: 'Typhoid — 1st Dose',
    category: 'Vaccinations',
    doctor: '—',
    facility: 'Riverside Health Camp',
    status: 'Normal',
  },
  {
    id: 'r5',
    date: '20 Jun 2026',
    title: 'Consultation Notes',
    description: 'General Checkup',
    category: 'Consultations',
    doctor: 'Dr. Neha Kapoor',
    facility: 'Riverside Clinic',
  },
  {
    id: 'r6',
    date: '12 May 2026',
    title: 'Ultrasound Report',
    description: 'Abdomen — Normal',
    category: 'Imaging',
    doctor: '—',
    facility: 'City Diagnostics',
    status: 'Normal',
  },
  {
    id: 'r7',
    date: '30 Mar 2026',
    title: 'Lipid Profile',
    description: 'Cholesterol, HDL, LDL, Triglycerides',
    category: 'Lab Reports',
    doctor: '—',
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
    title: 'Discharge Summary',
    description: 'Seasonal Fever',
    category: 'Other',
    doctor: '—',
    facility: 'Riverside Hospital',
  },
];

const RECENT_UPLOADS = [
  { name: 'ECG Report',          date: '22 Aug 2026' },
  { name: 'MRI Scan',            date: '18 Aug 2026' },
  { name: 'Blood Test Report',   date: '05 Aug 2026' },
  { name: 'Prescription',        date: '01 Aug 2026' },
];

const TABS: RecordCategory[] = [
  'All Records',
  'Consultations',
  'Lab Reports',
  'Prescriptions',
  'Imaging',
  'Vaccinations',
  'Other',
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Lab Reports':   { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  Imaging:         { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
  Prescriptions:   { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
  Vaccinations:    { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  Consultations:   { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  Other:           { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
};

/* ─── Icon helper ────────────────────────────────────────────────────────── */

function RecordIcon({ title, category, color }: { title: string; category: string; color: string }) {
  const t = title.toLowerCase();
  let Icon = FileText;
  if (t.includes('blood') || t.includes('cbc') || t.includes('lipid') || t.includes('haemo')) Icon = Droplets;
  else if (t.includes('x-ray') || t.includes('ultrasound') || t.includes('mri') || t.includes('scan') || t.includes('imaging')) Icon = ScanLine;
  else if (t.includes('prescription') || t.includes('medicine') || t.includes('drug')) Icon = Pill;
  else if (t.includes('vaccination') || t.includes('vaccine') || t.includes('dose')) Icon = Syringe;
  else if (t.includes('consultation') || t.includes('checkup') || t.includes('ecg')) Icon = Stethoscope;
  else if (t.includes('discharge') || t.includes('summary')) Icon = ClipboardList;
  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={19} color={color} />
    </div>
  );
}

/* ─── Category pill ──────────────────────────────────────────────────────── */

function CategoryPill({ cat }: { cat: string }) {
  const s = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Other'];
  return (
    <span style={{ padding: '0.22rem 0.65rem', borderRadius: 9999, fontSize: '0.73rem', fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {cat}
    </span>
  );
}

/* ─── Status pill ────────────────────────────────────────────────────────── */

function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const isNormal = status === 'Normal';
  return (
    <span style={{ padding: '0.22rem 0.6rem', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, background: isNormal ? '#ECFDF5' : '#FEF2F2', color: isNormal ? '#065F46' : '#991B1B', border: `1px solid ${isNormal ? '#A7F3D0' : '#FECACA'}` }}>
      {isNormal ? '✓ Normal' : '⚠ Abnormal'}
    </span>
  );
}

/* ─── Upload Modal ───────────────────────────────────────────────────────── */

function UploadModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ type: 'Lab Report', name: '', date: '', doctor: '', facility: '', description: '' });
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,23,64,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 18, padding: '2rem', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(11,23,64,0.2)', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B1740', marginBottom: '0.2rem' }}>Upload Medical Record</h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B' }}>Add a new document to your health history</p>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: 9, padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={18} color="#475569" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Record Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #E3ECF5', borderRadius: 9, fontSize: '0.9rem', color: '#0B1740', background: 'white', cursor: 'pointer' }}>
                {['Lab Report', 'Imaging', 'Prescription', 'Vaccination', 'Consultation', 'Discharge Summary', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #E3ECF5', borderRadius: 9, fontSize: '0.9rem', color: '#0B1740', background: 'white' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Record Name</label>
            <input placeholder="e.g. Complete Blood Count" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #E3ECF5', borderRadius: 9, fontSize: '0.9rem', color: '#0B1740' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Doctor</label>
              <input placeholder="Dr. Name" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #E3ECF5', borderRadius: 9, fontSize: '0.9rem', color: '#0B1740' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hospital / Facility</label>
              <input placeholder="Facility name" value={form.facility} onChange={e => setForm(f => ({ ...f, facility: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #E3ECF5', borderRadius: 9, fontSize: '0.9rem', color: '#0B1740' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description (optional)</label>
            <textarea rows={2} placeholder="Brief description of the record..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #E3ECF5', borderRadius: 9, fontSize: '0.9rem', color: '#0B1740', resize: 'none', fontFamily: 'inherit' }} />
          </div>

          {/* File drop area */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
            style={{ border: `2px dashed ${dragging ? '#1677E8' : '#CBD5E1'}`, borderRadius: 12, padding: '1.25rem', textAlign: 'center', background: dragging ? '#EEF6FF' : '#FAFBFC', transition: 'all 0.18s', cursor: 'pointer' }}
            onClick={() => document.getElementById('mr-file-input')?.click()}
          >
            <input id="mr-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            <Upload size={22} color={dragging ? '#1677E8' : '#94A3B8'} style={{ margin: '0 auto 0.5rem' }} />
            {file
              ? <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1677E8' }}>{file.name}</p>
              : <>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Drag & drop or click to upload</p>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>PDF, JPG, PNG — max 10 MB</p>
                </>
            }
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.65rem 1.25rem', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={() => {
              // Validate form
              if (!form.name.trim()) {
                alert('Please enter a record name');
                return;
              }
              if (!form.date) {
                alert('Please select a date');
                return;
              }
              if (!file) {
                alert('Please upload a file');
                return;
              }
              
              // Simulate successful upload
              alert(`✓ Record Uploaded Successfully!\n\nType: ${form.type}\nName: ${form.name}\nDate: ${form.date}\nDoctor: ${form.doctor || 'Not specified'}\nFacility: ${form.facility || 'Not specified'}\nFile: ${file.name}\n\nIn production, this would be saved to the database.`);
              onClose();
            }}
            style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg,#0284c7 0%,#2563eb 100%)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 14px rgba(2,132,199,0.28)' }}
          >
            <Upload size={15} /> Upload Record
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── View Record Modal ──────────────────────────────────────────────────── */

function ViewModal({ record, onClose }: { record: MedicalRecord; onClose: () => void }) {
  const cat = CATEGORY_COLORS[record.category] ?? CATEGORY_COLORS['Other'];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,23,64,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 18, padding: '2rem', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(11,23,64,0.2)', position: 'relative' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.375rem' }}>
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            <RecordIcon title={record.title} category={record.category} color={cat.text} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B1740', marginBottom: '0.3rem' }}>{record.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <CategoryPill cat={record.category} />
                {record.status && <StatusPill status={record.status} />}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: 9, padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}><X size={18} color="#475569" /></button>
        </div>

        {/* Meta info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', background: '#F8FBFF', borderRadius: 12, marginBottom: '1.25rem', border: '1px solid #E3ECF5' }}>
          {[
            { label: 'Date', value: record.date },
            { label: 'Facility', value: record.facility },
            { label: 'Doctor', value: record.doctor },
            { label: 'Category', value: record.category },
          ].map(row => (
            <div key={row.label}>
              <p style={{ fontSize: '0.73rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>{row.label}</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0B1740' }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom: record.results ? '1.25rem' : 0 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Summary</p>
          <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>{record.description}</p>
        </div>

        {/* Lab results */}
        {record.results && (
          <div style={{ marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Results</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              {record.results.map(r => (
                <div key={r.label} style={{ padding: '0.75rem 1rem', background: '#F0F7FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '0.2rem' }}>{r.label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0B1740' }}>{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.5rem' }}>
          <button 
            onClick={() => {
              // Create actual downloadable content
              const content = `
╔══════════════════════════════════════════════════════════════╗
║           SMARTHEALTH MEDICAL RECORD                         ║
╚══════════════════════════════════════════════════════════════╝

Record Title: ${record.title}
Date: ${record.date}
Category: ${record.category}
Doctor: ${record.doctor}
Facility: ${record.facility}
Status: ${record.status || 'N/A'}

DESCRIPTION:
${record.description}

${record.results ? `
RESULTS:
${record.results.map(r => `  ${r.label}: ${r.value}`).join('\n')}
` : ''}

────────────────────────────────────────────────────────────────
This is a SmartHealth digital medical record.
Generated: ${new Date().toLocaleString()}
Patient ID: SHC-2026-000001
────────────────────────────────────────────────────────────────
              `;
              
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${record.title.replace(/\s+/g, '_')}_${record.date.replace(/\s+/g, '_')}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              // Show success message
              const btn = document.activeElement as HTMLButtonElement;
              const originalBg = btn.style.background;
              const originalText = btn.innerHTML;
              btn.style.background = '#059669';
              btn.innerHTML = '<span style="display:flex;align-items:center;gap:0.4rem"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Downloaded</span>';
              setTimeout(() => {
                btn.style.background = originalBg;
                btn.innerHTML = originalText;
                onClose();
              }, 1500);
            }}
            style={{ flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 14px rgba(2,132,199,0.25)' }}
          >
            <Download size={15} /> Download
          </button>
          <button 
            onClick={() => {
              // Simulate share
              const shareMessage = `Record: ${record.title}\nDate: ${record.date}\nDoctor: ${record.doctor}\nFacility: ${record.facility}`;
              if (navigator.share) {
                navigator.share({
                  title: record.title,
                  text: shareMessage,
                }).catch(() => {
                  alert('Share link copied to clipboard!\n\n' + shareMessage);
                });
              } else {
                alert('Share Record\n\n' + shareMessage + '\n\nIn production, this would generate a secure sharing link.');
              }
            }}
            style={{ flex: 1, padding: '0.65rem', background: '#F0F7FF', color: '#1677E8', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <Share2 size={15} /> Share
          </button>
          <button onClick={onClose} style={{ padding: '0.65rem 1rem', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export interface MedicalRecordsPageProps {
  initialSection?: 'records' | 'timeline' | 'episodes';
}

export const MedicalRecordsPage: React.FC<MedicalRecordsPageProps> = ({ initialSection = 'records' }) => {
  const [section, setSection] = useState<'records' | 'timeline' | 'episodes'>(initialSection);
  const [activeTab, setActiveTab] = useState<RecordCategory>('All Records');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [showUpload, setShowUpload] = useState(false);
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);

  // Sync if initialSection changes
  React.useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
    }
  }, [initialSection]);

  /* Filtering */
  const filtered = useMemo(() => {
    let list = RECORDS;
    if (activeTab !== 'All Records') list = list.filter(r => r.category === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.doctor.toLowerCase().includes(q) ||
        r.facility.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, search]);

  const card: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E3ECF5',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
  };

  return (
    <>
      {/* Modals */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {viewRecord && <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0B1740', marginBottom: '0.3rem', letterSpacing: '-0.02em' }}>
              Medical Records
            </h2>
            <p style={{ fontSize: '0.94rem', color: '#64748B', lineHeight: 1.5 }}>
              Access and manage your complete health history — all in one secure place.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                alert('Request Medical Records\n\nRequest records from previous healthcare providers.\n\nIn production, this would:\n• Show a list of connected hospitals\n• Allow you to select specific records\n• Track request status\n• Notify you when records are available');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.125rem', background: '#F0F7FF', color: '#1677E8', border: '1.5px solid #BFDBFE', borderRadius: 10, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <ClipboardList size={15} /> Request Records
            </button>
            <button
              onClick={() => setShowUpload(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(2,132,199,0.28)' }}
            >
              <Upload size={15} /> Upload Record
            </button>
          </div>
        </div>

        {/* ── Sub-navigation Tabs: Clinical Records | Medical Timeline | Disease Episodes ── */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.35rem', borderRadius: 12, width: 'fit-content' }}>
          <button
            onClick={() => setSection('records')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              borderRadius: 9,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: section === 'records' ? '#FFFFFF' : 'transparent',
              color: section === 'records' ? '#0B1740' : '#64748B',
              boxShadow: section === 'records' ? '0 2px 8px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={16} color={section === 'records' ? '#1677E8' : '#64748B'} />
            Clinical Records
          </button>
          <button
            onClick={() => setSection('timeline')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              borderRadius: 9,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: section === 'timeline' ? '#FFFFFF' : 'transparent',
              color: section === 'timeline' ? '#0B1740' : '#64748B',
              boxShadow: section === 'timeline' ? '0 2px 8px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={16} color={section === 'timeline' ? '#1677E8' : '#64748B'} />
            Medical Timeline
          </button>
          <button
            onClick={() => setSection('episodes')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              borderRadius: 9,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: section === 'episodes' ? '#FFFFFF' : 'transparent',
              color: section === 'episodes' ? '#0B1740' : '#64748B',
              boxShadow: section === 'episodes' ? '0 2px 8px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={16} color={section === 'episodes' ? '#1677E8' : '#64748B'} />
            Disease Episodes
          </button>
        </div>

        {section === 'timeline' && <MedicalTimelinePage />}
        {section === 'episodes' && <DiseaseEpisodesPage />}
        {section === 'records' && (
          <>
            {/* ── Summary Cards ────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.125rem' }}>
          {[
            { value: '24', label: 'Total Records',          sub: 'All time',          icon: FileText,     iconBg: '#EEF6FF', iconColor: '#1677E8' },
            { value: '6',  label: 'Years of History',       sub: '2020 – 2026',       icon: Calendar,     iconBg: '#F0FDF4', iconColor: '#059669' },
            { value: '8',  label: 'Lab Reports',            sub: 'Recent reports',    icon: FlaskConical, iconBg: '#F5F3FF', iconColor: '#7C3AED' },
            { value: '3',  label: 'Healthcare Providers',   sub: 'Connected',         icon: Users,        iconBg: '#FFF7ED', iconColor: '#EA580C' },
          ].map(({ value, label, sub, icon: Icon, iconBg, iconColor }) => (
            <div key={label} style={{ ...card, padding: '1.2rem 1.375rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={iconColor} />
              </div>
              <div>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B1740', lineHeight: 1, marginBottom: '0.2rem' }}>{value}</p>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.1rem' }}>{label}</p>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main two-column layout ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT — Records */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', padding: '0.375rem', background: '#F1F5F9', borderRadius: 12 }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.45rem 0.875rem',
                    background: activeTab === tab ? '#1677E8' : 'transparent',
                    color: activeTab === tab ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: 9,
                    fontSize: '0.84rem',
                    fontWeight: activeTab === tab ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    boxShadow: activeTab === tab ? '0 2px 8px rgba(22,119,232,0.28)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search + filter row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  placeholder="Search by record name, doctor, hospital..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.875rem 0.6rem 2.5rem', border: '1px solid #E3ECF5', borderRadius: 10, fontSize: '0.875rem', color: '#0B1740', background: '#FAFBFC', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#1677E8'; e.target.style.background = 'white'; }}
                  onBlur={e => { e.target.style.borderColor = '#E3ECF5'; e.target.style.background = '#FAFBFC'; }}
                />
              </div>
              {['All Dates', 'This Month', 'Last 3 Months', 'This Year'].map(d => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 0.875rem', background: dateFilter === d ? '#EEF6FF' : 'white', color: dateFilter === d ? '#1677E8' : '#475569', border: `1px solid ${dateFilter === d ? '#BFDBFE' : '#E3ECF5'}`, borderRadius: 10, fontSize: '0.84rem', fontWeight: dateFilter === d ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {d} {d === 'All Dates' && <ChevronDown size={13} />}
                </button>
              ))}
            </div>

            {/* Records count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.84rem', color: '#64748B' }}>
                Showing <strong style={{ color: '#0B1740' }}>{filtered.length}</strong> record{filtered.length !== 1 ? 's' : ''}
                {activeTab !== 'All Records' && <> in <strong style={{ color: '#1677E8' }}>{activeTab}</strong></>}
              </p>
            </div>

            {/* Records list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 ? (
                <div style={{ ...card, padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No records found</p>
                  <p style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>Try adjusting your search or filter.</p>
                </div>
              ) : filtered.map(record => {
                const cat = CATEGORY_COLORS[record.category] ?? CATEGORY_COLORS['Other'];
                return (
                  <div
                    key={record.id}
                    style={{ ...card, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.18s, transform 0.18s', cursor: 'default' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(15,23,42,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(15,23,42,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                  >
                    {/* Date */}
                    <div style={{ width: 72, flexShrink: 0, textAlign: 'center' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {record.date.split(' ')[1]} {record.date.split(' ')[2]}
                      </p>
                      <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B1740', lineHeight: 1 }}>
                        {record.date.split(' ')[0]}
                      </p>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, height: 44, background: '#E3ECF5', flexShrink: 0 }} />

                    {/* Icon */}
                    <RecordIcon title={record.title} category={record.category} color={cat.text} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0B1740' }}>{record.title}</p>
                        <CategoryPill cat={record.category} />
                        {record.status && <StatusPill status={record.status} />}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '0.25rem' }}>{record.description}</p>
                      <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                        {record.doctor !== '—' && <><span style={{ fontWeight: 600, color: '#475569' }}>{record.doctor}</span> · </>}
                        {record.facility}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => setViewRecord(record)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.875rem', background: '#EEF6FF', color: '#1677E8', border: '1px solid #BFDBFE', borderRadius: 9, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#DBEAFE'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#EEF6FF'; }}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Create actual downloadable content
                          const content = `
╔══════════════════════════════════════════════════════════════╗
║           SMARTHEALTH MEDICAL RECORD                         ║
╚══════════════════════════════════════════════════════════════╝

Record Title: ${record.title}
Date: ${record.date}
Category: ${record.category}
Doctor: ${record.doctor}
Facility: ${record.facility}
Status: ${record.status || 'N/A'}

DESCRIPTION:
${record.description}

${record.results ? `
RESULTS:
${record.results.map(r => `  ${r.label}: ${r.value}`).join('\n')}
` : ''}

────────────────────────────────────────────────────────────────
This is a SmartHealth digital medical record.
Generated: ${new Date().toLocaleString()}
Patient ID: SHC-2026-000001
────────────────────────────────────────────────────────────────
                          `;
                          
                          const blob = new Blob([content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${record.title.replace(/\s+/g, '_')}_${record.date.replace(/\s+/g, '_')}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          // Show visual feedback
                          const btn = e.currentTarget as HTMLButtonElement;
                          const originalBg = btn.style.background;
                          btn.style.background = '#ECFDF5';
                          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                          setTimeout(() => {
                            btn.style.background = originalBg;
                            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
                          }, 1500);
                        }}
                        style={{ padding: '0.5rem', background: '#F8FAFC', color: '#64748B', border: '1px solid #E3ECF5', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Download"
                        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {/* Patient info card */}
            <div style={{ ...card, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#0284c7,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>
                  RV
                </div>
                <div>
                  <p style={{ fontSize: '0.97rem', fontWeight: 800, color: '#0B1740', marginBottom: '0.1rem' }}>Rahul Verma</p>
                  <p style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }}>SHC-2026-000001</p>
                </div>
              </div>

              {/* Completeness */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Records Completeness</p>
                  <p style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1677E8' }}>92%</p>
                </div>
                <div style={{ height: 7, background: '#E3ECF5', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '92%', background: 'linear-gradient(90deg,#0284c7,#2563eb)', borderRadius: 9999 }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.4rem' }}>Your health history is regularly updated.</p>
              </div>

              <button 
                onClick={() => {
                  alert('Edit Profile\n\nYou can update:\n• Personal information\n• Contact details\n• Emergency contacts\n• Medical history\n• Insurance information\n\nIn production, this would open a profile editing form.');
                }}
                style={{ width: '100%', padding: '0.6rem', background: '#F0F7FF', color: '#1677E8', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Pencil size={14} /> Edit Profile
              </button>
            </div>

            {/* Recent uploads */}
            <div style={{ ...card, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0B1740' }}>Recent Uploads</h4>
                <button 
                  onClick={() => {
                    alert(`All Recent Uploads (${RECENT_UPLOADS.length})\n\n` + RECENT_UPLOADS.map((u, i) => `${i + 1}. ${u.name} - ${u.date}`).join('\n') + '\n\nIn production, this would show a complete list of all uploaded documents.');
                  }}
                  style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#1677E8', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  View All <ArrowRight size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {RECENT_UPLOADS.map((u, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', background: '#FAFBFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={15} color="#1677E8" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0B1740', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                      <p style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{u.date}</p>
                    </div>
                    <span style={{ padding: '0.18rem 0.55rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', flexShrink: 0 }}>
                      ✓ Uploaded
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ ...card, padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0B1740', marginBottom: '1rem' }}>Quick Actions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                {[
                  { 
                    icon: Upload, 
                    title: 'Upload Record', 
                    desc: 'Add a medical document', 
                    onClick: () => setShowUpload(true), 
                    accent: '#1677E8', 
                    bg: '#EEF6FF' 
                  },
                  { 
                    icon: Share2, 
                    title: 'Share with Doctor', 
                    desc: 'Securely share records', 
                    onClick: () => {
                      alert('Share with Doctor\n\nYou can share your medical records with your healthcare provider.\n\nIn production:\n• Select records to share\n• Choose doctor from your network\n• Set expiration time\n• Generate secure link');
                    }, 
                    accent: '#059669', 
                    bg: '#ECFDF5' 
                  },
                  { 
                    icon: Download, 
                    title: 'Download All', 
                    desc: 'Get your health history', 
                    onClick: () => {
                      // Create comprehensive health record
                      const content = `
╔══════════════════════════════════════════════════════════════╗
║        SMARTHEALTH COMPREHENSIVE HEALTH RECORD               ║
╚══════════════════════════════════════════════════════════════╝

Patient: Rahul Verma
Health ID: SHC-2026-000001
Generated: ${new Date().toLocaleString()}

════════════════════════════════════════════════════════════════

MEDICAL RECORDS SUMMARY
Total Records: ${RECORDS.length}
Date Range: ${RECORDS[RECORDS.length - 1].date} - ${RECORDS[0].date}

════════════════════════════════════════════════════════════════

${RECORDS.map((rec, idx) => `
RECORD ${idx + 1}: ${rec.title}
────────────────────────────────────────────────────────────────
Date:        ${rec.date}
Category:    ${rec.category}
Doctor:      ${rec.doctor}
Facility:    ${rec.facility}
Status:      ${rec.status || 'N/A'}
Description: ${rec.description}
${rec.results ? `
Results:
${rec.results.map(r => `  • ${r.label}: ${r.value}`).join('\n')}
` : ''}
`).join('\n════════════════════════════════════════════════════════════════\n')}

════════════════════════════════════════════════════════════════
End of Health Record
════════════════════════════════════════════════════════════════
                      `;
                      
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `SmartHealth_Complete_Records_${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      alert('✓ Health History Downloaded!\n\nYour comprehensive medical records have been downloaded.');
                    }, 
                    accent: '#7C3AED', 
                    bg: '#F5F3FF' 
                  },
                  { 
                    icon: ClipboardList, 
                    title: 'Request Records', 
                    desc: 'Request missing documents', 
                    onClick: () => {
                      alert('Request Medical Records\n\nRequest records from:\n• Previous hospitals\n• Other healthcare providers\n• Diagnostic centers\n\nIn production, this would:\n• Show list of connected providers\n• Allow you to select which records to request\n• Send secure request notifications\n• Track request status');
                    }, 
                    accent: '#EA580C', 
                    bg: '#FFF7ED' 
                  },
                ].map(({ icon: Icon, title, desc, onClick, accent, bg }) => (
                  <button
                    key={title}
                    onClick={onClick}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.875rem', background: bg, border: `1px solid ${accent}22`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                      <Icon size={16} color={accent} />
                    </div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B1740', marginBottom: '0.15rem', lineHeight: 1.3 }}>{title}</p>
                    <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.4 }}>{desc}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Security Banner ───────────────────────────────────────────── */}
        <div style={{ padding: '1.375rem 1.75rem', background: 'linear-gradient(135deg,#F0FDF4 0%,#ECFDF5 60%,#EFF6FF 100%)', border: '1px solid #A7F3D0', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', flexShrink: 0 }}>
              <ShieldCheck size={22} color="#059669" />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#065F46', marginBottom: '0.25rem' }}>Your Health History, Always With You</h4>
              <p style={{ fontSize: '0.875rem', color: '#047857', lineHeight: 1.5, maxWidth: 560 }}>
                Your medical records are securely stored and can only be accessed by authorized users. All access is logged and audited.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              alert('Manage Access\n\nControl who can access your medical records:\n\n• View access history\n• Revoke access permissions\n• Set temporary access for specialists\n• View audit logs\n• Configure privacy settings\n\nAll access is logged for security.');
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.125rem', background: '#059669', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            Manage Access <ArrowRight size={14} />
          </button>
        </div>
          </>
        )}

      </div>
    </>
  );
};
