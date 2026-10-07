import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  FileText,
  FlaskConical,
  Pill,
  Activity,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api';
import { HealthAssistantAvatar3D } from '../../components/HealthAssistantAvatar3D';

const FloatingHealthRobot = React.lazy(() => import('../../components/FloatingHealthRobot'));

interface SourceItem {
  id: string;
  type:
    | 'LAB_REPORT'
    | 'MEDICAL_RECORD'
    | 'PRESCRIPTION'
    | 'DISEASE_EPISODE'
    | 'RISK_PREDICTION'
    | 'MEDICAL_KNOWLEDGE';
  label: string;
  date?: string;
  source?: string;
  section?: string;
  sourceUrl?: string;
  relevanceScore?: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: string;
  answerType?: 'PATIENT_RECORD' | 'MEDICAL_KNOWLEDGE' | 'HYBRID_ANSWER';
  sources?: SourceItem[];
  limitations?: string[];
  requiresMedicalAttention?: boolean;
  providerUsed?: string;
  retrieval?: {
    used: boolean;
    chunksRetrieved: number;
    topSource?: string;
  };
}

const QUICK_ACTIONS = [
  { label: 'Ask about my latest labs', query: 'What are my latest lab results?' },
  { label: 'Explain my risk', query: 'Explain my current ML health risk prediction and contributing factors.' },
  { label: 'What changed recently?', query: 'What health measurements or records have changed recently in my history?' },
  { label: 'Ask a health question', query: 'What is the difference between normal and elevated blood pressure?' },
];

