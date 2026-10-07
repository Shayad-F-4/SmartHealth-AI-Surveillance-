import React, { useState } from 'react';
import { X, PhoneCall, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface EmergencyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { primaryName: string; primaryRelation: string; primaryPhone: string; secondaryName?: string; secondaryRelation?: string; secondaryPhone?: string }) => Promise<void>;
  initialData: {
    primaryName: string;
    primaryRelation: string;
    primaryPhone: string;
    secondaryName?: string;
    secondaryRelation?: string;
    secondaryPhone?: string;
  };
}

export const EmergencyContactModal: React.FC<EmergencyContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState({
    primaryName: initialData.primaryName || '',
    primaryRelation: initialData.primaryRelation || 'Father',
    primaryPhone: initialData.primaryPhone || '',
    secondaryName: initialData.secondaryName || '',
    secondaryRelation: initialData.secondaryRelation || 'Mother',
    secondaryPhone: initialData.secondaryPhone || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.primaryName || !formData.primaryPhone) {
      setError('Primary Emergency Contact Name and Phone Number are required.');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update emergency contacts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          margin: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #881337 0%, #4c0519 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 12, background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneCall size={20} color="#fecdd3" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Edit Emergency Contact
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#fecdd3', margin: '0.2rem 0 0 0' }}>
                Updates Patient Profile, Smart Health Card &amp; Emergency Lookup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: 10,
              padding: '0.4rem',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 12,
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#be123c',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} color="#be123c" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Emergency Contact */}
          <div style={{ padding: '1rem', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#be123c' }}>
                Primary Emergency Contact
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 999, background: '#ffe4e6', color: '#9f1239' }}>
                Required
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.primaryName}
                  onChange={(e) => setFormData({ ...formData, primaryName: e.target.value })}
                  placeholder="e.g. Amit Verma"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Relationship
                </label>
                <select
                  value={formData.primaryRelation}
                  onChange={(e) => setFormData({ ...formData, primaryRelation: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none' }}
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Relative">Relative</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.primaryPhone}
                onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                placeholder="+91 98765 43210"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none' }}
                required
              />
            </div>
          </div>

          {/* Secondary Emergency Contact (Optional) */}
          <div style={{ padding: '1rem', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Secondary Emergency Contact
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 999, background: '#e2e8f0', color: '#475569' }}>
                Optional
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.secondaryName}
                  onChange={(e) => setFormData({ ...formData, secondaryName: e.target.value })}
                  placeholder="e.g. Neha Verma"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Relationship
                </label>
                <select
                  value={formData.secondaryRelation}
                  onChange={(e) => setFormData({ ...formData, secondaryRelation: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none' }}
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Relative">Relative</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.secondaryPhone}
                onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                placeholder="+91 87654 32109"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <ShieldCheck size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.78rem', color: '#1e3a8a', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
              Updating these details will immediately synchronize your <strong>Smart Health Card</strong>, <strong>Emergency Profile</strong>, and public emergency lookup QR system.
            </p>
          </div>

          {/* Footer Actions */}
          <div style={{ paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#64748b',
                background: 'transparent',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.25rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'white',
                background: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
                border: 'none',
                borderRadius: 10,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Save Emergency Contact
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
