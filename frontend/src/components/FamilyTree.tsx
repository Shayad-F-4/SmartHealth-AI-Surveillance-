import React, { useState } from 'react';
import { GitFork, Plus, AlertTriangle, Info, Trash2, HeartPulse, User, Users, X, Eye, TrendingUp, Shield } from 'lucide-react';
import api from '../services/api';

interface FamilyMember {
  id: string;
  relation: string;
  name: string;
  age?: number;
  condition: string;
  ageAtDiagnosis?: number;
  notes?: string;
}

interface FamilyTreeProps {
  treeData: {
    patient: {
      id: string;
      name: string;
      healthId: string;
      chronicConditions: string;
    };
    members: FamilyMember[];
    grouped: {
      grandparents: FamilyMember[];
      parents: FamilyMember[];
      siblings: FamilyMember[];
      children: FamilyMember[];
      others: FamilyMember[];
    };
    patterns: Array<{
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

export const FamilyTree: React.FC<FamilyTreeProps> = ({ treeData, onRefresh, canEdit = true }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [relation, setRelation] = useState('Father');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');
  const [ageAtDiagnosis, setAgeAtDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.65));
  const handleResetZoom = () => setZoomLevel(1.0);
  const handleFitTree = () => setZoomLevel(0.85);

  const getStatusInfo = (cond?: string) => {
    if (!cond || cond.trim() === '' || cond.toLowerCase() === 'none' || cond.toLowerCase() === 'healthy') {
      return { label: 'Healthy', color: '#10B981', bg: '#DCFCE7', border: '#86EFAC' };
    }
    const isHighRisk = ['cancer', 'heart attack', 'stroke', 'cardiovascular', 'renal failure', 'high risk'].some((c) =>
      cond.toLowerCase().includes(c)
    );
    if (isHighRisk) {
      return { label: 'High Risk', color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5' };
    }
    return { label: 'With Condition', color: '#D97706', bg: '#FEF3C7', border: '#FCD34D' };
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/family/member', {
        patientId: treeData.patient.id,
        relation,
        name,
        age: age ? parseInt(age) : null,
        condition: condition || 'None',
        ageAtDiagnosis: ageAtDiagnosis ? parseInt(ageAtDiagnosis) : null,
        notes,
      });
      setShowAddForm(false);
      setName('');
      setAge('');
      setCondition('');
      setAgeAtDiagnosis('');
      setNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add family member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Remove this family member record?')) return;
    try {
      await api.delete(`/family/member/${id}`);
      onRefresh();
    } catch (err: any) {
      alert('Failed to remove record');
    }
  };

  // Calculate statistics
  const totalMembers = treeData.members.length;
  const membersWithConditions = treeData.members.filter(
    (m) => m.condition && m.condition.toLowerCase() !== 'none'
  ).length;
  const uniqueConditions = new Set(
    treeData.members
      .filter((m) => m.condition && m.condition.toLowerCase() !== 'none')
      .map((m) => m.condition)
  ).size;
  const averageAge =
    treeData.members.filter((m) => m.age).length > 0
      ? Math.round(
          treeData.members.reduce((sum, m) => sum + (m.age || 0), 0) /
            treeData.members.filter((m) => m.age).length
        )
      : 0;

  const renderNode = (m: FamilyMember) => {
    const status = getStatusInfo(m.condition);

    return (
      <div
        key={m.id}
        className="tree-node"
        style={{
          background: status.bg,
          border: `2px solid ${status.border}`,
          borderRadius: '14px',
          padding: '1rem 1.125rem',
          minWidth: '200px',
          maxWidth: '240px',
          position: 'relative',
          transition: 'all 0.25s',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        }}
        onClick={() => setSelectedMember(m)}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.7)',
              padding: '0.25rem 0.625rem',
              borderRadius: '6px',
            }}
          >
            <User size={12} color={status.color} />
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                color: status.color,
                fontWeight: 800,
                letterSpacing: '0.04em',
              }}
            >
              {m.relation}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                background: status.color,
                color: '#ffffff',
              }}
            >
              {status.label}
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMember(m.id);
                }}
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#0F1B3D',
            marginBottom: '0.625rem',
            lineHeight: 1.2,
          }}
        >
          {m.name}
        </div>

        {/* Age */}
        {m.age && (
          <div
            style={{
              fontSize: '0.8rem',
              color: '#64748B',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <span style={{ fontWeight: 600 }}>Age:</span> {m.age} years
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: status.border,
            margin: '0.625rem 0',
          }}
        />

        {/* Condition */}
        <div style={{ marginBottom: '0.375rem' }}>
          <div
            style={{
              fontSize: '0.73rem',
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.3rem',
            }}
          >
            Health Condition
          </div>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: status.color,
              lineHeight: 1.3,
            }}
          >
            {m.condition || 'None reported'}
          </div>
          {m.ageAtDiagnosis && (
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94A3B8',
                marginTop: '0.25rem',
              }}
            >
              Diagnosed at age {m.ageAtDiagnosis}
            </div>
          )}
        </div>

        {/* Notes preview */}
        {m.notes && (
          <div
            style={{
              fontSize: '0.75rem',
              color: '#64748B',
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: '6px',
              lineHeight: 1.4,
              maxHeight: '2.8em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {m.notes}
          </div>
        )}

        {/* View details indicator */}
        <div
          style={{
            marginTop: '0.625rem',
            fontSize: '0.75rem',
            color: '#1677E8',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <Eye size={12} /> Click to view details
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Member Detail Modal */}
      {selectedMember && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(15, 27, 61, 0.5)', 
            zIndex: 100, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '1rem',
          }} 
          onClick={() => setSelectedMember(null)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '18px', 
              padding: '2rem', 
              width: '100%', 
              maxWidth: '520px', 
              boxShadow: '0 20px 60px rgba(15, 27, 61, 0.25)',
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1677E8 0%, #0EA5E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {selectedMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F1B3D', marginBottom: '0.25rem' }}>
                    {selectedMember.name}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 600 }}>
                    {selectedMember.relation}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMember(null)} 
                style={{ 
                  background: '#F1F5F9', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '0.5rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                }}
              >
                <X size={18} color="#475569" />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Basic Info */}
              <div style={{ 
                padding: '1.125rem', 
                background: '#F8FBFF', 
                borderRadius: '12px', 
                border: '1px solid #E3ECF5',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                      Relation
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F1B3D' }}>
                      {selectedMember.relation}
                    </div>
                  </div>
                  {selectedMember.age && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        Current Age
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F1B3D' }}>
                        {selectedMember.age} years
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Health Condition */}
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748B', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Health Condition
                </div>
                <div style={{
                  padding: '1rem 1.125rem',
                  background: selectedMember.condition && selectedMember.condition.toLowerCase() !== 'none' ? '#FEF2F2' : '#F0FDF4',
                  border: `2px solid ${selectedMember.condition && selectedMember.condition.toLowerCase() !== 'none' ? '#FECACA' : '#D1FAE5'}`,
                  borderRadius: '12px',
                }}>
                  <div style={{ 
                    fontSize: '1.05rem', 
                    fontWeight: 800, 
                    color: selectedMember.condition && selectedMember.condition.toLowerCase() !== 'none' ? '#EF5350' : '#19B875',
                    marginBottom: selectedMember.ageAtDiagnosis ? '0.5rem' : 0,
                  }}>
                    {selectedMember.condition || 'None reported'}
                  </div>
                  {selectedMember.ageAtDiagnosis && (
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      Diagnosed at age <strong>{selectedMember.ageAtDiagnosis}</strong> years
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Notes */}
              {selectedMember.notes && (
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748B', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Clinical Notes
                  </div>
                  <div style={{
                    padding: '1rem 1.125rem',
                    background: '#FAFBFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    color: '#475569',
                    lineHeight: 1.6,
                  }}>
                    {selectedMember.notes}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={() => setSelectedMember(null)}
                style={{
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitFork size={22} color="var(--primary-600)" />
            Family Health Tree & Hereditary Pattern Engine
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Maps multi-generational medical history to detect recurring familial disease clusters and suggest preventive screenings.
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
            <Plus size={16} /> Add Family Member
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.125rem', 
        marginBottom: '1.5rem',
      }}>
        <div className="card" style={{ padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: '#EEF6FF', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0,
          }}>
            <Users size={24} color="#1677E8" />
          </div>
          <div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F1B3D', lineHeight: 1 }}>
              {totalMembers}
            </div>
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B', marginTop: '0.25rem' }}>
              Family Members
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: '#FEF2F2', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0,
          }}>
            <HeartPulse size={24} color="#EF5350" />
          </div>
          <div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F1B3D', lineHeight: 1 }}>
              {membersWithConditions}
            </div>
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B', marginTop: '0.25rem' }}>
              With Conditions
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: '#F5F3FF', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0,
          }}>
            <TrendingUp size={24} color="#7C3AED" />
          </div>
          <div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F1B3D', lineHeight: 1 }}>
              {uniqueConditions}
            </div>
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B', marginTop: '0.25rem' }}>
              Unique Conditions
            </div>
          </div>
        </div>

        {averageAge > 0 && (
          <div className="card" style={{ padding: '1.125rem 1.375rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: '#ECFDF5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0,
            }}>
              <User size={24} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F1B3D', lineHeight: 1 }}>
                {averageAge}
              </div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B', marginTop: '0.25rem' }}>
                Average Age
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hereditary Disease Pattern Alerts */}
      {/* Hereditary Disease Pattern Alerts */}
      {treeData.patterns.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {treeData.patterns.map((pat, idx) => (
            <div key={idx} className="alert-banner alert-banner-warning">
              <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                  Hereditary Pattern Detected: {pat.diseaseCategory} ({pat.affectedCount} relatives affected)
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                  {pat.recommendation}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85, fontStyle: 'italic' }}>
                  Notice: {pat.disclaimer}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Form Modal / Panel */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Record Relative Medical History</h4>
          <form onSubmit={handleAddMember}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Relation *</label>
                <select className="form-select" value={relation} onChange={(e) => setRelation(e.target.value)}>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Grandfather">Grandfather (Paternal/Maternal)</option>
                  <option value="Grandmother">Grandmother (Paternal/Maternal)</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Other">Other Relative</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Verma" />
              </div>

              <div className="form-group">
                <label className="form-label">Current Age</label>
                <input className="form-input" type="number" min="0" max="120" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 68" />
              </div>

              <div className="form-group">
                <label className="form-label">Diagnosed Condition / Disease</label>
                <input className="form-input" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Cardiovascular Disease, Diabetes, None" />
              </div>

              <div className="form-group">
                <label className="form-label">Age at Diagnosis</label>
                <input className="form-input" type="number" min="0" max="120" value={ageAtDiagnosis} onChange={(e) => setAgeAtDiagnosis(e.target.value)} placeholder="e.g. 52" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Clinical Notes / Interventions</label>
              <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Underwent angioplasty; currently on statin" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Saving...' : 'Save Family Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visual Family Tree Controls & Container */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px 12px 0 0',
          border: '1px solid #e2e8f0',
          borderBottom: 'none',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Pedigree View</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>({Math.round(zoomLevel * 100)}%)</span>
        </div>

        {/* Compact Controls (+, -, Fit Tree, Reset View) */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: '#0f172a',
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: '#0f172a',
            }}
          >
            −
          </button>
          <button
            type="button"
            onClick={handleFitTree}
            title="Fit Tree"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '0 0.6rem',
              height: '32px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#0f172a',
            }}
          >
            Fit Tree
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset View"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '0 0.6rem',
              height: '32px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#0f172a',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '2rem 1.5rem',
          background: '#fafbfc',
          borderRadius: '0 0 16px 16px',
          borderTop: 'none',
          touchAction: 'pan-x pan-y',
        }}
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: '580px',
          }}
        >
        {/* Generation 1: Grandparents */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Generation I: Grandparents
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {treeData.grouped.grandparents.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No grandparent records entered</span>
            ) : (
              treeData.grouped.grandparents.map(renderNode)
            )}
          </div>
        </div>

        {/* Visual Line */}
        <div style={{ width: '2px', height: '20px', background: 'var(--border-light)', margin: '0 auto 1.5rem auto' }}></div>

        {/* Generation 2: Parents */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Generation II: Parents
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {treeData.grouped.parents.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No parent records entered</span>
            ) : (
              treeData.grouped.parents.map(renderNode)
            )}
          </div>
        </div>

        {/* Visual Line */}
        <div style={{ width: '2px', height: '20px', background: 'var(--border-light)', margin: '0 auto 1.5rem auto' }}></div>

        {/* Generation 3: Patient & Siblings */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Generation III: Patient & Siblings
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Patient Node */}
            <div 
              className="tree-node patient-node"
              style={{
                background: 'linear-gradient(135deg, #EBF8FF 0%, #E0F2FE 100%)',
                border: '3px solid #1677E8',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                minWidth: '260px',
                boxShadow: '0 8px 24px rgba(22, 119, 232, 0.15)',
                position: 'relative',
              }}
            >
              {/* Badge */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1677E8',
                color: 'white',
                padding: '0.3rem 0.875rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                boxShadow: '0 4px 12px rgba(22, 119, 232, 0.3)',
              }}>
                PRIMARY PATIENT
              </div>

              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.5rem',
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1677E8 0%, #0EA5E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(22, 119, 232, 0.25)',
                }}>
                  {treeData.patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '1.175rem', fontWeight: 800, color: '#0F1B3D', marginBottom: '0.25rem' }}>
                    {treeData.patient.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600 }}>
                    {treeData.patient.healthId}
                  </div>
                </div>
              </div>

              <div style={{ 
                height: '1px', 
                background: '#BFDBFE', 
                margin: '0.875rem 0',
              }}></div>

              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.4rem',
                }}>
                  Chronic Conditions
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 700,
                  color: treeData.patient.chronicConditions ? '#EA580C' : '#059669',
                  lineHeight: 1.3,
                }}>
                  {treeData.patient.chronicConditions || 'None reported'}
                </div>
              </div>
            </div>

            {/* Siblings */}
            {treeData.grouped.siblings.map(renderNode)}
          </div>
        </div>

        {/* Generation 4: Children (if any) */}
        {treeData.grouped.children.length > 0 && (
          <>
            <div style={{ width: '2px', height: '20px', background: 'var(--border-light)', margin: '0 auto 1.5rem auto' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Generation IV: Children
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                {treeData.grouped.children.map(renderNode)}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

