import React, { useState, useEffect, useRef, useMemo, type PointerEvent } from 'react';
import {
  GitFork,
  HeartPulse,
  Users,
  Search,
  X,
  Plus,
  Minus,
  RotateCcw,
  LocateFixed,
  Move,
  SearchX,
  UserRound,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  Activity,
  Droplets,
  Wind,
  Info,
  Check,
  Edit3,
  Trash2,
  RefreshCw,
  Save,
  AlertTriangle,
  Pill,
  Dna,
  ShieldAlert,
  Flame,
  FileText
} from 'lucide-react';
import api from '../services/api';
import '../styles/family-tree.css';

// --------------------------------------------------------------------------
// TYPES & CLINICAL DATA MODELS
// --------------------------------------------------------------------------
export type Member = {
  id: string;
  name: string;
  age: number;
  gender: string;
  relationship: string;
  generation: number; // 1 = Grandparents, 2 = Parents, 3 = Children/Self/Siblings
  history: string[];
  notes: string[];
  parentIds: string[];
  partnerId?: string;
  isBackendRecord?: boolean;

  // Enhanced Clinical & Genetic Attributes
  livingStatus?: 'Living' | 'Deceased';
  bloodGroup?: string;
  ageAtDiagnosis?: number | null;
  severity?: 'Controlled' | 'Mild' | 'Moderate' | 'High Risk';
  medications?: string[];
  lifestyleNotes?: string;
  hereditaryRiskLevel?: 'Low' | 'Moderate' | 'Elevated' | 'High';
  screeningAdvice?: string;
  lineage?: 'Paternal Lineage' | 'Maternal Lineage' | 'Direct Nuclear Line';
  kinshipDegree?: string;
};

export interface FamilyTreeProps {
  treeData?: any;
  onRefresh?: () => void | Promise<void>;
  canEdit?: boolean;
  patientId?: string;
}

