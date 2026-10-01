import React, { useEffect, useState } from 'react';
import { History, Shield, Filter, Search } from 'lucide-react';
import api from '../../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit', {
        params: { action: actionFilter, role: roleFilter, page, limit: 25 },
      });
      setLogs(res.data.logs);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, roleFilter, page]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <History size={24} color="var(--primary-600)" /> Security & Privacy Audit Trail
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Immutable HIPAA/GDPR-aligned access log tracking patient records access, consultation creations, and administrative interventions.
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Action Filter:</span>
          <select className="form-select" style={{ width: 'auto' }} value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Actions</option>
            <option value="VIEW_PATIENT_RECORD">View Patient Record</option>
            <option value="CREATE_VISIT">Create Visit</option>
            <option value="LOGIN">User Login</option>
            <option value="REGISTER">User Register</option>
            <option value="CREATE_COMMUNITY_ALERT">Create Alert</option>
            <option value="CREATE_HEALTH_CAMP">Create Health Camp</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Role:</span>
          <select className="form-select" style={{ width: 'auto' }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Roles</option>
            <option value="DOCTOR">Doctor</option>
            <option value="PATIENT">Patient</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events logged under current filters.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details & Context</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <strong>{log.user?.name || 'Anonymous / System'}</strong>
                      {log.user?.email && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{log.user.email}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${log.userRole === 'ADMIN' ? 'badge-purple' : (log.userRole === 'DOCTOR' ? 'badge-info' : 'badge-success')}`}>
                        {log.userRole || 'SYSTEM'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700 }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">{log.resource}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', maxWidth: '320px' }}>
                      {log.details || '&mdash;'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              &larr; Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
