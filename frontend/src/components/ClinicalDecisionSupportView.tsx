import React, { useEffect, useState, useCallback } from 'react';
import {
  Brain,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  RefreshCw,
  FileText,
  Activity,
  ArrowRight,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../services/api';

interface CDSEvidenceItem {
  type: string;
  id: string;
  label: string;
  date?: string;
  value?: string | number;
  reference?: string;
}

interface ClinicalSignal {
  id: string;
  type: string;
  severity: 'INFO' | 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  clinicalRationale: string;
  evidence: CDSEvidenceItem[];
  suggestedConsideration: string;
  relevantMedicalTopic?: string;
}

interface CarePathwayStep {
  stepNumber: number;
  stage: string;
  title: string;
  description: string;
  suggestedAction: string;
  isActionable: boolean;
  actionType?: string;
}

interface CDSData {
  patientId: string;
  healthId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  generatedAt: string;
  generatedBy: string;
  clinicalSummary: string;
  overallSeverity: 'INFO' | 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
  signals: ClinicalSignal[];
  riskContext: {
    level: string;
    score: number;
    source: string;
    summary?: string;
    contributingFactors?: any[];
  };
  carePathway: {
    status: string;
    rationale: string;
    steps: CarePathwayStep[];
  };
  knowledgeSources: Array<{
    documentId: string;
    chunkId: string;
    source: string;
    title: string;
    section: string;
    sourceUrl?: string;
    relevanceScore: number;
  }>;
  limitations: string[];
  requiresClinicianReview: boolean;
  reviewStatus: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
}

interface ClinicalDecisionSupportViewProps {
  patientId: string;
  mode?: 'doctor' | 'patient';
  onLaunchConsultation?: () => void;
}

export const ClinicalDecisionSupportView: React.FC<ClinicalDecisionSupportViewProps> = ({
  patientId,
  mode = 'doctor',
  onLaunchConsultation,
}) => {
  const [cdsData, setCdsData] = useState<CDSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>('PENDING');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchCDS = useCallback(async () => {
    try {
      const endpoint =
        mode === 'doctor'
          ? `/doctors/patients/${patientId}/clinical-decision-support`
          : `/patients/clinical-decision-support/${patientId}`;

      const res = await api.get(endpoint);
      setCdsData(res.data);
      setReviewStatus(res.data.reviewStatus || 'PENDING');
    } catch (err) {
      console.error('Failed to load Clinical Decision Support:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, mode]);

  useEffect(() => {
    fetchCDS();
  }, [fetchCDS]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCDS();
  };

  const handleRecordReview = async (newStatus: 'REVIEWED' | 'ACTIONED' | 'DISMISSED') => {
    setSubmittingReview(true);
    try {
      await api.post(`/doctors/patients/${patientId}/clinical-decision-support/review`, {
        reviewStatus: newStatus,
        clinicianNotes: `Reviewed via Doctor Portal on ${new Date().toLocaleDateString()}`,
      });
      setReviewStatus(newStatus);
    } catch (err) {
      console.error('Failed to update CDS review status:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin" style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--primary-600)' }} />
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>
          Synthesizing Clinical Signals &amp; Care Pathway...
        </h4>
        <p style={{ fontSize: '0.85rem', margin: 0 }}>
          Evaluating longitudinal trends, Random Forest risk factors, and authoritative medical knowledge guidelines.
        </p>
      </div>
    );
  }

  if (!cdsData) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Clinical Decision Support data currently unavailable for this patient record.
      </div>
    );
  }

  const isUrgent = cdsData.carePathway.status === 'URGENT_CLINICAL_REVIEW';
  const isReviewRecommended = cdsData.carePathway.status === 'REVIEW_RECOMMENDED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Top Header & Status ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Brain size={18} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Clinical Decision Support &amp; Care Pathway
            </h3>
            <span
              className={`badge ${
                isUrgent ? 'badge-danger' : isReviewRecommended ? 'badge-warning' : 'badge-success'
              }`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              {cdsData.carePathway.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            {mode === 'doctor'
              ? 'Multi-dimensional clinical correlation integrating verified EHR vitals, longitudinal laboratory trajectories, and ML risk telemetry.'
              : 'Educational decision-support summary designed to assist you and your doctor in proactive health planning.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Engine Attribution Badge */}
          <div style={{
            fontSize: '0.74rem',
            padding: '0.3rem 0.65rem',
            borderRadius: 6,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <Sparkles size={13} color="var(--primary-600)" />
            <span>{cdsData.generatedBy}</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-outline"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            Refresh Signals
          </button>
        </div>
      </div>

      {/* ── Status Banner (Urgent or Review Recommended) ─────────────────── */}
      <div
        style={{
          borderRadius: 10,
          padding: '1.25rem',
          border: isUrgent ? '1px solid #fecdd3' : isReviewRecommended ? '1px solid #fef08a' : '1px solid #bbf7d0',
          background: isUrgent ? '#fff1f2' : isReviewRecommended ? '#fefce8' : '#f0fdf4',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          {isUrgent ? (
            <ShieldAlert size={26} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
          ) : isReviewRecommended ? (
            <AlertTriangle size={26} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          ) : (
            <CheckCircle2 size={26} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
          )}

          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isUrgent ? '#9f1239' : isReviewRecommended ? '#854d0e' : '#166534', marginBottom: '0.2rem' }}>
              {isUrgent
                ? 'Clinical Alert: Urgent Findings Warrant Immediate Clinician Attention'
                : isReviewRecommended
                ? 'Clinical Advisory: Multiple Longitudinal Variances Warrant Review'
                : 'Baseline Telemetry Stable: Continue Routine Maintenance'}
            </div>
            <p style={{ fontSize: '0.84rem', color: isUrgent ? '#be123c' : isReviewRecommended ? '#a16207' : '#15803d', margin: 0, lineHeight: 1.4 }}>
              {cdsData.carePathway.rationale}
            </p>
          </div>
        </div>

        {/* Doctor Review Actions */}
        {mode === 'doctor' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              REVIEW STATUS:
            </span>
            <span
              className={`badge ${
                reviewStatus === 'REVIEWED'
                  ? 'badge-success'
                  : reviewStatus === 'ACTIONED'
                  ? 'badge-purple'
                  : 'badge-warning'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              {reviewStatus}
            </span>

            {reviewStatus === 'PENDING' && (
              <button
                onClick={() => handleRecordReview('REVIEWED')}
                disabled={submittingReview}
                className="btn btn-outline"
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', background: '#ffffff' }}
              >
                ✓ Mark Reviewed
              </button>
            )}

            {onLaunchConsultation && (
              <button
                onClick={onLaunchConsultation}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
              >
                <Stethoscope size={14} /> Start Consultation
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Executive CDS Narrative Synthesis Card ───────────────────────── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#ffffff', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FileText size={17} color="var(--primary-600)" />
            Clinical Synthesis &amp; Decision-Support Briefing
          </h4>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Evaluated: {new Date(cdsData.generatedAt).toLocaleString()}
          </span>
        </div>

        <div style={{
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: 'var(--text-main)',
          background: '#f8fafc',
          padding: '1.1rem',
          borderRadius: 8,
          border: '1px solid var(--border-light)',
          whiteSpace: 'pre-line',
        }}>
          {cdsData.clinicalSummary}
        </div>
      </div>

      {/* ── Active Clinical Signals ──────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h4 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
              <Activity size={18} color="var(--primary-600)" />
              Detected Clinical Signals ({cdsData.signals.length})
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Deterministic flags derived from EHR laboratory panels, biometric vitals, and ML risk telemetry.
            </span>
          </div>
          <span className="badge badge-info">Evidence Grounded</span>
        </div>

        {cdsData.signals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No clinical anomalies, persistent variances, or preventive care gaps detected.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cdsData.signals.map((sig) => (
              <div
                key={sig.id}
                style={{
                  border: '1px solid var(--border-light)',
                  borderLeft:
                    sig.severity === 'URGENT'
                      ? '5px solid #e11d48'
                      : sig.severity === 'HIGH'
                      ? '5px solid #f97316'
                      : sig.severity === 'MODERATE'
                      ? '5px solid #eab308'
                      : '5px solid #0284c7',
                  borderRadius: 10,
                  padding: '1.15rem',
                  background: '#fafafa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className={`badge ${
                        sig.severity === 'URGENT'
                          ? 'badge-danger'
                          : sig.severity === 'HIGH'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {sig.severity}
                    </span>
                    <h5 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {sig.title}
                    </h5>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {sig.type.replace(/_/g, ' ')}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.45, margin: '0 0 0.6rem' }}>
                  {sig.description}
                </p>

                {/* Pathophysiology & Rationale */}
                <div style={{ fontSize: '0.82rem', color: '#475569', background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: 6, marginBottom: '0.65rem' }}>
                  <strong>Clinical Rationale:</strong> {sig.clinicalRationale}
                </div>

                {/* Consideration */}
                <div style={{ fontSize: '0.82rem', color: '#1e3a8a', background: '#eff6ff', padding: '0.65rem 0.85rem', borderRadius: 6, marginBottom: '0.75rem', border: '1px solid #dbeafe' }}>
                  <strong>Clinician Consideration:</strong> {sig.suggestedConsideration}
                </div>

                {/* Supporting Evidence Chips */}
                {sig.evidence && sig.evidence.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      SUPPORTING EVIDENCE:
                    </span>
                    {sig.evidence.map((ev, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 4,
                          background: '#ffffff',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          fontWeight: 600,
                        }}
                      >
                        {ev.label} {ev.reference ? `(Ref: ${ev.reference})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Care Pathway Intelligence (Sequential Timeline) ──────────────── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h4 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
              <Layers size={18} color="var(--primary-600)" />
              Evidence-Based Care Pathway Sequence
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Structured follow-up consideration pathway based on clinical signals and practice standards.
            </span>
          </div>
          <span className="badge badge-purple">5-Stage Protocol</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cdsData.carePathway.steps.map((step) => (
            <div
              key={step.stepNumber}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                borderRadius: 8,
                border: '1px solid var(--border-light)',
                background: step.stepNumber === 1 ? '#f8fafc' : '#ffffff',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--primary-600)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {step.stepNumber}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {step.title}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {step.stage.replace(/_/g, ' ')}
                  </span>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 0.4rem' }}>
                  {step.description}
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                  &rarr; <em>Action Consideration:</em> {step.suggestedAction}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Medical Knowledge RAG Guidelines ─────────────────────────────── */}
      {cdsData.knowledgeSources && cdsData.knowledgeSources.length > 0 && (
        <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: '0 0 0.75rem' }}>
            <BookOpen size={16} /> Correlated Clinical Guidelines (WHO / ADA / AHA)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {cdsData.knowledgeSources.map((ks, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d8b4fe',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#581c87' }}>
                    {ks.source}: {ks.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Section: {ks.section} &bull; Relevance Match: {Math.round(ks.relevanceScore * 100)}%
                  </div>
                </div>

                {ks.sourceUrl && (
                  <a
                    href={ks.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#6b21a8', borderColor: '#d8b4fe', gap: '0.3rem' }}
                  >
                    View Guideline <ExternalLink size={11} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Governance Limitations & Clinical Disclaimer ──────────────────── */}
      <div style={{ padding: '1rem', borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Info size={13} color="var(--primary-600)" /> CLINICAL DECISION SUPPORT SAFETY NOTICE
        </div>
        {cdsData.limitations.map((lim, i) => (
          <div key={i}>&bull; {lim}</div>
        ))}
      </div>
    </div>
  );
};

export default ClinicalDecisionSupportView;
