import React, { useState, useEffect, useRef, type PointerEvent } from 'react';
import {
  GitFork,
  Plus,
  AlertTriangle,
  Info,
  Trash2,
  HeartPulse,
  User,
  Users,
  X,
  Search,
  Check,
  Move,
  Minus,
  RotateCcw,
  LocateFixed,
  UserRound,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  Activity,
  Droplets,
  Wind,
  Filter,
} from 'lucide-react';
import api from '../services/api';

export interface Member {
  id: string;
  name: string;
  age: number;
  gender: string;
  relationship: string;
  generation: number;
  history: string[];
  notes: string[];
  parentIds: string[];
  partnerId?: string;
  condition?: string;
  ageAtDiagnosis?: number;
}

interface FamilyTreeProps {
  treeData: {
    patient: {
      id: string;
      name: string;
      healthId: string;
      chronicConditions: string;
    };
    members: Array<{
      id: string;
      relation: string;
      name: string;
      age?: number;
      condition: string;
      ageAtDiagnosis?: number;
      notes?: string;
    }>;
    grouped?: {
      grandparents: any[];
      parents: any[];
      siblings: any[];
      children: any[];
      others: any[];
    };
    patterns?: Array<{
      diseaseCategory: string;
      affectedCount: number;
      relatives: string[];
      recommendation: string;
      disclaimer: string;
    }>;
  };
  onRefresh: () => void;
  canEdit?: boolean;
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
}

export function indicator(history: string[]) {
  if (!history || history.length === 0) return 'clear';
  const first = history[0].toLowerCase();
  if (first.includes('hyper') || first.includes('cardio') || first.includes('pressure')) return 'pressure';
  if (first.includes('diabet')) return 'diabetes';
  if (first.includes('asthma') || first.includes('respir')) return 'asthma';
  return 'pressure';
}

export function formatRelationshipLabel(rel: string): string {
  const r = (rel || '').toLowerCase().trim();
  if (r === 'self') return 'Primary Patient (Self)';
  if (r === 'father') return 'Father (Parent)';
  if (r === 'mother') return 'Mother (Parent)';
  if (r === 'grandfather' || r === 'paternal grandfather') return 'Paternal Grandfather';
  if (r === 'grandmother' || r === 'paternal grandmother') return 'Paternal Grandmother';
  if (r === 'maternal grandfather') return 'Maternal Grandfather';
  if (r === 'maternal grandmother') return 'Maternal Grandmother';
  if (r === 'brother') return 'Brother (Sibling)';
  if (r === 'sister') return 'Sister (Sibling)';
  if (r === 'son') return 'Son (Child)';
  if (r === 'daughter') return 'Daughter (Child)';
  return rel;
}