export const AIAssistantPage: React.FC<{ patientId?: string; onNavigateTab?: (tab: string) => void }> = ({
  patientId,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Hello! I am your SmartHealth AI Assistant. I can help explain your personal health records (labs, medications, risk trends) and retrieve authoritative clinical guidelines from WHO, CDC, and NIH.\n\nHow can I help you understand your health today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      answerType: 'MEDICAL_KNOWLEDGE',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocusChat = () => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);
    setAvatarState('thinking');

    try {
      const res = await api.post('/ai/chat', {
        question: query,
        targetPatientId: patientId,
      });

      const data = res.data;
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        answerType: data.answerType,
        sources: data.sources,
        limitations: data.limitations,
        requiresMedicalAttention: data.requiresMedicalAttention,
        providerUsed: data.providerUsed,
        retrieval: data.retrieval,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setAvatarState('speaking');
      setTimeout(() => {
        setAvatarState('idle');
      }, 4000);
    } catch (err: any) {
      console.error('Failed to query AI Assistant:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I apologize, but I encountered an error communicating with the SmartHealth assistant. Please ensure backend services are active and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setAvatarState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceClick = (source: SourceItem) => {
    if (source.type === 'MEDICAL_KNOWLEDGE') {
      if (source.sourceUrl) {
        window.open(source.sourceUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (!onNavigateTab) return;
    if (source.type === 'LAB_REPORT') onNavigateTab('records');
    else if (source.type === 'MEDICAL_RECORD') onNavigateTab('records');
    else if (source.type === 'PRESCRIPTION') onNavigateTab('records');
    else if (source.type === 'RISK_PREDICTION') onNavigateTab('health-insights');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1rem' }}>
      {/* ── 3D Floating Assistant Hero Section ───────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              setMessages([messages[0]]);
              setAvatarState('idle');
            }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: 'white',
              color: '#64748b',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* 3D Floating Avatar */}
        <div style={{ marginBottom: '0.25rem' }}>
          <HealthAssistantAvatar3D state={avatarState} size={130} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: avatarState === 'thinking' ? '#f59e0b' : avatarState === 'speaking' ? '#10b981' : '#0284c7',
              boxShadow: `0 0 8px ${avatarState === 'thinking' ? '#f59e0b' : avatarState === 'speaking' ? '#10b981' : '#0284c7'}`,
            }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {avatarState === 'thinking' ? 'Processing clinical records...' : avatarState === 'speaking' ? 'Explaining findings...' : 'SmartHealth Assistant Online'}
          </span>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
          &ldquo;Hi, how can I help you understand your health?&rdquo;
        </h3>

        {/* Quick Action Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.25rem' }}>
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(action.query)}
              disabled={isLoading}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 999,
                border: '1px solid #bfdbfe',
                background: '#ffffff',
                color: '#0284c7',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e0f2fe';
                e.currentTarget.style.borderColor = '#93c5fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#bfdbfe';
              }}
            >
              <Sparkles size={13} /> {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div
        className="card"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Messages Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg) => {
            const ehrSources = msg.sources?.filter((s) => s.type !== 'MEDICAL_KNOWLEDGE') || [];
            const knowledgeSources = msg.sources?.filter((s) => s.type === 'MEDICAL_KNOWLEDGE') || [];

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: msg.sender === 'user' ? '80%' : '88%',
                }}
              >
                {msg.sender === 'assistant' && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <Bot size={20} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                  {/* Assistant Answer Type Badges */}
                  {msg.sender === 'assistant' && msg.answerType && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {msg.answerType === 'MEDICAL_KNOWLEDGE' && (
                        <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                          <BookOpen size={12} /> Medical Knowledge RAG (WHO/CDC/NIH)
                        </span>
                      )}
                      {msg.answerType === 'HYBRID_ANSWER' && (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                          <Sparkles size={12} /> Hybrid: Patient EHR + Reference Guidelines
                        </span>
                      )}
                      {msg.answerType === 'PATIENT_RECORD' && (
                        <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                          <ShieldCheck size={12} /> Verified Patient EHR
                        </span>
                      )}

                      {/* RAG Chunks Retrieved Badge */}
                      {msg.retrieval?.used && msg.retrieval.chunksRetrieved > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#6d28d9', background: '#faf5ff', border: '1px solid #e9d5ff', padding: '0.15rem 0.5rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <BookOpen size={11} /> Grounded on {msg.retrieval.chunksRetrieved} guideline section(s)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    style={{
                      padding: '0.9rem 1.2rem',
                      borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: msg.sender === 'user' ? '#0284c7' : '#f8fafc',
                      color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                      border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                      fontSize: '0.92rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Urgency Warning Banner */}
                  {msg.requiresMedicalAttention && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.6rem 0.85rem', borderRadius: 8, color: '#991b1b', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={16} color="#dc2626" /> Urgent Medical Notice: Symptoms or abnormal vitals warrant prompt professional clinical review.
                    </div>
                  )}

                  {/* 1. Verified EHR Sources Box */}
                  {ehrSources.length > 0 && (
                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ShieldCheck size={13} /> Verified Patient EHR Sources ({ehrSources.length}):
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {ehrSources.map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSourceClick(s)}
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: 6,
                              background: '#ffffff',
                              border: '1px solid #93c5fd',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#1e40af',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            {s.type === 'LAB_REPORT' && <FlaskConical size={12} />}
                            {s.type === 'MEDICAL_RECORD' && <FileText size={12} />}
                            {s.type === 'PRESCRIPTION' && <Pill size={12} />}
                            {s.type === 'RISK_PREDICTION' && <Activity size={12} />}
                            <span>{s.label}</span>
                            <ExternalLink size={10} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Medical Knowledge RAG Sources Box */}
                  {knowledgeSources.length > 0 && (
                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <BookOpen size={13} /> Authoritative Medical Reference Citations ({knowledgeSources.length}):
                      </div>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {knowledgeSources.map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSourceClick(s)}
                            title={s.sourceUrl ? 'Click to view official clinical source' : undefined}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: 6,
                              background: '#ffffff',
                              border: '1px solid #d8b4fe',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#6b21a8',
                              cursor: s.sourceUrl ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span style={{ fontWeight: 800, color: '#581c87', background: '#f3e8ff', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                              {s.source || 'WHO'}
                            </span>
                            <span>{s.section || s.label}</span>
                            {s.relevanceScore !== undefined && (
                              <span style={{ fontSize: '0.68rem', color: '#9333ea', fontWeight: 700 }}>
                                ({Math.round(s.relevanceScore * 100)}% match)
                              </span>
                            )}
                            {s.sourceUrl && <ExternalLink size={11} color="#7e22ce" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta info footer */}
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', gap: '0.5rem', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <span>{msg.timestamp}</span>
                    {msg.providerUsed && <span>&bull; {msg.providerUsed}</span>}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
                    <User size={20} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Bot size={20} className="spin" />
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                Synthesizing query with Intent Routing &amp; RAG Knowledge Retrieval...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>



        {/* Input Bar */}
        <div style={{ padding: '0.85rem 1rem', background: 'white', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your lab results, prescriptions, or medical topics (e.g. 'What is hypertension?', 'My HbA1c is high')..."
            disabled={isLoading}
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#0f172a', outline: 'none' }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputQuery.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 10,
              border: 'none',
              background: isLoading || !inputQuery.trim() ? '#cbd5e1' : 'linear-gradient(135deg,#0284c7 0%,#2563eb 100%)',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: isLoading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: isLoading || !inputQuery.trim() ? 'none' : '0 4px 12px rgba(2,132,199,0.3)',
            }}
          >
            <Send size={16} /> Send
          </button>
        </div>
      </div>

      {/* ── 3D Floating Health Robot (Bottom-Right Assistant) ───────────── */}
      <React.Suspense fallback={null}>
        <FloatingHealthRobot state={avatarState} onFocusChat={handleFocusChat} />
      </React.Suspense>
    </div>
  );
};

export default AIAssistantPage;
