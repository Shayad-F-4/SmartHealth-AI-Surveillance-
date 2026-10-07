import React from 'react';
import { ShieldCheck, Lock, Building, Key, Clock, UserCheck, ShieldAlert } from 'lucide-react';

interface AdminRoleAccessCardProps {
  roleName?: string;
  department?: string;
  organization?: string;
  accessLevel?: string;
  accountStatus?: string;
  lastLogin?: string;
}

export const AdminRoleAccessCard: React.FC<AdminRoleAccessCardProps> = ({
  roleName = 'Administrator',
  department = 'IT & System Management',
  organization = 'SmartHealth Surveillance System',
  accessLevel = 'Full System Access (Super Admin)',
  accountStatus = 'ACTIVE',
  lastLogin = 'Today, 04:55 PM'
}) => {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: 10, background: '#f3e8ff', border: '1px solid #e9d5ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0' }}>System Role &amp; RBAC Governance</h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, fontWeight: 500 }}>Real-time system privileges and security context</p>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></span>
          {accountStatus}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Lock size={13} color="#7e22ce" />
            System Role
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{roleName}</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Assigned via RBAC Security Matrix</p>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Building size={13} color="#7e22ce" />
            Department &amp; Org
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{department}</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>{organization}</p>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Key size={13} color="#7e22ce" />
            Access Level
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{accessLevel}</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Includes Patient Records, Doctors &amp; Surveillance Audits</p>
        </div>

        <div style={{ padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Clock size={13} color="#7e22ce" />
            Last Security Login
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{lastLogin}</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>IP: 192.168.1.104 (Verified Session)</p>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: 12, background: '#faf5ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
        <ShieldAlert size={16} color="#7e22ce" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.78rem', color: '#581c87', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
          <strong>Security Notice:</strong> Administrative access levels and RBAC role assignments are governed strictly by system policy. Admins cannot modify or downgrade their own security access level via profile settings.
        </p>
      </div>
    </div>
  );
};