function mapDatabaseMembers(treeData: FamilyTreeProps['treeData']): Member[] {
  const patient = treeData.patient;
  const dbMembers = treeData.members || [];

  if (dbMembers.length === 0) {
    const defaultSelf: Member = {
      id: 'self',
      name: patient.name || 'Rahul Verma',
      age: 28,
      gender: 'Male',
      relationship: 'Self',
      generation: 3,
      history: patient.chronicConditions ? [patient.chronicConditions] : [],
      notes: [
        'Primary patient record registered on SmartHealth.',
        'Hereditary screening tracking active.',
      ],
      parentIds: ['parent-1', 'parent-2'],
    };

    return [
      {
        id: 'grandparent-1',
        name: 'Vijay Verma',
        age: 79,
        gender: 'Male',
        relationship: 'Paternal grandfather',
        generation: 1,
        history: ['Hypertension'],
        notes: ['History of hypertension since age 62.'],
        parentIds: [],
        partnerId: 'grandparent-2',
      },
      {
        id: 'grandparent-2',
        name: 'Sunita Verma',
        age: 75,
        gender: 'Female',
        relationship: 'Paternal grandmother',
        generation: 1,
        history: ['Type 2 diabetes'],
        notes: ['History of type 2 diabetes.'],
        parentIds: [],
        partnerId: 'grandparent-1',
      },
      {
        id: 'parent-1',
        name: 'Amit Verma',
        age: 55,
        gender: 'Male',
        relationship: 'Father',
        generation: 2,
        history: ['Hypertension'],
        notes: ['Essential hypertension recorded since age 48.'],
        parentIds: ['grandparent-1', 'grandparent-2'],
        partnerId: 'parent-2',
      },
      {
        id: 'parent-2',
        name: 'Priya Verma',
        age: 52,
        gender: 'Female',
        relationship: 'Mother',
        generation: 2,
        history: ['Type 2 diabetes'],
        notes: ['Routine follow-up recorded.'],
        parentIds: [],
        partnerId: 'parent-1',
      },
      defaultSelf,
    ];
  }

  // 1. Map raw database records
  const mappedMembers: Member[] = dbMembers.map((m) => {
    const rel = (m.relation || '').toLowerCase();
    let generation = 2;
    let gender = (m as any).gender || (rel.includes('mother') || rel.includes('sister') || rel.includes('daughter') ? 'Female' : 'Male');

    if (rel.includes('grand')) {
      generation = 1;
      if (!(m as any).gender) gender = rel.includes('mother') ? 'Female' : 'Male';
    } else if (rel.includes('father') || rel.includes('mother')) {
      generation = 2;
      if (!(m as any).gender) gender = rel.includes('mother') ? 'Female' : 'Male';
    } else if (rel.includes('brother') || rel.includes('sister') || rel.includes('sibling')) {
      generation = 3;
      if (!(m as any).gender) gender = rel.includes('sister') ? 'Female' : 'Male';
    } else if (rel.includes('son') || rel.includes('daughter') || rel.includes('child')) {
      generation = 3;
      if (!(m as any).gender) gender = rel.includes('daughter') ? 'Female' : 'Male';
    }

    return {
      id: m.id,
      name: m.name,
      age: m.age || (generation === 1 ? 80 : generation === 2 ? 58 : 28),
      gender,
      relationship: m.relation,
      generation,
      history: m.condition && m.condition.toLowerCase() !== 'none' ? [m.condition] : [],
      notes: m.notes ? [m.notes] : ['Medical profile documented in SmartHealth.'],
      parentIds: [],
    };
  });

  // 2. Identify and link parent relationships
  const fathers = mappedMembers.filter((m) => m.relationship.toLowerCase().includes('father') && !m.relationship.toLowerCase().includes('grand'));
  const mothers = mappedMembers.filter((m) => m.relationship.toLowerCase().includes('mother') && !m.relationship.toLowerCase().includes('grand'));
  const paternalGrandparents = mappedMembers.filter((m) => {
    const r = m.relationship.toLowerCase();
    return r.includes('paternal') || (r.includes('grand') && !r.includes('maternal'));
  });
  const maternalGrandparents = mappedMembers.filter((m) => m.relationship.toLowerCase().includes('maternal'));

  // Link Father and Mother as spouses
  if (fathers.length > 0 && mothers.length > 0) {
    fathers[0].partnerId = mothers[0].id;
    mothers[0].partnerId = fathers[0].id;
  }

  // Link Grandparents to Father
  if (fathers.length > 0 && paternalGrandparents.length > 0) {
    fathers[0].parentIds = paternalGrandparents.map((g) => g.id);
    if (paternalGrandparents.length >= 2) {
      paternalGrandparents[0].partnerId = paternalGrandparents[1].id;
      paternalGrandparents[1].partnerId = paternalGrandparents[0].id;
    }
  }

  // Link Grandparents to Mother
  if (mothers.length > 0 && maternalGrandparents.length > 0) {
    mothers[0].parentIds = maternalGrandparents.map((g) => g.id);
    if (maternalGrandparents.length >= 2) {
      maternalGrandparents[0].partnerId = maternalGrandparents[1].id;
      maternalGrandparents[1].partnerId = maternalGrandparents[0].id;
    }
  }

  // 3. Link Self to Parents
  const parentIdsForSelf: string[] = [];
  if (fathers.length > 0) parentIdsForSelf.push(fathers[0].id);
  if (mothers.length > 0) parentIdsForSelf.push(mothers[0].id);

  const selfMember: Member = {
    id: 'self',
    name: patient.name || 'Rahul Verma',
    age: 28,
    gender: 'Male',
    relationship: 'Self',
    generation: 3,
    history: patient.chronicConditions ? [patient.chronicConditions] : [],
    notes: [
      'Primary patient record registered on SmartHealth.',
      'Hereditary screening tracking active.',
    ],
    parentIds: parentIdsForSelf,
  };

  // Link siblings or children
  mappedMembers.forEach((m) => {
    const r = m.relationship.toLowerCase();
    if (r.includes('brother') || r.includes('sister') || r.includes('sibling')) {
      m.parentIds = parentIdsForSelf;
    } else if (r.includes('son') || r.includes('daughter') || r.includes('child')) {
      m.parentIds = ['self'];
    }
  });

  return [...mappedMembers, selfMember];
}

