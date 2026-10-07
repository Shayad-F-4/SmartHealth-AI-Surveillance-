import React, { useState } from 'react';
import {
  TrendingUp,
  Brain,
  Sparkles,
  Activity,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { HealthTrendsPage } from './HealthTrendsPage';
import { AIRiskPage } from './AIRiskPage';

interface HealthInsightsPageProps {
  initialTab?: 'trends' | 'ai-risk';
  patientId?: string;
  onNavigateToRecord?: (recordId: string) => void;
}

export const HealthInsightsPage: React.FC<HealthInsightsPageProps> = ({
  initialTab = 'trends',
  patientId,
  onNavigateToRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'ai-risk'>(initialTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Main Insights Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={26} color="#0284c7" /> Health Insights
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Consolidated intelligence: Longitudinal health trends, vital trajectories, and AI-assisted cardiometabolic risk analysis.
          </p>
        </div>

        {/* Sub-tab Switcher: Trends | AI Risk */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveTab('trends')}
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
              background: activeTab === 'trends' ? '#ffffff' : 'transparent',
              color: activeTab === 'trends' ? '#0369a1' : '#64748b',
              boxShadow: activeTab === 'trends' ? '0 2px 6px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <TrendingUp size={16} color={activeTab === 'trends' ? '#0284c7' : '#64748b'} />
            Health Trends
          </button>
          <button
            onClick={() => setActiveTab('ai-risk')}
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
              background: activeTab === 'ai-risk' ? '#ffffff' : 'transparent',
              color: activeTab === 'ai-risk' ? '#7c3aed' : '#64748b',
              boxShadow: activeTab === 'ai-risk' ? '0 2px 6px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Brain size={16} color={activeTab === 'ai-risk' ? '#7c3aed' : '#64748b'} />
            AI Health Risk
          </button>
        </div>
      </div>

      {/* ── Active Tab View ─────────────────────────────────────────── */}
      <div>
        {activeTab === 'trends' ? (
          <HealthTrendsPage patientId={patientId} onNavigateToRecord={onNavigateToRecord} />
        ) : (
          <AIRiskPage patientId={patientId} />
        )}
      </div>
    </div>
  );
};

export default HealthInsightsPage;