// --------------------------------------------------------------------------
// INITIAL RICH CLINICAL PEDIGREE DATA
// --------------------------------------------------------------------------
const INITIAL_DEMO_MEMBERS: Member[] = [
  {
    id: 'vijay',
    name: 'Vijay Verma',
    age: 79,
    gender: 'Male',
    relationship: 'Paternal grandfather',
    generation: 1,
    livingStatus: 'Living',
    bloodGroup: 'B+',
    lineage: 'Paternal Lineage',
    kinshipDegree: '2nd Degree Relative (25% Shared DNA)',
    history: ['Hypertension'],
    ageAtDiagnosis: 62,
    severity: 'Controlled',
    medications: ['Amlodipine 5mg (Daily)', 'Aspirin 75mg (Post-breakfast)'],
    lifestyleNotes: 'Low-sodium DASH dietary adherence, regular morning aerobic walks.',
    hereditaryRiskLevel: 'Moderate',
    screeningAdvice: 'Offspring should monitor blood pressure biannually starting at age 35.',
    notes: [
      'Documented history of essential hypertension since age 62.',
      'Cardiology review indicates stable left ventricular function.',
      'Routine follow-up recorded at district hospital.',
    ],
    parentIds: [],
    partnerId: 'sunita',
  },
  {
    id: 'sunita',
    name: 'Sunita Verma',
    age: 75,
    gender: 'Female',
    relationship: 'Paternal grandmother',
    generation: 1,
    livingStatus: 'Living',
    bloodGroup: 'O+',
    lineage: 'Paternal Lineage',
    kinshipDegree: '2nd Degree Relative (25% Shared DNA)',
    history: ['Type 2 diabetes'],
    ageAtDiagnosis: 58,
    severity: 'Moderate',
    medications: ['Metformin 500mg (BID)', 'Glimepiride 1mg (Morning)'],
    lifestyleNotes: 'Strict low-glycemic diabetic meal regimen, quarterly podiatry checks.',
    hereditaryRiskLevel: 'Elevated',
    screeningAdvice: 'Fasting blood sugar & HbA1c screening recommended annually for all grandchildren.',
    notes: [
      'Type 2 diabetes diagnosed at age 58 with mild peripheral neuropathy.',
      'Dietary counseling and exercise log maintained regularly.',
      'Last recorded HbA1c: 6.9%.',
    ],
    parentIds: [],
    partnerId: 'vijay',
  },
  {
    id: 'rajesh',
    name: 'Rajesh Sharma',
    age: 77,
    gender: 'Male',
    relationship: 'Maternal grandfather',
    generation: 1,
    livingStatus: 'Living',
    bloodGroup: 'A+',
    lineage: 'Maternal Lineage',
    kinshipDegree: '2nd Degree Relative (25% Shared DNA)',
    history: ['Hypertension'],
    ageAtDiagnosis: 54,
    severity: 'Controlled',
    medications: ['Telmisartan 40mg (Daily)'],
    lifestyleNotes: 'Salt reduction, periodic blood pressure home monitoring.',
    hereditaryRiskLevel: 'Moderate',
    screeningAdvice: 'Cardiovascular screening recommended for descendants with maternal clustering.',
    notes: [
      'Essential hypertension diagnosed at age 54.',
      'Renal function tests normal with no proteinuria.',
      'Periodic clinic blood pressure logs recorded.',
    ],
    parentIds: [],
    partnerId: 'meera',
  },
  {
    id: 'meera',
    name: 'Meera Sharma',
    age: 72,
    gender: 'Female',
    relationship: 'Maternal grandmother',
    generation: 1,
    livingStatus: 'Living',
    bloodGroup: 'A-',
    lineage: 'Maternal Lineage',
    kinshipDegree: '2nd Degree Relative (25% Shared DNA)',
    history: ['Asthma'],
    ageAtDiagnosis: 48,
    severity: 'Mild',
    medications: ['Budesonide 200mcg (Inhaler BID)', 'Salbutamol (PRN)'],
    lifestyleNotes: 'Avoidance of environmental aeroallergens, air filtration at home.',
    hereditaryRiskLevel: 'Moderate',
    screeningAdvice: 'Descendants should monitor for seasonal allergic triggers or chronic coughing.',
    notes: [
      'Adult-onset bronchial asthma diagnosed at age 48.',
      'Triggered primarily during winter seasonal atmospheric inversions.',
      'No intensive hospital admissions in the past 5 years.',
    ],
    parentIds: [],
    partnerId: 'rajesh',
  },
  {
    id: 'amit',
    name: 'Amit Verma',
    age: 55,
    gender: 'Male',
    relationship: 'Father',
    generation: 2,
    livingStatus: 'Living',
    bloodGroup: 'B+',
    lineage: 'Direct Nuclear Line',
    kinshipDegree: '1st Degree Relative (50% Shared DNA)',
    history: ['Hypertension'],
    ageAtDiagnosis: 48,
    severity: 'Controlled',
    medications: ['Amlodipine 5mg + Losartan 50mg (Combination OD)'],
    lifestyleNotes: 'Active cardio exercise 4 days/week, sodium intake < 2g/day.',
    hereditaryRiskLevel: 'High',
    screeningAdvice: 'Multi-generational transmission pattern: Patient should monitor BP monthly.',
    notes: [
      'Diagnosed with stage 1 hypertension at age 48.',
      'Father (Vijay) also hypertensive, confirming multi-generational inheritance.',
      'Annual executive health checkup completed with normal lipid panel.',
    ],
    parentIds: ['vijay', 'sunita'],
    partnerId: 'priya',
  },
  {
    id: 'priya',
    name: 'Priya Verma',
    age: 52,
    gender: 'Female',
    relationship: 'Mother',
    generation: 2,
    livingStatus: 'Living',
    bloodGroup: 'O+',
    lineage: 'Direct Nuclear Line',
    kinshipDegree: '1st Degree Relative (50% Shared DNA)',
    history: ['Type 2 diabetes'],
    ageAtDiagnosis: 46,
    severity: 'Controlled',
    medications: ['Metformin 850mg (Extended Release OD)'],
    lifestyleNotes: 'Low carb dietary regimen, daily yoga and resistance training.',
    hereditaryRiskLevel: 'High',
    screeningAdvice: 'Direct maternal diabetes transmission: Annual glucose tolerance and HbA1c test required for children.',
    notes: [
      'Diagnosed with pre-diabetes at 44, transitioned to Type 2 diabetes at 46.',
      'Mother (Sunita) also diabetic, highlighting strong maternal metabolic clustering.',
      'Follows endocrinologist routine with excellent medication adherence.',
    ],
    parentIds: ['rajesh', 'meera'],
    partnerId: 'amit',
  },
  {
    id: 'ananya',
    name: 'Ananya Verma',
    age: 31,
    gender: 'Female',
    relationship: 'Sister',
    generation: 3,
    livingStatus: 'Living',
    bloodGroup: 'B+',
    lineage: 'Direct Nuclear Line',
    kinshipDegree: '1st Degree Relative (50% Shared DNA)',
    history: ['Asthma'],
    ageAtDiagnosis: 22,
    severity: 'Mild',
    medications: ['Levosalbutamol Inhaler (PRN)'],
    lifestyleNotes: 'Yoga pranayama breathing exercises, active indoor lifestyle.',
    hereditaryRiskLevel: 'Moderate',
    screeningAdvice: 'Shared maternal grandmother (Meera) allergic/atopic genetic predisposition.',
    notes: [
      'Diagnosed with mild intermittent asthma at age 22.',
      'No maintenance oral steroids required.',
      'Routine medical checkup verified normal pulmonary capacity.',
    ],
    parentIds: ['amit', 'priya'],
  },
  {
    id: 'rahul',
    name: 'Rahul Verma',
    age: 28,
    gender: 'Male',
    relationship: 'Self',
    generation: 3,
    livingStatus: 'Living',
    bloodGroup: 'B+',
    lineage: 'Direct Nuclear Line',
    kinshipDegree: 'Primary Proband / Patient',
    history: [],
    ageAtDiagnosis: null,
    severity: 'Controlled',
    medications: ['Multivitamin with Zinc (Daily supplement)'],
    lifestyleNotes: 'Regular strength training, balanced Mediterranean dietary intake, non-smoker.',
    hereditaryRiskLevel: 'Elevated',
    screeningAdvice: 'Dual parental risk: Paternal hypertension + Maternal diabetes. Proactive annual screening recommended.',
    notes: [
      'Primary patient profile holder (Smart Health ID: SHC-2026-000001).',
      'Blood pressure baseline: 118/76 mmHg. Resting heart rate: 72 bpm.',
      'Fasting blood glucose normal (88 mg/dL). No current chronic diagnoses.',
    ],
    parentIds: ['amit', 'priya'],
  },
  {
    id: 'rohan',
    name: 'Rohan Verma',
    age: 24,
    gender: 'Male',
    relationship: 'Brother',
    generation: 3,
    livingStatus: 'Living',
    bloodGroup: 'O+',
    lineage: 'Direct Nuclear Line',
    kinshipDegree: '1st Degree Relative (50% Shared DNA)',
    history: [],
    ageAtDiagnosis: null,
    severity: 'Controlled',
    medications: ['None prescribed'],
    lifestyleNotes: 'Competitive distance runner, collegiate athletic training.',
    hereditaryRiskLevel: 'Moderate',
    screeningAdvice: 'Periodic BP and glucose checks every 2 years due to dual parental history.',
    notes: [
      'No chronic medical conditions reported.',
      'Regular cardiovascular physicals for athletic events show excellent cardiac reserve.',
      'Non-smoker, optimal body mass index (BMI: 21.8).',
    ],
    parentIds: ['amit', 'priya'],
  },
];

// Helper to determine gender from relationship
function inferGender(relation: string): string {
  const r = (relation || '').toLowerCase();
  if (r.includes('father') || r.includes('brother') || r.includes('son') || r.includes('uncle') || r.includes('grandfather') || r.includes('husband')) {
    return 'Male';
  }
  if (r.includes('mother') || r.includes('sister') || r.includes('daughter') || r.includes('aunt') || r.includes('grandmother') || r.includes('wife')) {
    return 'Female';
  }
  return 'Male';
}

