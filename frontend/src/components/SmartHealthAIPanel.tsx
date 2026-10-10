import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, AlertCircle, RefreshCw, FileText, FlaskConical, Pill, Activity, Calendar, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SmartHealthAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: any[];
  limitations?: string[];
}

export const SmartHealthAIPanel: React.FC<SmartHealthAIPanelProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user } = useAuth();
  const patientName = user?.name || 'Patient';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'assistant',
          text: `Hi ${patientName} 👋\nHow can I help you with your health information today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, patientName, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Auto focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickActions = [
    { label: 'Analyze my recent reports', query: 'Analyze my recent medical reports and summarize key findings.' },
    { label: 'Explain my lab results', query: 'Explain my latest lab test results and what they mean.' },
    { label: 'What does my health risk mean?', query: 'Explain my AI health risk assessment score and risk factors.' },
    { label: 'Summarize my medical history', query: 'Summarize my recorded medical history and disease timeline.' },
    { label: 'Explain my medications', query: 'List and explain my active prescriptions and medication dosages.' },
    { label: 'Show my recent appointments', query: 'What are my upcoming or recent medical appointments?' },
    { label: 'Give me general lifestyle guidance', query: 'What general health recommendations and lifestyle tips should I follow?' },
  ];

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

    try {
      const res = await api.post('/ai/chat', {
        question: query,
      });

      const data = res.data;
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I have analyzed your request based on your available medical records.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources,
        limitations: data.limitations,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Failed to query SmartHealth AI:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I encountered an issue connecting to the AI service. Please ensure your internet connection is active and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '520px',
          height: '92vh',
          maxHeight: '780px',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 40px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'aiPanelSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Header Section ────────────────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '1.2rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1677e8 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(22, 119, 232, 0.4)',
              }}
            >
              <Bot size={24} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                SmartHealth AI
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
                Your Personal Health Guide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Panel"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── 2. Scrollable Messages Body ───────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.125rem',
            background: '#f8fafc',
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: '0.625rem',
                  alignItems: 'flex-start',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#1677e8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Bot size={18} color="#ffffff" />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '82%',
                    background: isUser ? '#1677e8' : '#ffffff',
                    color: isUser ? '#ffffff' : '#0f172a',
                    padding: '0.875rem 1.125rem',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    boxShadow: isUser ? '0 4px 12px rgba(22,119,232,0.25)' : '0 2px 8px rgba(15,23,42,0.06)',
                    border: isUser ? 'none' : '1px solid #e2e8f0',
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <div>{msg.text}</div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: isUser ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                      marginTop: '0.35rem',
                      textAlign: 'right',
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#1677e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bot size={18} color="#ffffff" />
              </div>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '0.75rem 1.125rem',
                  fontSize: '0.85rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                }}
              >
                <Sparkles size={16} color="#1677e8" style={{ animation: 'spin 2s linear infinite' }} />
                <span>SmartHealth AI is thinking...</span>
              </div>
            </div>
          )}

          {/* ── Quick Action Pills (Shown above chat input) ──────────────── */}
          {messages.length < 5 && !isLoading && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Suggested Quick Actions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {quickActions.map((act, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(act.query)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '20px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(15,23,42,0.03)',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1677e8';
                      e.currentTarget.style.background = '#f0f7ff';
                      e.currentTarget.style.color = '#1677e8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.color = '#0f172a';
                    }}
                  >
                    ✨ {act.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* ── 3. Sticky Input Area & Disclaimer ─────────────────────────── */}
        <div
          style={{
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '0.875rem 1.125rem 1.125rem 1.125rem',
            flexShrink: 0,
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask SmartHealth AI about your health..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.75rem 1.125rem',
                borderRadius: '24px',
                border: '1.5px solid #cbd5e1',
                outline: 'none',
                fontSize: '0.92rem',
                color: '#0f172a',
                background: '#f8fafc',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1677e8')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: isLoading || !inputQuery.trim() ? '#cbd5e1' : '#1677e8',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <Send size={18} />
            </button>
          </form>

          {/* AI Disclaimer */}
          <div
            style={{
              fontSize: '0.7rem',
              color: '#64748b',
              textAlign: 'center',
              marginTop: '0.75rem',
              lineHeight: 1.3,
            }}
          >
            ⚠️ AI-generated information is for decision support only and does not replace professional medical advice.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes aiPanelSlideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @media (min-width: 901px) {
          .ai-panel-wrapper {
            max-width: 480px !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