export function layoutMembers(members: Member[]) {
  const CARD_WIDTH = 210;
  const colWidth = 254; // Card width + gap

  const width = Math.max(
    1000,
    ...[1, 2, 3].map((g) => members.filter((m) => m.generation === g).length * colWidth + 180)
  );
  const positions = new Map<string, { x: number; y: number }>();

  [1, 2, 3].forEach((g) => {
    const row = members.filter((m) => m.generation === g);
    row.forEach((m, i) =>
      positions.set(m.id, {
        x: width / 2 + (i - (row.length - 1) / 2) * colWidth - CARD_WIDTH / 2,
        y: 60 + (g - 1) * 200,
      })
    );
  });
  return { width, height: 680, positions };
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ treeData, onRefresh, canEdit = true }) => {
  const [members, setMembers] = useState<Member[]>(() => mapDatabaseMembers(treeData));
  const [selectedId, setSelectedId] = useState<string>('self');
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState('');

  // Add form state
  const [addName, setAddName] = useState('');
  const [addAge, setAddAge] = useState('');
  const [addGender, setAddGender] = useState('Male');
  const [addRelation, setAddRelation] = useState('Father');
  const [addCondition, setAddCondition] = useState('None');
  const [addNotes, setAddNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Zoom & Pan refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setMembers(mapDatabaseMembers(treeData));
  }, [treeData]);

  const { width, height, positions } = layoutMembers(members);

  const matches = members.filter(
    (m) =>
      (generation === 'all' || m.generation === Number(generation)) &&
      m.name.toLowerCase().includes(query.toLowerCase().trim())
  );
  const visible = new Set(matches.map((m) => m.id));
  const selected = members.find((m) => m.id === selectedId) || members[0];

  const fit = () => {
    const el = viewportRef.current;
    if (!el) return;
    const s = Math.min(0.95, (el.clientWidth - 24) / width, (el.clientHeight - 14) / height);
    setScale(s);
    setPan({ x: (el.clientWidth - width * s) / 2, y: (el.clientHeight - height * s) / 2 });
  };

  useEffect(() => {
    fit();
  }, [width, height]);

  const zoom = (delta: number) => {
    const el = viewportRef.current;
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
    const el = viewportRef.current;
    const p = positions.get(selectedId);
    if (!el || !p) return;
    setPan({
      x: el.clientWidth / 2 - (p.x + 105) * scale,
      y: el.clientHeight / 2 - (p.y + 69) * scale,
    });
  };

  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const moveDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d) setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y });
  };

  const stopDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  // Build pedigree connectors with animated dashed arrows
  const CARD_WIDTH = 210;
  const CARD_HEIGHT = 138;
  const paths: { d: string; key: string; isPartner?: boolean; isSelected?: boolean }[] = [];

  // 1. Spousal / Partner horizontal connections (e.g. Father <-> Mother)
  members.forEach((m) => {
    if (m.partnerId && m.id < m.partnerId) {
      const p1 = positions.get(m.id);
      const p2 = positions.get(m.partnerId);
      if (p1 && p2 && (generation === 'all' || (visible.has(m.id) && visible.has(m.partnerId)))) {
        const left = p1.x < p2.x ? p1 : p2;
        const right = p1.x < p2.x ? p2 : p1;
        const bridgeY = left.y + 45;
        paths.push({
          key: `partner-${m.id}-${m.partnerId}`,
          d: `M ${left.x + CARD_WIDTH} ${bridgeY} H ${right.x}`,
          isPartner: true,
          isSelected: selectedId === m.id || selectedId === m.partnerId,
        });
      }
    }
  });

  // 2. Inter-generational Lineage Animated Dashed Arrows (pointing down to children / descendants)
  members.forEach((m) => {
    const childPos = positions.get(m.id);
    if (!childPos) return;

    if (m.parentIds && m.parentIds.length > 0 && generation === 'all') {
      const parentPositions = m.parentIds
        .map((pid) => positions.get(pid))
        .filter((pos): pos is { x: number; y: number } => Boolean(pos));

      if (parentPositions.length === 1) {
        // Single parent (e.g. Grandfather -> Father)
        const p = parentPositions[0];
        const fromX = p.x + CARD_WIDTH / 2;
        const fromY = p.y + CARD_HEIGHT;
        const toX = childPos.x + CARD_WIDTH / 2;
        const toY = childPos.y;

        let d = '';
        if (Math.abs(fromX - toX) < 4) {
          d = `M ${fromX} ${fromY} V ${toY - 2}`;
        } else {
          const midY = fromY + (toY - fromY) / 2;
          d = `M ${fromX} ${fromY} V ${midY} H ${toX} V ${toY - 2}`;
        }

        paths.push({
          key: `lineage-${m.parentIds[0]}-${m.id}`,
          d,
          isSelected: selectedId === m.id || selectedId === m.parentIds[0],
        });
      } else if (parentPositions.length >= 2) {
        // Dual parents (e.g. Father & Mother -> Rahul Verma / Self)
        const p1 = parentPositions[0];
        const p2 = parentPositions[1];
        const parentMidX = (p1.x + p2.x + CARD_WIDTH) / 2;
        const parentBridgeY = p1.y + 45;
        const toX = childPos.x + CARD_WIDTH / 2;
        const toY = childPos.y;
        const midY = p1.y + CARD_HEIGHT + (toY - (p1.y + CARD_HEIGHT)) / 2;

        const d = `M ${parentMidX} ${parentBridgeY} V ${midY} H ${toX} V ${toY - 2}`;

        paths.push({
          key: `lineage-parents-${m.id}`,
          d,
          isSelected: selectedId === m.id || m.parentIds.includes(selectedId),
        });
      }
    }
  });

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/family/member', {
        patientId: treeData.patient.id,
        relation: addRelation,
        name: addName.trim(),
        age: addAge ? parseInt(addAge) : null,
        condition: addCondition,
        notes: addNotes,
      });

      setShowAddModal(false);
      setAddName('');
      setAddAge('');
      setAddNotes('');
      setNotice(`${addName.trim()} added to your family medical tree.`);
      setTimeout(() => setNotice(''), 4000);
      onRefresh();
    } catch {
      // Local fallback for offline or custom members
      const newM: Member = {
        id: `m-${Date.now()}`,
        name: addName.trim(),
        age: addAge ? Number(addAge) : 35,
        gender: addGender,
        relationship: addRelation,
        generation: addRelation.includes('Grand') ? 1 : addRelation.includes('Father') || addRelation.includes('Mother') ? 2 : 3,
        history: addCondition !== 'None' ? [addCondition] : [],
        notes: [addNotes || 'Family medical profile recorded.'],
        parentIds: addRelation.includes('Sister') || addRelation.includes('Brother') ? ['parent-1', 'parent-2'] : [],
      };
      setMembers((prev) => [...prev, newM]);
      setSelectedId(newM.id);
      setShowAddModal(false);
      setNotice(`${newM.name} added to your family medical tree.`);
      setTimeout(() => setNotice(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { name: 'Hypertension', icon: Activity, kind: 'pressure' },
    { name: 'Type 2 diabetes', icon: Droplets, kind: 'diabetes' },
    { name: 'Asthma', icon: Wind, kind: 'asthma' },
  ];

  return (
    <div className="healthroots-tree-workspace">
      {/* Page Heading & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <GitFork size={24} color="var(--primary-600)" />
            Family Health Tree
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.04em', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
              PEDIGREE WORKSPACE
            </span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Interactive multi-generational medical pedigree and hereditary risk pattern detection
          </p>
        </div>

        {canEdit && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem' }}>
            <Plus size={16} /> Add Family Member
          </button>
        )}
      </div>

      {notice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
          <Check size={16} /> {notice}
        </div>
      )}

      {/* Summary Metrics Bar */}
      <div className="healthroots-summary-grid">
        <div className="healthroots-summary-item">
          <div className="healthroots-summary-icon">
            <Users size={22} />
          </div>
          <div>
            <span>Family members</span>
            <strong>
              {members.length} <small>Documented</small>
            </strong>
          </div>
        </div>

        <div className="healthroots-summary-item">
          <div className="healthroots-summary-icon cyan">
            <GitFork size={22} />
          </div>
          <div>
            <span>Generations</span>
            <strong>
              3 <small>Lineages Connected</small>
            </strong>
          </div>
        </div>

        <div className="healthroots-summary-item">
          <div className="healthroots-summary-icon mint">
            <HeartPulse size={22} />
          </div>
          <div>
            <span>Active Categories</span>
            <strong>
              {new Set(members.flatMap((m) => m.history)).size} <small>Conditions Tracked</small>
            </strong>
          </div>
        </div>
      </div>

      {/* Controls & Search Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
          <GitFork size={17} color="var(--primary-600)" />
          <span>Interactive Canvas</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              placeholder="Search member name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.82rem' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="form-select"
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
            style={{ width: '150px', height: '36px', fontSize: '0.82rem' }}
          >
            <option value="all">All Generations</option>
            <option value="1">Grandparents</option>
            <option value="2">Parents</option>
            <option value="3">Children</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column Family Grid */}
      <div className="healthroots-grid">
        <div className="healthroots-primary">
          {/* Visual Interactive Pedigree Canvas */}
          <div className="healthroots-surface">
            <div className="healthroots-panel-heading">
              <h2>
                <GitFork size={16} color="var(--primary-600)" />
                {treeData.patient.name ? `${treeData.patient.name.split(' ')[0]}'s Family Pedigree` : 'Family Pedigree Canvas'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '3px 8px', borderRadius: '4px' }}>
                {matches.length} visible
              </span>
            </div>

            <div
              className={`healthroots-viewport ${dragging ? 'is-dragging' : ''}`}
              ref={viewportRef}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              <div
                className="healthroots-stage"
                style={{
                  width,
                  height,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                }}
              >
                <svg className="healthroots-connectors" width={width} height={height}>
                  <defs>
                    <marker
                      id="pedigree-arrow"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
                    </marker>
                    <marker
                      id="pedigree-arrow-active"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
                    </marker>
                  </defs>
                  {paths.map((p) => (
                    <path
                      key={p.key}
                      d={p.d}
                      className={p.isPartner ? 'healthroots-partner-line' : 'animated-pedigree-arrow'}
                      markerEnd={p.isPartner ? undefined : p.isSelected ? 'url(#pedigree-arrow-active)' : 'url(#pedigree-arrow)'}
                      style={{
                        stroke: p.isSelected ? '#2563eb' : (p.isPartner ? '#94a3b8' : '#0284c7'),
                        strokeWidth: p.isSelected ? 2.8 : 2.2,
                      }}
                    />
                  ))}
                </svg>

                {/* Generation Labels */}
                {[1, 2, 3].map((g) => (
                  <div key={g} className="healthroots-gen-label" style={{ top: g === 1 ? '16px' : g === 2 ? '216px' : '416px' }}>
                    <span>GENERATION {g}</span>
                    <span style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '8px', color: 'var(--text-light)', fontWeight: 500 }}>
                      {['Grandparents', 'Parents', 'Children / Siblings'][g - 1]}
                    </span>
                  </div>
                ))}

                {/* Pedigree Member Cards */}
                {members.map((m) => {
                  const pos = positions.get(m.id);
                  if (!pos || !visible.has(m.id)) return null;
                  const isSelected = selectedId === m.id;
                  const ind = indicator(m.history);

                  return (
                    <div
                      key={m.id}
                      className={`healthroots-member-card ${isSelected ? 'member-selected' : ''}`}
                      style={{ left: pos.x, top: pos.y }}
                      onClick={() => setSelectedId(m.id)}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                        <div className={`healthroots-member-avatar ${m.gender === 'Female' ? 'healthroots-avatar-female' : 'healthroots-avatar-male'}`}>
                          {initials(m.name)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1, paddingRight: m.id === 'self' ? '40px' : '0' }}>
                          <strong
                            style={{
                              display: 'block',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              color: '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.25,
                            }}
                            title={m.name}
                          >
                            {m.name}
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                            {m.age} yrs &bull; {m.gender}
                          </span>
                        </div>
                        {m.id === 'self' && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              background: '#0284c7',
                              color: '#ffffff',
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 999,
                              letterSpacing: '0.04em',
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: '#0369a1',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          padding: '2.5px 7px',
                          margin: '8px 0 6px',
                          fontWeight: 700,
                          display: 'inline-block',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatRelationshipLabel(m.relationship)}
                      </div>

                      <div className={`healthroots-member-status healthroots-indicator-${ind}`}>
                        {m.history.length ? <HeartPulse size={12} /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.history[0] || 'No conditions reported'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'white', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '4px 6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                <Move size={13} /> Drag to Pan
              </span>
            </div>

            {/* Tree Footer Controls */}
            <div className="healthroots-tree-footer">
              <div className="healthroots-tree-legend">
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i style={{ width: '9px', height: '9px', border: '1.5px solid var(--primary-600)', borderRadius: '2px', background: '#dbeafe' }} />
                  Selected member
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="22" height="10" style={{ overflow: 'visible' }}>
                    <line x1="0" y1="5" x2="15" y2="5" stroke="#0284c7" strokeWidth="2.2" strokeDasharray="4,3" />
                    <polygon points="14,2 20,5 14,8" fill="#0284c7" />
                  </svg>
                  Lineage flow (animated)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--tree-rose)' }} />
                  Hereditary condition
                </span>
              </div>

              <div className="healthroots-zoom-controls">
                <button title="Zoom Out" onClick={() => zoom(-0.1)}>
                  <Minus size={14} />
                </button>
                <button title="Reset Zoom" onClick={fit} style={{ width: '44px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {Math.round(scale * 100)}%
                </button>
                <button title="Zoom In" onClick={() => zoom(0.1)}>
                  <Plus size={14} />
                </button>
                <button title="Center View" onClick={centerSelected} style={{ borderLeft: '1px solid var(--border-light)' }}>
                  <LocateFixed size={14} />
                </button>
                <button title="Reset Pan" onClick={fit}>
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Family Health Insights Panel */}
          <div className="healthroots-surface">
            <div className="healthroots-panel-heading">
              <h2>
                <HeartPulse size={16} color="var(--primary-600)" />
                Family Health Insights &amp; Recurring Patterns
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PATIENT LINEAGE</span>
            </div>

            <div className="healthroots-insight-categories">
              {categories.map((c) => {
                const matching = members.filter((m) => m.history.some((h) => h.toLowerCase().includes(c.name.toLowerCase().slice(0, 5))));
                return (
                  <div className="healthroots-insight-item" key={c.name}>
                    <div className={`healthroots-insight-icon healthroots-indicator-${c.kind}`}>
                      <c.icon size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-main)' }}>{c.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
                        {matching.length} family member{matching.length === 1 ? '' : 's'} affected
                      </p>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                        {matching.map((m) => m.name.split(' ')[0]).join(', ') || 'None reported'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Member Detail Panel (Right Sidebar) */}
        {selected && (
          <div className="healthroots-surface" style={{ padding: 0 }}>
            <div className="healthroots-panel-heading">
              <h2>Member Details</h2>
              <span style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                {selected.relationship}
              </span>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem 1rem 1rem' }}>
              <div
                className={`healthroots-member-avatar ${selected.gender === 'Female' ? 'healthroots-avatar-female' : 'healthroots-avatar-male'}`}
                style={{ width: '64px', height: '64px', fontSize: '1.25rem', margin: '0 auto 0.75rem' }}
              >
                {initials(selected.name)}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>{selected.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {selected.relationship === 'Self' ? 'Primary Patient' : selected.relationship} • {selected.age} years
              </p>
            </div>

            <div style={{ padding: '0 1.25rem 1rem', display: 'grid', gap: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gender:</span>
                <strong>{selected.gender}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Age:</span>
                <strong>{selected.age} years</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Generation:</span>
                <strong>Generation {selected.generation}</strong>
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Documented Conditions
              </div>
              {selected.history.length ? (
                selected.history.map((h) => (
                  <span key={h} className={`healthroots-member-status healthroots-indicator-${indicator([h])}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                    <HeartPulse size={12} /> {h}
                  </span>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>
                  <ShieldCheck size={16} /> No chronic conditions reported
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Clinical Notes
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {selected.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Add Family Member Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem', background: '#ffffff', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Add Family Member</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMember}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Full Name *</label>
                <input required className="form-input" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Ramesh Verma" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" min="0" max="120" className="form-input" value={addAge} onChange={(e) => setAddAge(e.target.value)} placeholder="Years" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={addGender} onChange={(e) => setAddGender(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Relationship to Patient</label>
                  <select className="form-select" value={addRelation} onChange={(e) => setAddRelation(e.target.value)}>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select className="form-select" value={addCondition} onChange={(e) => setAddCondition(e.target.value)}>
                    <option value="None">None (Healthy)</option>
                    <option value="Hypertension">Hypertension</option>
                    <option value="Type 2 diabetes">Type 2 Diabetes</option>
                    <option value="Asthma">Asthma</option>
                    <option value="Cardiovascular Disease">Cardiovascular Disease</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Clinical Notes</label>
                <input className="form-input" value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder="e.g. Diagnosed at age 52; ongoing lifestyle care" />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save to Family Tree'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTree;