// Helper to determine generation from relationship
function inferGeneration(relation: string): number {
  const r = (relation || '').toLowerCase();
  if (r.includes('grand')) return 1;
  if (r.includes('father') || r.includes('mother') || r.includes('parent') || r.includes('uncle') || r.includes('aunt')) return 2;
  if (r.includes('son') || r.includes('daughter') || r.includes('child')) return 3;
  return 3;
}

// Helper to compute kinship degree
function computeKinship(relation: string): { degree: string; lineage: 'Paternal Lineage' | 'Maternal Lineage' | 'Direct Nuclear Line' } {
  const r = (relation || '').toLowerCase();
  let lineage: 'Paternal Lineage' | 'Maternal Lineage' | 'Direct Nuclear Line' = 'Direct Nuclear Line';
  if (r.includes('paternal') || r === 'father') lineage = 'Paternal Lineage';
  else if (r.includes('maternal') || r === 'mother') lineage = 'Maternal Lineage';

  if (r === 'self') return { degree: 'Primary Proband / Patient', lineage: 'Direct Nuclear Line' };
  if (r.includes('father') || r.includes('mother') || r.includes('brother') || r.includes('sister') || r.includes('son') || r.includes('daughter')) {
    return { degree: '1st Degree Relative (50% Shared DNA)', lineage };
  }
  if (r.includes('grand') || r.includes('uncle') || r.includes('aunt')) {
    return { degree: '2nd Degree Relative (25% Shared DNA)', lineage };
  }
  if (r.includes('cousin')) {
    return { degree: '3rd Degree Relative (12.5% Shared DNA)', lineage };
  }
  if (r.includes('spouse') || r.includes('wife') || r.includes('husband')) {
    return { degree: 'Spouse (Non-biological Kin)', lineage: 'Direct Nuclear Line' };
  }
  return { degree: 'Extended Relative', lineage };
}

export function initials(name: string): string {
  return (name || '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'FM';
}

export function indicatorClass(history: string[]): string {
  if (!history || history.length === 0) return 'clear';
  const first = (history[0] || '').toLowerCase();
  if (first.includes('hypert') || first.includes('pressure')) return 'pressure';
  if (first.includes('diabet')) return 'diabetes';
  if (first.includes('asthma') || first.includes('copd')) return 'asthma';
  if (first.includes('heart') || first.includes('cardio') || first.includes('coronary')) return 'cardiac';
  if (first.includes('cancer')) return 'cancer';
  return 'pressure';
}

export function layoutMembers(members: Member[]) {
  const generations = Array.from(new Set(members.map((m) => m.generation))).sort((a, b) => a - b);
  const genList = generations.length > 0 ? generations : [1, 2, 3];

  const width = Math.max(
    920,
    ...genList.map((g) => members.filter((m) => m.generation === g).length * 198 + 100)
  );
  const positions = new Map<string, { x: number; y: number }>();

  genList.forEach((g) => {
    const row = members.filter((m) => m.generation === g);
    row.forEach((m, i) => {
      positions.set(m.id, {
        x: width / 2 + (i - (row.length - 1) / 2) * 198 - 86,
        y: 62 + (g - 1) * 195,
      });
    });
  });

  const height = Math.max(650, 62 + (Math.max(...genList) - 1) * 195 + 180);
  return { width, height, positions };
}

// --------------------------------------------------------------------------
// MAIN COMPONENT: FamilyTree (Health Roots Explorer)
// --------------------------------------------------------------------------
export function FamilyTree({ treeData, onRefresh, canEdit = true, patientId }: FamilyTreeProps) {
  const [members, setMembers] = useState<Member[]>(INITIAL_DEMO_MEMBERS);
  const [selectedId, setSelectedId] = useState<string>('rahul');
  const [query, setQuery] = useState<string>('');
  const [generationFilter, setGenerationFilter] = useState<string>('all');
  const [notice, setNotice] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    relationship: 'Father',
    livingStatus: 'Living' as 'Living' | 'Deceased',
    bloodGroup: 'B+',
    condition: 'none',
    ageAtDiagnosis: '',
    severity: 'Controlled' as 'Controlled' | 'Mild' | 'Moderate' | 'High Risk',
    medications: '',
    lifestyleNotes: '',
    notes: '',
  });

  // Canvas Viewport references and state
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [scale, setScale] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<boolean>(false);

  // Map backend treeData into Member format if provided
  useEffect(() => {
    if (treeData && treeData.members && treeData.members.length > 0) {
      const patientName = treeData.patient?.name || 'Rahul Verma';
      const patientId = treeData.patient?.id || 'self-patient';

      const backendMembers: Member[] = treeData.members.map((m: any) => {
        const cond = m.condition && m.condition !== 'None' ? [m.condition] : [];
        const gen = inferGeneration(m.relation);
        const gdr = inferGender(m.relation);
        const kinship = computeKinship(m.relation);

        return {
          id: m.id,
          name: m.name,
          age: m.age || 45,
          gender: gdr,
          relationship: m.relation,
          generation: gen,
          livingStatus: 'Living',
          bloodGroup: 'Unknown',
          lineage: kinship.lineage,
          kinshipDegree: kinship.degree,
          history: cond,
          ageAtDiagnosis: m.ageAtDiagnosis || null,
          severity: cond.length > 0 ? 'Moderate' : 'Controlled',
          medications: cond.length > 0 ? ['Maintenance medication as prescribed'] : ['None'],
          lifestyleNotes: 'Standard clinical monitoring recommended.',
          hereditaryRiskLevel: cond.length > 0 ? 'Moderate' : 'Low',
          screeningAdvice: cond.length > 0 ? `Targeted screening for ${cond[0]} recommended based on family history.` : 'Standard periodic wellness review.',
          notes: m.notes ? [m.notes] : [m.ageAtDiagnosis ? `Diagnosed at age ${m.ageAtDiagnosis}` : 'Documented family relative record.'],
          parentIds: [],
          isBackendRecord: true,
        };
      });

      // Include patient self node
      const selfMember: Member = {
        id: patientId,
        name: patientName,
        age: 28,
        gender: 'Male',
        relationship: 'Self',
        generation: 3,
        livingStatus: 'Living',
        bloodGroup: 'B+',
        lineage: 'Direct Nuclear Line',
        kinshipDegree: 'Primary Proband / Patient',
        history: treeData.patient?.chronicConditions && treeData.patient.chronicConditions !== 'None' ? [treeData.patient.chronicConditions] : [],
        severity: 'Controlled',
        medications: ['Multivitamin supplement'],
        lifestyleNotes: 'Regular exercise and balanced nutrition.',
        hereditaryRiskLevel: 'Moderate',
        screeningAdvice: 'Maintain routine annual health evaluations.',
        notes: ['Primary patient profile record (SHC-2026-000001).'],
        parentIds: [],
      };

      // Connect partner and parent relationships if relations match
      const father = backendMembers.find(m => m.relationship.toLowerCase() === 'father');
      const mother = backendMembers.find(m => m.relationship.toLowerCase() === 'mother');
      const patGF = backendMembers.find(m => m.relationship.toLowerCase().includes('paternal grandfather'));
      const patGM = backendMembers.find(m => m.relationship.toLowerCase().includes('paternal grandmother'));
      const matGF = backendMembers.find(m => m.relationship.toLowerCase().includes('maternal grandfather'));
      const matGM = backendMembers.find(m => m.relationship.toLowerCase().includes('maternal grandmother'));

      if (father && mother) {
        father.partnerId = mother.id;
        mother.partnerId = father.id;
        selfMember.parentIds = [father.id, mother.id];
      }
      if (patGF && patGM) {
        patGF.partnerId = patGM.id;
        patGM.partnerId = patGF.id;
        if (father) father.parentIds = [patGF.id, patGM.id];
      }
      if (matGF && matGM) {
        matGF.partnerId = matGM.id;
        matGM.partnerId = matGF.id;
        if (mother) mother.parentIds = [matGF.id, matGM.id];
      }

      setMembers([selfMember, ...backendMembers]);
      setSelectedId(patientId);
    } else if (treeData && (!treeData.members || treeData.members.length === 0)) {
      // If patient exists but has no members yet, initialize with rich demo template with patient's name
      const customMembers = INITIAL_DEMO_MEMBERS.map(m => {
        if (m.relationship === 'Self' && treeData.patient?.name) {
          return { ...m, name: treeData.patient.name };
        }
        return m;
      });
      setMembers(customMembers);
    }
  }, [treeData]);

  // Layout calculations
  const { width, height, positions } = useMemo(() => layoutMembers(members), [members]);

  const matches = useMemo(() => {
    return members.filter((m) => {
      const matchGen = generationFilter === 'all' || m.generation === Number(generationFilter);
      const matchQuery =
        m.name.toLowerCase().includes(query.toLowerCase().trim()) ||
        m.relationship.toLowerCase().includes(query.toLowerCase().trim()) ||
        (m.history && m.history.some(h => h.toLowerCase().includes(query.toLowerCase().trim())));
      return matchGen && matchQuery;
    });
  }, [members, query, generationFilter]);

  const visible = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);
  const searching = query.trim().length > 0;

  // Selected member object (Defaults to rahul or first)
  const selected = members.find((m) => m.id === selectedId) || members[0] || INITIAL_DEMO_MEMBERS[0];

  // Auto-fit helper
  const fit = () => {
    const el = viewport.current;
    if (!el) return;
    const s = Math.min(0.95, (el.clientWidth - 30) / width, (el.clientHeight - 20) / height);
    setScale(s);
    setPan({ x: (el.clientWidth - width * s) / 2, y: (el.clientHeight - height * s) / 2 });
  };

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(el);
    fit();
    return () => observer.disconnect();
  }, [width, height]);

  const zoom = (delta: number) => {
    const el = viewport.current;
    if (!el) return;
    const next = Math.max(0.35, Math.min(1.6, scale + delta));
    const ratio = next / scale;
    setPan((p) => ({
      x: el.clientWidth / 2 - (el.clientWidth / 2 - p.x) * ratio,
      y: el.clientHeight / 2 - (el.clientHeight / 2 - p.y) * ratio,
    }));
    setScale(next);
  };

  const centerSelected = () => {
    const el = viewport.current;
    const p = positions.get(selectedId);
    if (!el || !p) return;
    setPan({
      x: el.clientWidth / 2 - (p.x + 86) * scale,
      y: el.clientHeight / 2 - (p.y + 64) * scale,
    });
  };

  // Drag handlers
  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, .ft-member-card, [role="button"]')) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const moveDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d) setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y });
  };

  const stopDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  // Connector paths
  const paths: { d: string; key: string }[] = useMemo(() => {
    const lines: { d: string; key: string }[] = [];
    members.forEach((m) => {
      const p = positions.get(m.id);
      if (!p) return;

      // Spousal / partner horizontal connector
      if (m.partnerId && m.id < m.partnerId) {
        const partner = positions.get(m.partnerId);
        if (partner && !searching && (generationFilter === 'all' || (visible.has(m.id) && visible.has(m.partnerId)))) {
          lines.push({ key: `partner-${m.id}`, d: `M ${p.x + 86} ${p.y + 62} H ${partner.x + 86}` });
        }
      }

      // Parental -> child descending connector
      if (m.parentIds && m.parentIds.length > 0 && !searching && generationFilter === 'all') {
        const parents = m.parentIds
          .map((id) => positions.get(id))
          .filter((a): a is { x: number; y: number } => Boolean(a));
        const firstParent = parents[0];
        if (firstParent) {
          const cx = parents.reduce((sum, a) => sum + a.x + 86, 0) / parents.length;
          const py = firstParent.y + 62;
          const mid = p.y - 32;
          lines.push({ key: `child-${m.id}`, d: `M ${cx} ${py} V ${mid} H ${p.x + 86} V ${p.y}` });
        }
      }
    });
    return lines;
  }, [members, positions, searching, generationFilter, visible]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingMember(null);
    setForm({
      name: '',
      age: '',
      gender: 'Male',
      relationship: 'Father',
      livingStatus: 'Living',
      bloodGroup: 'B+',
      condition: 'none',
      ageAtDiagnosis: '',
      severity: 'Controlled',
      medications: '',
      lifestyleNotes: '',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setForm({
      name: m.name,
      age: m.age.toString(),
      gender: m.gender,
      relationship: m.relationship,
      livingStatus: m.livingStatus || 'Living',
      bloodGroup: m.bloodGroup || 'B+',
      condition: m.history[0] || 'none',
      ageAtDiagnosis: m.ageAtDiagnosis ? m.ageAtDiagnosis.toString() : '',
      severity: m.severity || 'Controlled',
      medications: m.medications ? m.medications.join(', ') : '',
      lifestyleNotes: m.lifestyleNotes || '',
      notes: m.notes.join('\n'),
    });
    setFormError('');
    setModalOpen(true);
  };

  // Open Delete Confirmation
  const promptDeleteMember = (m: Member) => {
    setMemberToDelete(m);
    setDeleteModalOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeleting(true);

    try {
      if (memberToDelete.isBackendRecord) {
        await api.delete(`/family/members/${memberToDelete.id}`);
        if (onRefresh) await onRefresh();
      }
    } catch (err) {
      console.warn('Backend delete notification:', err);
    }

    // Update local state
    setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));

    // Choose fallback selected member so panel stays populated
    const remaining = members.filter((m) => m.id !== memberToDelete.id);
    const fallback = remaining.find((m) => m.relationship === 'Self') || remaining[0];
    if (fallback) {
      setSelectedId(fallback.id);
    }

    setNotice(`${memberToDelete.name} (${memberToDelete.relationship}) removed from the pedigree.`);
    setDeleting(false);
    setDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError('Please enter a full name with at least 2 characters.');
      return;
    }
    const ageNum = parseInt(form.age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 125) {
      setFormError('Please enter a valid age between 0 and 125.');
      return;
    }

    setSaving(true);
    setFormError('');

    const conditionValue = form.condition === 'none' ? 'None' : form.condition;
    const diagAge = form.ageAtDiagnosis ? parseInt(form.ageAtDiagnosis, 10) : null;
    const kinship = computeKinship(form.relationship);

    const payload = {
      relation: form.relationship,
      name: form.name.trim(),
      age: ageNum,
      condition: conditionValue,
      ageAtDiagnosis: diagAge,
      notes: form.notes.trim() || null,
      patientId: treeData?.patient?.id,
    };

    try {
      if (editingMember && editingMember.isBackendRecord) {
        await api.put(`/family/members/${editingMember.id}`, payload);
      } else {
        await api.post('/family/members', payload);
      }
      if (onRefresh) await onRefresh();
      setNotice(`${form.name.trim()} successfully saved.`);
    } catch {
      // Local optimistic update
    }

    const medsList = form.medications
      ? form.medications.split(',').map((s) => s.trim()).filter(Boolean)
      : form.condition !== 'none' ? ['Prescribed maintenance therapy'] : ['None'];

    const newMember: Member = {
      id: editingMember ? editingMember.id : `local-${Date.now()}`,
      name: form.name.trim(),
      age: ageNum,
      gender: form.gender,
      relationship: form.relationship,
      generation: inferGeneration(form.relationship),
      livingStatus: form.livingStatus,
      bloodGroup: form.bloodGroup,
      lineage: kinship.lineage,
      kinshipDegree: kinship.degree,
      history: form.condition === 'none' ? [] : [form.condition],
      ageAtDiagnosis: diagAge,
      severity: form.severity,
      medications: medsList,
      lifestyleNotes: form.lifestyleNotes.trim() || 'Routine healthy lifestyle adherence.',
      hereditaryRiskLevel: form.condition === 'none' ? 'Low' : 'Moderate',
      screeningAdvice: form.condition === 'none' ? 'Maintain periodic health checks.' : `Screening for ${form.condition} recommended.`,
      notes: form.notes ? form.notes.split('\n').filter(Boolean) : ['Documented relative in this session.'],
      parentIds: form.relationship === 'Sibling' ? ['amit', 'priya'] : [],
      isBackendRecord: editingMember?.isBackendRecord || false,
    };

    if (editingMember) {
      setMembers((prev) => prev.map((m) => (m.id === editingMember.id ? newMember : m)));
      setSelectedId(newMember.id);
    } else {
      setMembers((prev) => [...prev, newMember]);
      setSelectedId(newMember.id);
    }

    setSaving(false);
    setModalOpen(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  return (
    <div className="family-workspace-root">
      {/* 1. PAGE HEADING */}
      <div className="ft-page-heading">
        <div>
          <div className="ft-title-line">
            <h1>Family Health Tree</h1>
            <span className="ft-badge">GENETIC ROOTS EXPLORER</span>
          </div>
          <p>Multi-generational clinical pedigree, hereditary condition clusters, and personalized relative dossiers</p>
        </div>

        <div className="ft-header-actions">
          <button onClick={handleRefresh} disabled={refreshing} className="ft-btn-outline" title="Refresh pedigree">
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {canEdit && (
            <button onClick={handleOpenAdd} className="ft-btn-primary">
              <Plus size={16} /> Add Family Relative
            </button>
          )}
        </div>
      </div>

      {/* 2. DEMO BANNER */}
      <div className="ft-demo-banner">
        <Dna size={20} />
        <p>
          <strong>Clinical Pedigree & Disease Surveillance:</strong> Click any relative node on the canvas to inspect their comprehensive medical facts, blood group, medications, and hereditary risk transmission profile.
        </p>
        <span className="ft-demo-pill">SMARTHEALTH AI</span>
      </div>

      {/* 3. SUMMARY STATS WIDGETS */}
      <div className="ft-summary-grid">
        <div className="ft-summary-item">
          <div className="ft-summary-icon">
            <Users size={22} />
          </div>
          <div>
            <span>Pedigree relatives</span>
            <strong>
              {members.length}
              <small>Documented nodes</small>
            </strong>
          </div>
        </div>

        <div className="ft-summary-item">
          <div className="ft-summary-icon cyan">
            <GitFork size={22} />
          </div>
          <div>
            <span>Generations tracked</span>
            <strong>
              {new Set(members.map((m) => m.generation)).size || 3}
              <small>Multi-tiered lineage</small>
            </strong>
          </div>
        </div>

        <div className="ft-summary-item">
          <div className="ft-summary-icon mint">
            <HeartPulse size={22} />
          </div>
          <div>
            <span>Chronic factors flagged</span>
            <strong>
              {new Set(members.flatMap((m) => m.history)).size}
              <small>Hereditary clusters</small>
            </strong>
          </div>
        </div>
      </div>

      {/* 4. WORKSPACE TOOLBAR */}
      <div className="ft-workspace-toolbar">
        <div className="ft-view-label">
          <GitFork size={17} />
          <span>Interactive Pedigree Stage</span>
          <span className="ft-view-active-dot" />
        </div>

        <div className="ft-filter-controls">
          <div className="ft-search-field">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search relatives by name or condition..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search family members"
            />
            {query && (
              <button onClick={() => setQuery('')} className="ft-search-clear">
                <X size={15} />
              </button>
            )}
          </div>

          <select
            className="ft-generation-select"
            value={generationFilter}
            onChange={(e) => setGenerationFilter(e.target.value)}
            aria-label="Filter by generation"
          >
            <option value="all">All Generations</option>
            <option value="1">Generation 1 (Grandparents)</option>
            <option value="2">Generation 2 (Parents)</option>
            <option value="3">Generation 3 (Patient & Siblings)</option>
          </select>
        </div>
      </div>

      {/* 5. NOTICE BANNER */}
      {notice && (
        <div className="ft-save-notice" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {/* QUICK RELATIVE SELECT BAR */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
          <UserRound size={13} color="#2563eb" /> Select Relative:
        </span>
        {members.map((m) => {
          const isSel = selectedId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: isSel ? 750 : 500,
                cursor: 'pointer',
                border: isSel ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: isSel ? '#eff6ff' : '#ffffff',
                color: isSel ? '#1d4ed8' : '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: isSel ? '0 2px 6px rgba(37,99,235,0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.history.length > 0 ? '#ef4444' : '#10b981' }} />
              {m.name} ({m.relationship})
            </button>
          );
        })}
      </div>

      {/* 6. PRIMARY CANVAS + SIDEBAR GRID */}
      <div className="ft-family-grid">
        <div className="ft-family-primary">
          {/* SVG CANVAS CONTAINER */}
          <section className="ft-surface" aria-label="Family tree viewport">
            <div className="ft-panel-heading">
              <div>
                <h2>
                  <GitFork /> Genetic Relationship Canvas
                </h2>
                <p>Click any node to select and display complete dossier on the right panel.</p>
              </div>
              <span className="ft-tree-count">
                <UserRound size={13} /> {matches.length} relatives shown
              </span>
            </div>

            <div
              className={`ft-tree-viewport ${dragging ? 'is-dragging' : ''}`}
              ref={viewport}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              {matches.length === 0 ? (
                <div className="ft-tree-empty">
                  <SearchX size={36} color="#94a3b8" />
                  <h3>No family members match your filter</h3>
                  <p>Try searching another name or reset the generation filter.</p>
                  <button
                    className="ft-btn-outline"
                    onClick={() => {
                      setQuery('');
                      setGenerationFilter('all');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div
                  className="ft-tree-stage"
                  style={{
                    width,
                    height,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  }}
                >
                  {/* SVG CONNECTING PEDIGREE LINES */}
                  <svg className="ft-tree-connectors" width={width} height={height} aria-hidden="true">
                    {paths.map((p) => (
                      <path key={p.key} d={p.d} />
                    ))}
                  </svg>

                  {/* GENERATION TIER LABELS */}
                  <div className="ft-generation-label ft-generation-1">
                    <span>GENERATION 1</span>
                    <span>Grandparents Generation</span>
                  </div>
                  <div className="ft-generation-label ft-generation-2">
                    <span>GENERATION 2</span>
                    <span>Parents & Aunts/Uncles Generation</span>
                  </div>
                  <div className="ft-generation-label ft-generation-3">
                    <span>GENERATION 3</span>
                    <span>Patient & Siblings Generation</span>
                  </div>

                  {/* MEMBER CARDS ON CANVAS */}
                  {members.map((m) => {
                    const pos = positions.get(m.id);
                    if (!pos || !visible.has(m.id)) return null;

                    const isSelected = selectedId === m.id;
                    const isSelf = m.relationship.toLowerCase() === 'self' || m.id === 'rahul';
                    const indClass = indicatorClass(m.history);

                    return (
                      <div
                        key={m.id}
                        className={`ft-member-card ${isSelected ? 'ft-member-selected' : ''}`}
                        style={{ left: pos.x, top: pos.y, cursor: 'pointer' }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setSelectedId(m.id);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(m.id);
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                      >
                        <div className="ft-member-top">
                          <div className={`ft-member-avatar ${m.gender === 'Female' ? 'ft-avatar-female' : 'ft-avatar-male'}`}>
                            {initials(m.name)}
                          </div>
                          <div>
                            <strong>{m.name}</strong>
                            <span>
                              {m.age} yrs · {m.gender}
                            </span>
                          </div>
                          {isSelf && <span className="ft-self-badge">YOU</span>}
                        </div>

                        <div className="ft-member-relationship">{m.relationship}</div>

                        <div className={`ft-member-status ft-indicator-${indClass}`}>
                          {m.history.length > 0 ? <HeartPulse size={11} /> : <span className="ft-status-dot" />}
                          <span>{m.history[0] || 'No conditions'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <span className="ft-pan-hint">
                <Move size={12} /> Drag canvas to pan
              </span>
            </div>

            {/* CANVAS CONTROLS & FOOTER */}
            <div className="ft-tree-footer">
              <div className="ft-tree-legend">
                <span>
                  <i className="ft-selected-key" /> Selected Relative
                </span>
                <span>
                  <i className="ft-line-key" /> Biological Kinship Line
                </span>
                <span>
                  <i className="ft-health-key" /> Chronic Condition Flag
                </span>
              </div>

              <div className="ft-zoom-controls">
                <button title="Zoom out" onClick={() => zoom(-0.1)} disabled={scale <= 0.35}>
                  <Minus size={13} />
                </button>
                <div className="ft-zoom-value" title="Reset zoom" onClick={fit}>
                  {Math.round(scale * 100)}%
                </div>
                <button title="Zoom in" onClick={() => zoom(0.1)} disabled={scale >= 1.6}>
                  <Plus size={13} />
                </button>
                <span className="ft-control-divider" />
                <button title="Fit to view" onClick={fit}>
                  <RotateCcw size={13} />
                </button>
                <button title="Center selected relative" onClick={centerSelected}>
                  <LocateFixed size={13} />
                </button>
              </div>
            </div>
          </section>

          {/* FAMILY HEALTH INSIGHTS PANEL */}
          <section className="ft-surface ft-insights-panel">
            <div className="ft-panel-heading">
              <h2>
                <HeartPulse /> Hereditary Condition Aggregations
              </h2>
              <span className="ft-badge">GENETIC CLUSTERS</span>
            </div>

            <div className="ft-insight-categories">
              {[
                { name: 'Hypertension', icon: Activity, kind: 'pressure' },
                { name: 'Type 2 diabetes', icon: Droplets, kind: 'diabetes' },
                { name: 'Asthma', icon: Wind, kind: 'asthma' },
              ].map((c) => {
                const affected = members.filter((m) =>
                  m.history.some((h) => h.toLowerCase().includes(c.name.toLowerCase().replace('type 2 ', '')))
                );
                return (
                  <div key={c.name} className="ft-insight-item">
                    <div className={`ft-insight-icon ft-indicator-${c.kind}`}>
                      <c.icon size={18} />
                    </div>
                    <div>
                      <h3>{c.name}</h3>
                      <p>{affected.length} direct relatives diagnosed</p>
                      <span>{affected.map((m) => m.name.split(' ')[0]).join(', ') || 'None documented'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* 7. RIGHT COLUMN: RICH EXPANDED MEMBER DOSSIER */}
        <aside className="ft-surface ft-detail-panel" aria-label="Selected relative detailed dossier">
          <div className="ft-panel-heading">
            <h2>Relative Profile Dossier</h2>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {canEdit && selected && selected.relationship !== 'Self' && (
                <>
                  <button
                    onClick={() => handleOpenEdit(selected)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    title="Edit relative"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => promptDeleteMember(selected)}
                    style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    title="Delete relative"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Header */}
          <div className="ft-profile">
            <div className={`ft-profile-avatar ${selected.gender === 'Female' ? 'ft-avatar-female' : 'ft-avatar-male'}`}>
              {initials(selected.name)}
            </div>
            <h3>{selected.name}</h3>
            <p>
              {selected.relationship === 'Self' ? 'Primary Proband (Patient)' : selected.relationship} • {selected.age} years
            </p>

            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <span className={`ft-status-pill ${selected.livingStatus === 'Deceased' ? 'ft-status-deceased' : 'ft-status-living'}`}>
                {selected.livingStatus || 'Living'}
              </span>
              <span className="ft-blood-badge">
                Blood Group: {selected.bloodGroup || 'B+'}
              </span>
              <span className="ft-profile-label" style={{ margin: 0 }}>
                {selected.relationship === 'Self' ? 'Proband' : selected.relationship}
              </span>
            </div>
          </div>

          {/* Kinship & Genetic Transmission Card */}
          <div className="ft-kinship-card">
            <div className="ft-kinship-title">
              <Dna size={13} /> {selected.kinshipDegree || '1st Degree Relative (50% Shared DNA)'}
            </div>
            <div className="ft-kinship-desc">
              Lineage: <strong>{selected.lineage || 'Direct Nuclear Line'}</strong>. Biological shared genetics factor in hereditary multi-generational disease predictions.
            </div>
          </div>

          {/* Demographics & Vital Facts */}
          <div className="ft-profile-facts" style={{ marginTop: 12 }}>
            <div>
              <UserRound size={13} />
              <span>Gender</span>
              <strong>{selected.gender}</strong>
            </div>
            <div>
              <CalendarDays size={13} />
              <span>Current Age</span>
              <strong>{selected.age} years</strong>
            </div>
            <div>
              <GitFork size={13} />
              <span>Relationship</span>
              <strong>{selected.relationship}</strong>
            </div>
          </div>

          {/* Recorded Chronic Health Diagnosis */}
          <div className="ft-detail-section">
            <h4>
              <HeartPulse size={14} /> Recorded Diagnoses & Severity
            </h4>
            {selected.history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span className={`ft-condition-chip ft-indicator-${indicatorClass([h])}`} style={{ margin: 0 }}>
                      {h}
                    </span>
                    <span className={`ft-severity-badge ft-severity-${(selected.severity || 'controlled').toLowerCase().replace(' ', '')}`}>
                      {selected.severity || 'Controlled'}
                    </span>
                  </div>
                ))}
                {selected.ageAtDiagnosis && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    • Onset / Diagnosed at age: <strong>{selected.ageAtDiagnosis} years</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="ft-no-condition">
                <ShieldCheck size={14} />
                <span>No chronic medical conditions reported (Healthy)</span>
              </div>
            )}
          </div>

          {/* Active Medications & Regimen */}
          <div className="ft-detail-section">
            <h4>
              <Pill size={14} /> Prescriptions & Therapy Regimen
            </h4>
            {selected.medications && selected.medications.length > 0 ? (
              <ul className="ft-med-list">
                {selected.medications.map((med, idx) => (
                  <li key={idx} className="ft-med-item">
                    <Pill size={12} />
                    <span>{med}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>No active daily medications documented.</p>
            )}

            {selected.lifestyleNotes && (
              <div style={{ fontSize: 11, color: '#475569', marginTop: 8, background: '#f8fafc', padding: '6px 10px', borderRadius: 6, borderLeft: '3px solid #3b82f6' }}>
                <strong>Lifestyle:</strong> {selected.lifestyleNotes}
              </div>
            )}
          </div>

          {/* Hereditary Transmission & Screening Recommendations */}
          <div className="ft-risk-card">
            <div className="ft-risk-card-title">
              <ShieldAlert size={14} /> Hereditary Screening Guidance
            </div>
            <div className="ft-risk-card-body">
              {selected.screeningAdvice || 'Maintain routine age-appropriate wellness screening.'}
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="ft-detail-section ft-notes-section">
            <h4>
              <ClipboardList size={14} /> Clinical History Notes
            </h4>
            {selected.notes && selected.notes.length > 0 ? (
              <ul>
                {selected.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>No clinical history notes recorded.</p>
            )}
          </div>

          {/* Sidebar Action Buttons (Prominent Delete & Edit) */}
          {canEdit && selected && selected.relationship !== 'Self' && (
            <div className="ft-sidebar-actions">
              <button onClick={() => handleOpenEdit(selected)} className="ft-edit-btn">
                <Edit3 size={14} /> Edit Relative Profile
              </button>
              <button onClick={() => promptDeleteMember(selected)} className="ft-delete-btn">
                <Trash2 size={14} /> Delete Relative from Pedigree
              </button>
            </div>
          )}

          <div className="ft-detail-disclaimer">
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>Digital hereditary pedigree for proactive screening and clinical history.</span>
          </div>
        </aside>
      </div>

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && memberToDelete && (
        <div
          className="ft-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteModalOpen(false);
          }}
        >
          <div className="ft-confirm-dialog">
            <div className="ft-confirm-icon-box">
              <Trash2 size={24} />
            </div>
            <h3>Remove Relative from Pedigree?</h3>
            <p>
              Are you sure you want to permanently delete <strong>{memberToDelete.name} ({memberToDelete.relationship})</strong>?
              This will update hereditary disease transmission patterns and multi-generational risk projections.
            </p>
            <div className="ft-confirm-actions">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
                className="ft-btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteMember}
                className="ft-btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: '#dc2626' }}
              >
                {deleting ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Yes, Delete Relative
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. ADD / EDIT RELATIVE MODAL DIALOG */}
      {modalOpen && (
        <div
          className="ft-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setModalOpen(false);
          }}
        >
          <div className="ft-modal-card" style={{ maxWidth: 580 }}>
            <div className="ft-modal-header">
              <div>
                <h3>{editingMember ? 'Edit Relative Profile' : 'Add Family Relative'}</h3>
                <p>{editingMember ? `Updating clinical facts for ${editingMember.name}` : 'Document a biological or immediate relative in your pedigree'}</p>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="ft-modal-body">
              <div className="ft-form-grid">
                <label style={{ gridColumn: '1 / -1' }}>
                  Full Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Verma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>

                <label>
                  Current Age (years) *
                  <input
                    type="number"
                    min="0"
                    max="125"
                    required
                    placeholder="e.g. 58"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </label>

                <label>
                  Gender
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Biological Relationship *
                  <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Paternal Grandfather">Paternal Grandfather</option>
                    <option value="Paternal Grandmother">Paternal Grandmother</option>
                    <option value="Maternal Grandfather">Maternal Grandfather</option>
                    <option value="Maternal Grandmother">Maternal Grandmother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Living Status
                  <select
                    value={form.livingStatus}
                    onChange={(e) => setForm({ ...form, livingStatus: e.target.value as 'Living' | 'Deceased' })}
                  >
                    <option value="Living">Living</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                </label>

                <label>
                  Blood Group
                  <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </label>

                <label>
                  Chronic Condition Flag
                  <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                    <option value="none">No conditions / Healthy</option>
                    <option value="Hypertension">Hypertension</option>
                    <option value="Type 2 diabetes">Type 2 diabetes</option>
                    <option value="Type 1 diabetes">Type 1 diabetes</option>
                    <option value="Heart Disease">Heart Disease</option>
                    <option value="Asthma">Asthma</option>
                    <option value="Cancer">Cancer</option>
                    <option value="Stroke">Stroke</option>
                    <option value="Kidney Disease">Kidney Disease</option>
                    <option value="Thyroid Disorder">Thyroid Disorder</option>
                    <option value="Arthritis">Arthritis</option>
                  </select>
                </label>

                {form.condition !== 'none' && (
                  <>
                    <label>
                      Age at Diagnosis (years)
                      <input
                        type="number"
                        min="0"
                        max="125"
                        placeholder="e.g. 50"
                        value={form.ageAtDiagnosis}
                        onChange={(e) => setForm({ ...form, ageAtDiagnosis: e.target.value })}
                      />
                    </label>

                    <label>
                      Clinical Severity
                      <select
                        value={form.severity}
                        onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
                      >
                        <option value="Controlled">Controlled</option>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="High Risk">High Risk</option>
                      </select>
                    </label>
                  </>
                )}

                <label style={{ gridColumn: '1 / -1' }}>
                  Daily Medications / Treatments (comma-separated)
                  <input
                    type="text"
                    placeholder="e.g. Amlodipine 5mg, Metformin 500mg, Daily Inhaler"
                    value={form.medications}
                    onChange={(e) => setForm({ ...form, medications: e.target.value })}
                  />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  Dietary / Lifestyle Management Notes
                  <input
                    type="text"
                    placeholder="e.g. Low sodium diet, 30 min daily walking, non-smoker"
                    value={form.lifestyleNotes}
                    onChange={(e) => setForm({ ...form, lifestyleNotes: e.target.value })}
                  />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  Clinical History Notes
                  <textarea
                    placeholder="e.g. Monitored quarterly by cardiologist. Annual lipid panel normal..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </label>
              </div>

              {formError && <div className="ft-form-error">{formError}</div>}

              <div className="ft-modal-footer">
                {editingMember && editingMember.relationship !== 'Self' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      promptDeleteMember(editingMember);
                    }}
                    className="ft-btn-outline"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="ft-btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="ft-btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> {editingMember ? 'Update Relative Profile' : 'Save Relative Profile'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default FamilyTree;
